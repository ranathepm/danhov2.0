'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onReply: (text: string) => void;
  contextHint?: string;
};

type Phase =
  | { kind: 'idle' }
  | { kind: 'permission' }
  | { kind: 'recording'; startedAt: number }
  | { kind: 'processing' }
  | { kind: 'error'; message: string };

const MAX_RECORD_MS = 60_000;

export default function VoiceModal({ open, onClose, onReply, contextHint }: Props) {
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [elapsed, setElapsed] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      stopAll();
      setPhase({ kind: 'idle' });
      setElapsed(0);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase.kind !== 'recording') onClose();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, phase.kind]);

  function stopAll() {
    if (recRef.current && recRef.current.state !== 'inactive') {
      try {
        recRef.current.stop();
      } catch {}
    }
    recRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function startRecording() {
    setPhase({ kind: 'permission' });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      const mime = pickAudioMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = handleStop;
      rec.start();
      const startedAt = Date.now();
      setPhase({ kind: 'recording', startedAt });
      setElapsed(0);
      tickRef.current = setInterval(() => {
        const ms = Date.now() - startedAt;
        setElapsed(ms);
        if (ms >= MAX_RECORD_MS) stopRecording();
      }, 100);
    } catch (err) {
      setPhase({
        kind: 'error',
        message:
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Microphone access denied. Please allow microphone in your browser settings.'
            : 'Could not access the microphone.',
      });
    }
  }

  function stopRecording() {
    if (recRef.current && recRef.current.state !== 'inactive') {
      recRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function handleStop() {
    setPhase({ kind: 'processing' });
    const mime = chunksRef.current[0]?.type || 'audio/webm';
    const blob = new Blob(chunksRef.current, { type: mime });
    chunksRef.current = [];

    if (blob.size < 800) {
      setPhase({ kind: 'error', message: 'That was too short. Try again — hold the button while you speak.' });
      return;
    }

    try {
      const form = new FormData();
      form.append('audio', blob, `voice.${mime.split('/')[1].split(';')[0]}`);
      if (contextHint) form.append('context', contextHint);
      const r = await fetch('/api/voice', { method: 'POST', body: form });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? `Voice request failed (${r.status}).`);
      }
      const data = (await r.json()) as { reply: string };
      onReply(data.reply);
      speakReply(data.reply);
      onClose();
    } catch (e: unknown) {
      setPhase({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Voice service unavailable.',
      });
    }
  }

  if (!open) return null;

  return (
    <div className="vmodal-backdrop" role="dialog" aria-label="Voice advisor">
      <div className="vmodal">
        <button type="button" className="vmodal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 className="vmodal-title">Voice Advisor</h3>
        <p className="vmodal-sub">
          Hold the button below and speak. Release to send.
        </p>

        <button
          type="button"
          className={`vmodal-mic${phase.kind === 'recording' ? ' is-rec' : ''}`}
          aria-label={phase.kind === 'recording' ? 'Release to send' : 'Hold to speak'}
          onPointerDown={(e) => {
            e.preventDefault();
            if (phase.kind === 'idle' || phase.kind === 'error') startRecording();
          }}
          onPointerUp={() => {
            if (phase.kind === 'recording') stopRecording();
          }}
          onPointerCancel={() => {
            if (phase.kind === 'recording') stopRecording();
          }}
          onPointerLeave={() => {
            if (phase.kind === 'recording') stopRecording();
          }}
          disabled={phase.kind === 'processing' || phase.kind === 'permission'}
        >
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Zm5 9a1 1 0 1 1 2 0 7 7 0 0 1-6 6.93V21a1 1 0 1 1-2 0v-3.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z"
              fill="currentColor"
            />
          </svg>
        </button>

        <span className="vmodal-state">
          {phase.kind === 'idle' && 'Tap and hold to begin.'}
          {phase.kind === 'permission' && 'Waiting for microphone permission…'}
          {phase.kind === 'recording' && `Recording ${formatSec(elapsed)} — release to send`}
          {phase.kind === 'processing' && 'Listening to your message…'}
          {phase.kind === 'error' && (
            <span className="vmodal-err">{phase.message}</span>
          )}
        </span>

        <p className="vmodal-foot">
          Powered by Gemini · Up to 60 seconds. Your audio is processed securely and used only to generate the advisor&apos;s reply.
        </p>
      </div>
    </div>
  );
}

function formatSec(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${s}s`;
}

function pickAudioMime(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

function speakReply(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    // Prefer a calmer voice if available
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find((v) => /samantha|allison|google us english|aria|female/i.test(v.name));
    if (pref) utter.voice = pref;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore — TTS is best-effort
  }
}
