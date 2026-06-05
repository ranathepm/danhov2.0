/**
 * Chat — Gemini-backed text advisor.
 *
 * Streaming via Server-Sent Events. The widget reads the stream chunk by
 * chunk for the typewriter feel. If the client sends `?stream=0` we fall
 * back to the legacy JSON response.
 *
 * Paid-tier active — token ceiling raised, history window extended,
 * multi-model fallback retained for transient errors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { knowledgeWithContext } from '@/lib/danhov-knowledge';
import {
  CHAT_MODEL_PRIMARY,
  CHAT_MODEL_FALLBACK,
  SAFETY_SETTINGS,
} from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(8000),
      })
    )
    .min(1),
  context: z.string().max(800).optional().default(''),
});

const MODELS = [CHAT_MODEL_PRIMARY, ...CHAT_MODEL_FALLBACK];

export async function POST(req: NextRequest) {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('chat: GEMINI_API_KEY missing');
    return NextResponse.json({ error: 'Service not configured' }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  // Gemini expects roles "user" / "model". Map "assistant" → "model".
  // The history MUST start with a "user" role — drop any leading "model"
  // entries (e.g. the canned WELCOME greeting injected by the widget).
  const recent = body.messages.slice(-60);
  const last = recent[recent.length - 1];
  const mapped = recent.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
  const firstUserIdx = mapped.findIndex((m) => m.role === 'user');
  const history = firstUserIdx === -1 ? [] : mapped.slice(firstUserIdx);

  const wantsStream = req.nextUrl.searchParams.get('stream') !== '0';

  // ── Streaming path (SSE) ────────────────────────────────────────────
  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        let lastError: unknown = null;
        for (const modelName of MODELS) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction: knowledgeWithContext(body.context),
              generationConfig: {
                maxOutputTokens: 1600,
                temperature: 0.7,
              },
              safetySettings: SAFETY_SETTINGS,
            });

            const chat = model.startChat({ history });
            const result = await chat.sendMessageStream(last.content);

            let any = false;
            for await (const chunk of result.stream) {
              let piece = '';
              try {
                piece = chunk.text();
              } catch {
                continue;
              }
              if (piece) {
                any = true;
                send('delta', { text: piece });
              }
            }

            if (!any) {
              lastError = new Error(`${modelName}: empty stream`);
              continue;
            }

            send('done', { model: modelName });
            controller.close();
            return;
          } catch (err) {
            lastError = err;
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`chat-stream: ${modelName} failed —`, msg);
            if (!/429|503|404|quota|exceeded|unavailable|not.found|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(msg)) break;
          }
        }

        const lastMsg =
          lastError instanceof Error ? lastError.message : String(lastError ?? 'unknown');
        console.error('chat-stream: all models failed —', lastMsg);
        send('error', {
          message: 'The advisor is briefly unavailable. Please try again in a moment.',
          detail: lastMsg,
          debug: process.env.NODE_ENV !== 'production' ? lastMsg : undefined,
        });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  // ── Legacy non-streaming path ──────────────────────────────────────
  let lastError: unknown = null;
  for (const modelName of MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: knowledgeWithContext(body.context),
        generationConfig: {
          maxOutputTokens: 1600,
          temperature: 0.7,
        },
        safetySettings: SAFETY_SETTINGS,
      });

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(last.content);

      let text = '';
      try {
        text = result.response.text();
      } catch (e) {
        console.error(`chat: ${modelName} returned an empty response:`, e);
      }

      if (!text || !text.trim()) {
        lastError = new Error(`${modelName}: empty response`);
        continue;
      }

      return NextResponse.json({ content: text, model: modelName });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`chat: ${modelName} failed —`, msg);
      lastError = err;
      if (!/429|503|404|quota|exceeded|unavailable|not.found|RESOURCE_EXHAUSTED|UNAVAILABLE/i.test(msg)) break;
    }
  }

  console.error('chat: all models failed', lastError);
  return NextResponse.json(
    { error: 'The advisor is briefly unavailable. Please try again in a moment.' },
    { status: 503 }
  );
}
