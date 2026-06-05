'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onReply: (text: string) => void;
  contextHint?: string;
};

type MediaType = 'image' | 'video';

type Phase =
  | { step: 'idle' }
  | { step: 'live' }
  | { step: 'recording'; startedAt: number }
  | { step: 'preview'; blob: Blob; media: MediaType; previewUrl: string }
  | { step: 'sending' }
  | { step: 'error'; message: string };

const MAX_VIDEO_MS = 30_000;

export default function VisionModal({ open, onClose, onReply, contextHint }: Props) {
  const [phase, setPhase] = useState<Phase>({ step: 'idle' });
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      stopAll();
      setPhase({ step: 'idle' });
      setElapsed(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase.step !== 'recording') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, phase.step]);

  // Bind the live stream to the <video> element when we enter live/recording.
  useEffect(() => {
    if ((phase.step === 'live' || phase.step === 'recording') && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [phase.step]);

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

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setPhase({ step: 'live' });
    } catch (err) {
      setPhase({
        step: 'error',
        message:
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera access denied. Please allow camera in your browser settings.'
            : 'Could not access the camera.',
      });
    }
  }

  function snapPhoto() {
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        stopAll();
        const url = URL.createObjectURL(blob);
        setPhase({ step: 'preview', blob, media: 'image', previewUrl: url });
      },
      'image/jpeg',
      0.88
    );
  }

  function startVideo() {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickVideoMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recRef.current = rec;
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      const m = chunksRef.current[0]?.type || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: m });
      chunksRef.current = [];
      stopAll();
      const url = URL.createObjectURL(blob);
      setPhase({ step: 'preview', blob, media: 'video', previewUrl: url });
    };
    rec.start();
    const startedAt = Date.now();
    setPhase({ step: 'recording', startedAt });
    setElapsed(0);
    tickRef.current = setInterval(() => {
      const ms = Date.now() - startedAt;
      setElapsed(ms);
      if (ms >= MAX_VIDEO_MS) stopVideo();
    }, 100);
  }

  function stopVideo() {
    if (recRef.current && recRef.current.state !== 'inactive') {
      recRef.current.stop();
    }
  }

  function discardPreview() {
    if (phase.step === 'preview') URL.revokeObjectURL(phase.previewUrl);
    setPhase({ step: 'idle' });
  }

  async function sendPreview() {
    if (phase.step !== 'preview') return;
    const snapshot = phase;
    setPhase({ step: 'sending' });
    try {
      const form = new FormData();
      const ext = snapshot.blob.type.split('/')[1]?.split(';')[0] || 'bin';
      form.append('media', snapshot.blob, `${snapshot.media}.${ext}`);
      if (contextHint) form.append('context', contextHint);
      const r = await fetch('/api/vision', { method: 'POST', body: form });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error ?? `Vision request failed (${r.status}).`);
      }
      const data = (await r.json()) as { reply: string };
      URL.revokeObjectURL(snapshot.previewUrl);
      onReply(data.reply);
      onClose();
    } catch (e: unknown) {
      setPhase({
        step: 'error',
        message: e instanceof Error ? e.message : 'Vision service unavailable.',
      });
    }
  }

  if (!open) return null;

  return (
    <div className="vmodal-backdrop" role="dialog" aria-label="Visual advisor">
      <div className="vmodal vmodal-wide">
        <button type="button" className="vmodal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 className="vmodal-title">Show our advisor</h3>
        <p className="vmodal-sub">
          Take a photo of your hand or a piece you love — or record a short video describing your vision.
        </p>

        <div className="vmodal-stage">
          {phase.step === 'idle' && (
            <div className="vmodal-start">
              <button type="button" className="vmodal-cta" onClick={openCamera}>
                Open Camera
              </button>
            </div>
          )}

          {(phase.step === 'live' || phase.step === 'recording') && (
            <video ref={videoRef} autoPlay playsInline muted className="vmodal-video" />
          )}

          {phase.step === 'preview' && phase.media === 'image' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={phase.previewUrl} alt="Captured preview" className="vmodal-preview" />
          )}

          {phase.step === 'preview' && phase.media === 'video' && (
            <video src={phase.previewUrl} className="vmodal-preview" controls playsInline />
          )}

          {phase.step === 'sending' && (
            <div className="vmodal-loading">Our advisor is looking at this…</div>
          )}

          {phase.step === 'error' && (
            <div className="vmodal-err">
              {phase.message}
              <div style={{ marginTop: 12 }}>
                <button
                  type="button"
                  className="vmodal-cta"
                  onClick={() => setPhase({ step: 'idle' })}
                >
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>

        {phase.step === 'live' && (
          <div className="vmodal-actions">
            <button type="button" className="vmodal-cta" onClick={snapPhoto}>
              📷 Capture Photo
            </button>
            <button type="button" className="vmodal-cta vmodal-cta-alt" onClick={startVideo}>
              🎥 Record 30s Video
            </button>
          </div>
        )}

        {phase.step === 'recording' && (
          <div className="vmodal-actions">
            <button type="button" className="vmodal-cta vmodal-rec" onClick={stopVideo}>
              ■ Stop ({formatSec(MAX_VIDEO_MS - elapsed)} left)
            </button>
          </div>
        )}

        {phase.step === 'preview' && (
          <div className="vmodal-actions">
            <button type="button" className="vmodal-cta vmodal-cta-alt" onClick={discardPreview}>
              ✕ Retake
            </button>
            <button type="button" className="vmodal-cta" onClick={sendPreview}>
              Send to Advisor →
            </button>
          </div>
        )}

        <p className="vmodal-foot">
          Powered by Gemini · Max 15MB. Photos and videos are processed securely and stored only for review by the DANHOV team.
        </p>
      </div>
    </div>
  );
}

function formatSec(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${s}s`;
}

function pickVideoMime(): string | undefined {
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}
