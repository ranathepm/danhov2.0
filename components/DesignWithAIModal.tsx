'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  open: boolean;
  onClose: () => void;
  onGenerated?: (imageUrl: string, prompt: string) => void;
};

type Status =
  | { kind: 'idle' }
  | { kind: 'generating' }
  | { kind: 'done'; dataUrl: string; downloadUrl: string }
  | { kind: 'error'; message: string };

const SAMPLE_PROMPTS = [
  'A 1.5ct round brilliant diamond in a delicate 18k yellow gold pavé band',
  'An emerald-cut sapphire engagement ring with a hidden halo in rose gold',
  'A pair of teardrop diamond earrings in 14k white gold, classic and quiet',
  'A men’s heavy signet ring with a brushed finish, 18k yellow gold',
];

export default function DesignWithAIModal({ open, onClose, onGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setPrompt('');
      setRefFile(null);
      if (refPreview) URL.revokeObjectURL(refPreview);
      setRefPreview(null);
      setStatus({ kind: 'idle' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status.kind !== 'generating') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, status.kind]);

  function chooseFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      setStatus({ kind: 'error', message: 'Reference image must be under 8 MB.' });
      return;
    }
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefFile(f);
    setRefPreview(URL.createObjectURL(f));
    setStatus({ kind: 'idle' });
  }

  function clearRef() {
    if (refPreview) URL.revokeObjectURL(refPreview);
    setRefFile(null);
    setRefPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function generate() {
    if (prompt.trim().length < 3) {
      setStatus({ kind: 'error', message: 'Please describe what you want to see.' });
      return;
    }
    setStatus({ kind: 'generating' });
    try {
      let res: Response;
      if (refFile) {
        const form = new FormData();
        form.append('prompt', prompt);
        form.append('image', refFile);
        res = await fetch('/api/image-generate', { method: 'POST', body: form });
      } else {
        res = await fetch('/api/image-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Image generation failed (${res.status})`);
      }
      const data = (await res.json()) as {
        image_base64: string;
        mime: string;
        url: string | null;
      };
      const dataUrl = `data:${data.mime};base64,${data.image_base64}`;
      const downloadUrl = data.url || dataUrl;
      setStatus({ kind: 'done', dataUrl, downloadUrl });
      onGenerated?.(downloadUrl, prompt);
    } catch (e: unknown) {
      setStatus({
        kind: 'error',
        message: e instanceof Error ? e.message : 'Image generation failed.',
      });
    }
  }

  function download() {
    if (status.kind !== 'done') return;
    const a = document.createElement('a');
    a.href = status.downloadUrl;
    a.download = `danhov-design-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function generateAnother() {
    setStatus({ kind: 'idle' });
  }

  if (!open) return null;

  return (
    <div className="vmodal-backdrop" role="dialog" aria-label="Design with AI">
      <div className="vmodal vmodal-wide design-modal">
        <button type="button" className="vmodal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h3 className="vmodal-title">Design with AI</h3>
        <p className="vmodal-sub">
          Describe the piece you imagine — or upload a photo for inspiration. Our atelier
          will render a one-of-one concept for you.
        </p>

        {/* Idle / generating — show the input form */}
        {(status.kind === 'idle' || status.kind === 'generating') && (
          <>
            <textarea
              className="design-textarea"
              placeholder="e.g. A delicate engagement ring in 18k rose gold with a round-brilliant diamond and tiny pavé accents on the band…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              disabled={status.kind === 'generating'}
            />

            {!refPreview && (
              <div className="design-samples">
                {SAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="design-sample"
                    disabled={status.kind === 'generating'}
                    onClick={() => setPrompt(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />

            {refPreview ? (
              <div className="design-ref-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={refPreview} alt="Reference upload" />
                <button type="button" className="design-ref-clear" onClick={clearRef} disabled={status.kind === 'generating'}>
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="design-upload"
                onClick={chooseFile}
                disabled={status.kind === 'generating'}
              >
                <span>+</span>
                Add an inspiration photo (optional)
              </button>
            )}

            <div className="vmodal-actions">
              <button
                type="button"
                className="vmodal-cta"
                onClick={generate}
                disabled={status.kind === 'generating' || prompt.trim().length < 3}
              >
                {status.kind === 'generating' ? 'Designing…' : 'Generate'}
              </button>
            </div>
          </>
        )}

        {/* Done — show the generated image */}
        {status.kind === 'done' && (
          <>
            <div className="design-result">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={status.dataUrl} alt="AI-generated jewelry design" />
            </div>
            <p className="vmodal-state" style={{ color: 'var(--cream)' }}>
              &ldquo;{prompt}&rdquo;
            </p>
            <div className="vmodal-actions">
              <button type="button" className="vmodal-cta vmodal-cta-alt" onClick={generateAnother}>
                Generate Another
              </button>
              <button type="button" className="vmodal-cta" onClick={download}>
                ↓ Download Image
              </button>
            </div>
          </>
        )}

        {status.kind === 'error' && (
          <>
            <p className="vmodal-state vmodal-err">{status.message}</p>
            <div className="vmodal-actions">
              <button type="button" className="vmodal-cta" onClick={() => setStatus({ kind: 'idle' })}>
                Try Again
              </button>
            </div>
          </>
        )}

        <p className="vmodal-foot">
          Powered by Gemini · Generated images are inspirational only — final pieces are
          handcrafted in our LA atelier to your exact spec.
        </p>
      </div>
    </div>
  );
}
