'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BLOCK_TYPES, type Block, type BlockType } from '@/lib/blocks';

type Toast = { kind: 'ok' | 'err'; msg: string };

export default function PageBlockEditor({
  pageSlug,
  initial,
}: {
  pageSlug: string;
  initial: Block[];
}) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>(initial);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setBlocks(initial);
  }, [initial]);

  function flash(kind: Toast['kind'], msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2500);
  }

  async function addBlock(type: BlockType) {
    setPickerOpen(false);
    try {
      const r = await fetch('/api/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_slug: pageSlug, type }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
      const row = (await r.json()) as Block;
      setBlocks((prev) => [...prev, row]);
      flash('ok', `${type} added`);
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Add failed');
    }
  }

  async function updateBlock(id: string, patch: Partial<Block>) {
    // Optimistic
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    try {
      const r = await fetch(`/api/admin/blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Save failed');
      router.refresh();
    }
  }

  async function deleteBlock(id: string) {
    if (!confirm('Delete this block?')) return;
    const prev = blocks;
    setBlocks((p) => p.filter((b) => b.id !== id));
    try {
      const r = await fetch(`/api/admin/blocks/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
      flash('ok', 'Block deleted');
    } catch (e) {
      setBlocks(prev);
      flash('err', e instanceof Error ? e.message : 'Delete failed');
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex((b) => b.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[j]] = [next[j], next[idx]];
    setBlocks(next);
    try {
      const r = await fetch('/api/admin/blocks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page_slug: pageSlug, order: next.map((b) => b.id) }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Reorder failed');
      router.refresh();
    }
  }

  return (
    <div className="adm-blocks">
      {toast && <div className={`adm-toast adm-toast--${toast.kind}`}>{toast.msg}</div>}

      {blocks.length === 0 && (
        <div className="adm-empty adm-card">
          No blocks on this page yet. Click <strong>+ Add block</strong> below to begin.
        </div>
      )}

      <div className="adm-blocks-list">
        {blocks.map((b, i) => (
          <BlockCard
            key={b.id}
            block={b}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
            onUpdate={(patch) => updateBlock(b.id, patch)}
            onDelete={() => deleteBlock(b.id)}
            onMoveUp={() => move(b.id, -1)}
            onMoveDown={() => move(b.id, 1)}
          />
        ))}
      </div>

      <div className="adm-block-add-wrap">
        {pickerOpen ? (
          <div className="adm-block-picker">
            <div className="adm-block-picker-head">
              <span>Choose a block type</span>
              <button type="button" className="adm-link" onClick={() => setPickerOpen(false)}>Cancel</button>
            </div>
            <div className="adm-block-picker-grid">
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  className="adm-block-picker-item"
                  onClick={() => addBlock(t.type)}
                >
                  <span className="adm-block-picker-icon">{ICONS[t.type]}</span>
                  <span className="adm-block-picker-label">{t.label}</span>
                  <span className="adm-block-picker-desc">{t.description}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="adm-btn adm-btn-primary adm-block-add-btn"
            onClick={() => setPickerOpen(true)}
          >
            + Add block
          </button>
        )}
      </div>
    </div>
  );
}

// ── Per-block card with type-specific editor ────────────────────────────
function BlockCard({
  block,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (patch: Partial<Block>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  // Debounced save when typing
  const [local, setLocal] = useState<Record<string, unknown>>(block.data);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => setLocal(block.data), [block.data]);

  function field<T>(key: string, value: T) {
    const next = { ...local, [key]: value };
    setLocal(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => onUpdate({ data: next }), 400);
  }

  const visible = block.is_visible;

  return (
    <div className={`adm-block adm-block--${block.type}${visible ? '' : ' is-hidden'}`}>
      <div className="adm-block-rail">
        <button type="button" className="adm-icon-btn" onClick={onMoveUp} disabled={isFirst} title="Move up">↑</button>
        <button type="button" className="adm-icon-btn" onClick={onMoveDown} disabled={isLast} title="Move down">↓</button>
      </div>

      <div className="adm-block-body">
        <div className="adm-block-head">
          <span className="adm-block-type">{block.type}</span>
          <div className="adm-block-actions">
            <label className="adm-checkbox adm-checkbox--inline">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => onUpdate({ is_visible: e.target.checked })}
              />
              <span>Visible</span>
            </label>
            <button type="button" className="adm-link adm-link--danger" onClick={onDelete}>Delete</button>
          </div>
        </div>

        <BlockFields type={block.type} data={local} onChange={field} />
      </div>
    </div>
  );
}

function BlockFields({
  type,
  data,
  onChange,
}: {
  type: BlockType;
  data: Record<string, unknown>;
  onChange: <T>(key: string, v: T) => void;
}) {
  const s = (k: string) => (data[k] as string) ?? '';
  const n = (k: string) => (data[k] as number) ?? 0;
  const b = (k: string) => Boolean(data[k]);

  switch (type) {
    case 'heading':
      return (
        <div className="adm-fields">
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Eyebrow (optional)</span>
            <input className="adm-input" value={s('eyebrow')} onChange={(e) => onChange('eyebrow', e.target.value)} placeholder="Small label above the heading" />
          </label>
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Heading text *</span>
            <input className="adm-input" value={s('text')} onChange={(e) => onChange('text', e.target.value)} />
          </label>
          <label className="adm-field">
            <span className="adm-field-label">Level</span>
            <select className="adm-select" value={n('level') || 2} onChange={(e) => onChange('level', Number(e.target.value))}>
              <option value={1}>H1 (largest)</option>
              <option value={2}>H2</option>
              <option value={3}>H3 (smallest)</option>
            </select>
          </label>
          <label className="adm-field">
            <span className="adm-field-label">Alignment</span>
            <select className="adm-select" value={s('align') || 'center'} onChange={(e) => onChange('align', e.target.value)}>
              <option value="left">Left</option>
              <option value="center">Centred</option>
            </select>
          </label>
        </div>
      );

    case 'paragraph':
      return (
        <div className="adm-fields">
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Paragraph text *</span>
            <textarea rows={4} className="adm-input" value={s('text')} onChange={(e) => onChange('text', e.target.value)} />
          </label>
          <label className="adm-field">
            <span className="adm-field-label">Alignment</span>
            <select className="adm-select" value={s('align') || 'center'} onChange={(e) => onChange('align', e.target.value)}>
              <option value="left">Left</option>
              <option value="center">Centred</option>
            </select>
          </label>
        </div>
      );

    case 'image': {
      const url = s('url');
      return (
        <div className="adm-fields">
          <ImageUpload value={url} onChange={(v) => onChange('url', v)} />
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Alt text *</span>
            <input className="adm-input" value={s('alt')} onChange={(e) => onChange('alt', e.target.value)} placeholder="Describes the image for accessibility + SEO" />
          </label>
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Caption (optional)</span>
            <input className="adm-input" value={s('caption')} onChange={(e) => onChange('caption', e.target.value)} />
          </label>
          <div className="adm-field adm-field--full">
            <label className="adm-checkbox">
              <input type="checkbox" checked={b('full_width')} onChange={(e) => onChange('full_width', e.target.checked)} />
              <span>Full-width (edge to edge)</span>
            </label>
          </div>
        </div>
      );
    }

    case 'video':
      return (
        <div className="adm-fields">
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Video URL *</span>
            <input className="adm-input adm-mono" value={s('url')} onChange={(e) => onChange('url', e.target.value)} placeholder="https://www.youtube.com/watch?v=… or .mp4 link" />
          </label>
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Caption (optional)</span>
            <input className="adm-input" value={s('caption')} onChange={(e) => onChange('caption', e.target.value)} />
          </label>
        </div>
      );

    case 'cta':
      return (
        <div className="adm-fields">
          <label className="adm-field">
            <span className="adm-field-label">Button label *</span>
            <input className="adm-input" value={s('label')} onChange={(e) => onChange('label', e.target.value)} />
          </label>
          <label className="adm-field">
            <span className="adm-field-label">Link target *</span>
            <input className="adm-input adm-mono" value={s('href')} onChange={(e) => onChange('href', e.target.value)} placeholder="/engagement-rings" />
          </label>
          <label className="adm-field">
            <span className="adm-field-label">Style</span>
            <select className="adm-select" value={s('style') || 'primary'} onChange={(e) => onChange('style', e.target.value)}>
              <option value="primary">Solid (filled)</option>
              <option value="secondary">Outline</option>
            </select>
          </label>
        </div>
      );

    case 'quote':
      return (
        <div className="adm-fields">
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Quote *</span>
            <textarea rows={3} className="adm-input" value={s('text')} onChange={(e) => onChange('text', e.target.value)} />
          </label>
          <label className="adm-field adm-field--full">
            <span className="adm-field-label">Attribution (optional)</span>
            <textarea rows={2} className="adm-input" value={s('attribution')} onChange={(e) => onChange('attribution', e.target.value)} placeholder="Who said it / why it matters" />
          </label>
        </div>
      );

    case 'divider':
      return (
        <p className="adm-page-sub">A thin gold line. No fields.</p>
      );

    case 'spacer':
      return (
        <div className="adm-fields">
          <label className="adm-field">
            <span className="adm-field-label">Size</span>
            <select className="adm-select" value={s('size') || 'md'} onChange={(e) => onChange('size', e.target.value)}>
              <option value="sm">Small (~24px)</option>
              <option value="md">Medium (~64px)</option>
              <option value="lg">Large (~120px)</option>
            </select>
          </label>
        </div>
      );

    default:
      return null;
  }
}

// ── Inline image uploader (re-uses /api/admin/upload) ──────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [progress, setProgress] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const ref = useRef<HTMLInputElement>(null);

  function upload(file: File) {
    setErr(null);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/upload');
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data.url) {
            onChange(data.url);
            setProgress(null);
            return;
          }
        } catch {}
        setErr('Bad response');
        setProgress(null);
      } else {
        let msg = `Upload failed (${xhr.status})`;
        try { msg = JSON.parse(xhr.responseText).error || msg; } catch {}
        setErr(msg);
        setProgress(null);
      }
    };
    xhr.onerror = () => { setErr('Network error'); setProgress(null); };
    const fd = new FormData();
    fd.append('file', file);
    xhr.send(fd);
  }

  return (
    <div className="adm-field adm-field--full">
      <span className="adm-field-label">Image *</span>
      <div className="adm-img-upload">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="adm-img-upload-preview" />
        ) : (
          <div className="adm-img-upload-empty">No image yet</div>
        )}
        <div className="adm-img-upload-actions">
          <input
            ref={ref}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files && upload(e.target.files[0])}
            style={{ display: 'none' }}
          />
          <button type="button" className="adm-btn adm-btn--sm" onClick={() => ref.current?.click()} disabled={progress !== null}>
            {progress !== null ? `Uploading ${progress}%` : value ? 'Replace image' : 'Upload image'}
          </button>
          {value && (
            <button type="button" className="adm-link adm-link--danger" onClick={() => onChange('')}>
              Remove
            </button>
          )}
        </div>
        <label className="adm-field adm-field--full" style={{ marginTop: 8 }}>
          <span className="adm-field-label">Or paste a URL</span>
          <input className="adm-input adm-mono" value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://…" />
        </label>
        {progress !== null && <div className="adm-upload-bar"><div style={{ width: `${progress}%` }} /></div>}
        {err && <span className="adm-form-err">{err}</span>}
      </div>
    </div>
  );
}

const ICONS: Record<BlockType, React.ReactNode> = {
  heading: <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 18 }}>H</span>,
  paragraph: <span style={{ fontWeight: 700, fontSize: 18 }}>¶</span>,
  image: <span>🖼</span>,
  video: <span>▶</span>,
  cta: <span style={{ fontWeight: 700 }}>▢</span>,
  quote: <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, lineHeight: 1 }}>“”</span>,
  divider: <span style={{ letterSpacing: 4 }}>───</span>,
  spacer: <span>↕</span>,
};
