/**
 * Admin AI Product Command — natural language product modification via Gemini
 * function calling.
 *
 * POST /api/admin/products/ai-command
 * Body: { messages: [{role, content}][], context?: string }
 *
 * The model receives tools that let it:
 *   1. search_products  — find products by name/title keyword
 *   2. update_product   — update one or more fields on a product by SKU
 *   3. get_product      — fetch full details of a product by SKU
 *
 * Protected: admin session required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, FunctionCallingMode } from '@google/generative-ai';
import { getAdmin } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import { CHAT_MODEL_PRIMARY, SAFETY_SETTINGS } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Allowed fields for update ────────────────────────────────────────────────
const EDITABLE_FIELDS = [
  'name', 'description', 'price_display', 'images', 'metal_images',
  'metals', 'default_metal', 'collection', 'is_active',
] as const;

// ── Tool definitions ─────────────────────────────────────────────────────────
const tools = [
  {
    functionDeclarations: [
      {
        name: 'search_products',
        description: 'Search for products by name or keyword. Returns a list of matching products with their SKU, name, and current field values.',
        parameters: {
          type: 'OBJECT',
          properties: {
            query: {
              type: 'STRING',
              description: 'The search term — product name, collection, or any keyword.',
            },
            limit: {
              type: 'NUMBER',
              description: 'Maximum number of results to return (default 10, max 30).',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_product',
        description: 'Fetch full details of a single product by its SKU.',
        parameters: {
          type: 'OBJECT',
          properties: {
            sku: { type: 'STRING', description: 'The product SKU (e.g. "AE520").' },
          },
          required: ['sku'],
        },
      },
      {
        name: 'update_product',
        description: `Update one or more fields on a product.
Editable fields: name, description, price_display, images (array of URLs), metal_images (object keyed by metal slug), metals (array), default_metal, collection, is_active.
Always call search_products or get_product first to confirm the SKU before updating.`,
        parameters: {
          type: 'OBJECT',
          properties: {
            sku: { type: 'STRING', description: 'The exact product SKU to update.' },
            fields: {
              type: 'OBJECT',
              description: 'Key-value pairs of fields to update. Only include the fields you want to change.',
            },
          },
          required: ['sku', 'fields'],
        },
      },
    ],
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const sb = createServiceClient();

  if (name === 'search_products') {
    const query = String(args.query ?? '').trim();
    const limit = Math.min(Number(args.limit ?? 10), 30);
    const { data, error } = await sb
      .from('products')
      .select('sku, slug, name, collection, category, price_display, is_active, metals, default_metal, images')
      .ilike('name', `%${query}%`)
      .order('sku')
      .limit(limit);
    if (error) return { error: error.message };
    return { results: data ?? [], count: (data ?? []).length };
  }

  if (name === 'get_product') {
    const sku = String(args.sku ?? '').trim();
    const { data, error } = await sb
      .from('products')
      .select('sku, slug, name, collection, category, price_display, is_active, metals, default_metal, images, metal_images, description')
      .eq('sku', sku)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!data) return { error: `No product found with SKU "${sku}".` };
    return { product: data };
  }

  if (name === 'update_product') {
    const sku = String(args.sku ?? '').trim();
    const rawFields = (args.fields ?? {}) as Record<string, unknown>;
    const update: Record<string, unknown> = {};
    for (const key of EDITABLE_FIELDS) {
      if (key in rawFields) update[key] = rawFields[key];
    }
    if (Object.keys(update).length === 0) {
      return { error: 'No editable fields provided. Nothing was updated.' };
    }
    const { error } = await sb.from('products').update(update).eq('sku', sku);
    if (error) return { error: error.message };
    return { ok: true, updated: Object.keys(update), sku };
  }

  return { error: `Unknown tool: ${name}` };
}

// ── System instruction ────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are the DANHOV Admin AI Product Assistant — a highly capable ERP-level assistant that helps administrators manage the product catalog.

You have access to tools that allow you to:
- SEARCH products by name or keyword (search_products)
- GET full details of a specific product (get_product)
- UPDATE product fields (update_product)

WORKFLOW:
1. When asked to modify a product, ALWAYS search for it first to confirm it exists and get its SKU.
2. Show the user what you found before modifying.
3. Apply the update using the exact SKU.
4. Confirm what was changed.

RULES:
- Never invent SKUs. Always search first.
- When updating images, the value must be a JSON array of image URLs.
- When updating name, preserve the full product name format unless explicitly told to change it.
- Be precise and confirmatory: state exactly what you changed and to what value.
- If multiple products match a search, ask the user to clarify which one they mean.
- Format responses with clear structure: what you found, what you changed, confirmation.

You can modify: name, description, price_display, images, metal_images, metals, default_metal, collection, is_active.`;

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: 'Admin access required.' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Service not configured.' }, { status: 500 });

  let body: { messages: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const messages = body.messages ?? [];
  if (messages.length === 0) return NextResponse.json({ error: 'No messages provided.' }, { status: 400 });

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_PRIMARY,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
    safetySettings: SAFETY_SETTINGS,
    // @ts-expect-error — tools type differs slightly across SDK versions
    tools,
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
  });

  // Build history (all but last message)
  const recent = messages.slice(-30);
  const lastMsg = recent[recent.length - 1];
  const history = recent.slice(0, -1).map((m) => ({
    role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
    parts: [{ text: m.content }],
  }));
  const firstUserIdx = history.findIndex((m) => m.role === 'user');
  const chat = model.startChat({ history: firstUserIdx === -1 ? [] : history.slice(firstUserIdx) });

  // Agentic loop — keep calling tools until the model produces a text response
  try {
    let result = await chat.sendMessage(lastMsg.content);
    const toolCallsLog: { tool: string; args: unknown; result: unknown }[] = [];

    for (let round = 0; round < 6; round++) {
      const candidate = result.response.candidates?.[0];
      if (!candidate) break;

      const fnCalls = (candidate.content?.parts ?? []).filter((p) => p.functionCall);
      if (fnCalls.length === 0) break; // no more tool calls — text response ready

      const fnResponses = await Promise.all(
        fnCalls.map(async (part) => {
          const { name, args } = part.functionCall as { name: string; args: Record<string, unknown> };
          const output = await executeTool(name, args ?? {});
          toolCallsLog.push({ tool: name, args, result: output });
          return {
            functionResponse: {
              name,
              response: { output },
            },
          };
        })
      );

      result = await chat.sendMessage(fnResponses as Parameters<typeof chat.sendMessage>[0]);
    }

    let text = '';
    try { text = result.response.text(); } catch { /* empty stream */ }

    return NextResponse.json({ content: text || 'Done.', toolCalls: toolCallsLog });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('ai-command:', msg);
    return NextResponse.json({ error: 'AI service error. Please try again.' }, { status: 503 });
  }
}
