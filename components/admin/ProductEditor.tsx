'use client';

import { useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  computeProductTotal,
  computeStoneBreakdown,
  DIAMOND_SHAPES,
  type StoneGroup,
} from '@/lib/stone-math';
import DiamondShapeIcon from '@/components/admin/DiamondShapeIcon';

type Product = {
  sku: string;
  slug: string;
  name: string;
  collection: string | null;
  category: string;
  categories: string[] | null;
  metals: string[] | null;
  images: string[] | null;
  metal_images: Record<string, string[]> | null;
  price_display: string | null;
  description?: string | null;
  default_metal: string | null;
  gold_weight_g: number | null;
  markup_multiplier: number | null;
  base_labor_usd: number | null;
  diamond_labor_usd: number | null;
  stones_value_usd: number | null;
  stone_count_input: number | null;
  stone_size_mm: number | null;
  stone_groups: StoneGroup[] | null;
  accounting_cost_usd: number | null;
  is_active: boolean;
  sub_categories: string[] | null;
};

const METAL_OPTIONS = [
  'platinum',
  '14k_yellow', '14k_white', '14k_rose',
  '18k_yellow', '18k_white', '18k_rose',
];

const LABOUR_PRESETS = [4, 50, 100, 200];

type Tab = 'identity' | 'images' | 'metals' | 'pricing';

const TABS: { id: Tab; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'images',   label: 'Images'   },
  { id: 'metals',   label: 'Metals'   },
  { id: 'pricing',  label: 'Pricing'  },
];

function blankStoneGroup(): StoneGroup {
  return { count: null, size_mm: null, length_mm: null, width_mm: null, shape: 'round' };
}

function groupEffectiveSize(g: StoneGroup): number | null {
  const l = g.length_mm ?? null;
  const w = g.width_mm ?? null;
  if (l != null && w != null) return (Number(l) + Number(w)) / 2;
  if (l != null) return Number(l);
  if (w != null) return Number(w);
  return g.size_mm ?? null;
}

function initialStoneGroups(p: {
  stone_groups: StoneGroup[] | null;
  stone_count_input: number | null;
  stone_size_mm: number | null;
}): StoneGroup[] {
  if (Array.isArray(p.stone_groups) && p.stone_groups.length > 0) {
    return p.stone_groups.map((g) => ({
      count: g?.count ?? null,
      size_mm: g?.size_mm ?? null,
      length_mm: g?.length_mm ?? g?.size_mm ?? null,
      width_mm: g?.width_mm ?? g?.size_mm ?? null,
      shape: g?.shape ?? 'round',
    }));
  }
  if (p.stone_count_input != null || p.stone_size_mm != null) {
    return [{
      count: p.stone_count_input,
      size_mm: p.stone_size_mm,
      length_mm: p.stone_size_mm,
      width_mm: p.stone_size_mm,
      shape: 'round',
    }];
  }
  return [blankStoneGroup()];
}

type Upload = {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
};

export default function ProductEditor({
  product,
  isNew = false,
}: {
  product: Product;
  isNew?: boolean;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [form, setForm] = useState<Product>({
    ...product,
    categories: product.categories ?? [product.category],
    metals: product.metals ?? [],
    images: product.images ?? [],
    metal_images: product.metal_images ?? {},
    sub_categories: product.sub_categories ?? [],
    stone_count_input: product.stone_count_input ?? null,
    stone_size_mm: product.stone_size_mm ?? null,
    stone_groups: initialStoneGroups(product),
    diamond_labor_usd: product.diamond_labor_usd ?? null,
    accounting_cost_usd: product.accounting_cost_usd ?? null,
  });

  const productTotal = useMemo(
    () =>
      computeProductTotal({
        stoneGroups: form.stone_groups,
        weightInPlatinumG: form.gold_weight_g,
        jewelleryLabourUsd: form.base_labor_usd,
        diamondLabourUsd: form.diamond_labor_usd,
        defaultMetal: form.default_metal,
      }),
    [form.stone_groups, form.gold_weight_g, form.base_labor_usd, form.diamond_labor_usd, form.default_metal],
  );

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function set<K extends keyof Product>(k: K, v: Product[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function updateStoneGroup(idx: number, patch: Partial<StoneGroup>) {
    setForm((f) => {
      const groups = (f.stone_groups ?? []).map((g, i) => i === idx ? { ...g, ...patch } : g);
      return { ...f, stone_groups: groups };
    });
  }

  function addStoneGroup() {
    setForm((f) => ({ ...f, stone_groups: [...(f.stone_groups ?? []), blankStoneGroup()] }));
  }

  function removeStoneGroup(idx: number) {
    setForm((f) => {
      const groups = (f.stone_groups ?? []).filter((_, i) => i !== idx);
      return { ...f, stone_groups: groups.length > 0 ? groups : [blankStoneGroup()] };
    });
  }

  function flashToast(kind: 'ok' | 'err', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function save() {
    setSaving(true);
    try {
      const url = isNew ? '/api/admin/products' : `/api/admin/products/${encodeURIComponent(product.sku)}`;
      const method = isNew ? 'POST' : 'PATCH';
      const cleanGroups = (form.stone_groups ?? [])
        .filter((g) => g.count != null || g.length_mm != null || g.width_mm != null || g.size_mm != null)
        .map((g) => ({ ...g, size_mm: groupEffectiveSize(g) }));
      const first = cleanGroups[0];
      const payload = {
        ...form,
        stone_groups: cleanGroups,
        stone_count_input: first?.count ?? null,
        stone_size_mm: first?.size_mm ?? null,
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${res.status})`);
      }
      const data = await res.json();
      flashToast('ok', isNew ? 'Product created' : 'Saved');
      if (isNew && data.sku) {
        router.push(`/admin/products/${encodeURIComponent(data.sku)}`);
      } else {
        router.refresh();
      }
    } catch (e: unknown) {
      flashToast('err', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete ${product.sku}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.sku)}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Delete failed (${res.status})`);
      }
      router.push('/admin/products');
      router.refresh();
    } catch (e: unknown) {
      flashToast('err', e instanceof Error ? e.message : 'Delete failed');
      setDeleting(false);
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const items: Upload[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: f.name,
      progress: 0,
      status: 'uploading',
    }));
    setUploads((prev) => [...prev, ...items]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const file = Array.from(files)[i];
      try {
        const url = await uploadWithProgress(file, (pct) => {
          setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u)));
        });
        setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: 'done', progress: 100, url } : u)));
        setForm((f) => ({ ...f, images: [...(f.images ?? []), url] }));
      } catch (e) {
        setUploads((prev) => prev.map((u) =>
          u.id === item.id ? { ...u, status: 'error', error: e instanceof Error ? e.message : 'failed' } : u
        ));
      }
    }
    setTimeout(() => { setUploads((prev) => prev.filter((u) => u.status === 'uploading')); }, 5000);
  }

  function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/upload');
      xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) return resolve(data.url);
            reject(new Error('No URL returned'));
          } catch { reject(new Error('Invalid response')); }
        } else {
          let msg = `Upload failed (${xhr.status})`;
          try { const data = JSON.parse(xhr.responseText); if (data.error) msg = data.error; } catch {}
          reject(new Error(msg));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      const fd = new FormData();
      fd.append('file', file);
      xhr.send(fd);
    });
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: (f.images ?? []).filter((_, i) => i !== idx) }));
  }

  function moveImage(idx: number, dir: -1 | 1) {
    setForm((f) => {
      const arr = [...(f.images ?? [])];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...f, images: arr };
    });
  }

  async function uploadMetalFiles(metal: string, files: FileList | File[]) {
    const items: Upload[] = Array.from(files).map((f) => ({
      id: Math.random().toString(36).slice(2),
      name: `[${metal}] ${f.name}`,
      progress: 0,
      status: 'uploading',
    }));
    setUploads((prev) => [...prev, ...items]);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const file = Array.from(files)[i];
      try {
        const url = await uploadWithProgress(file, (pct) => {
          setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u)));
        });
        setUploads((prev) => prev.map((u) => (u.id === item.id ? { ...u, status: 'done', progress: 100, url } : u)));
        setForm((f) => {
          const map = { ...(f.metal_images ?? {}) };
          const arr = map[metal] ? [...map[metal]] : [];
          arr.push(url);
          map[metal] = arr;
          return { ...f, metal_images: map };
        });
      } catch (e) {
        setUploads((prev) => prev.map((u) =>
          u.id === item.id ? { ...u, status: 'error', error: e instanceof Error ? e.message : 'failed' } : u
        ));
      }
    }
    setTimeout(() => { setUploads((prev) => prev.filter((u) => u.status === 'uploading')); }, 5000);
  }

  function removeMetalImage(metal: string, idx: number) {
    setForm((f) => {
      const map = { ...(f.metal_images ?? {}) };
      const arr = (map[metal] ?? []).filter((_, i) => i !== idx);
      if (arr.length === 0) delete map[metal]; else map[metal] = arr;
      return { ...f, metal_images: map };
    });
  }

  function moveMetalImage(metal: string, idx: number, dir: -1 | 1) {
    setForm((f) => {
      const map = { ...(f.metal_images ?? {}) };
      const arr = map[metal] ? [...map[metal]] : [];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return f;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      map[metal] = arr;
      return { ...f, metal_images: map };
    });
  }

  function toggleMetal(m: string) {
    setForm((f) => {
      const s = new Set(f.metals ?? []);
      if (s.has(m)) s.delete(m); else s.add(m);
      return { ...f, metals: Array.from(s) };
    });
  }

  function toggleCategory(c: string) {
    setForm((f) => {
      const s = new Set(f.categories ?? []);
      if (s.has(c)) s.delete(c); else s.add(c);
      return { ...f, categories: Array.from(s) };
    });
  }

  const imageCount = (form.images ?? []).length;
  const totalLabour = (form.base_labor_usd ?? 0) + (form.diamond_labor_usd ?? 0);

  return (
    <div className="adm-editor">
      {toast && <div className={`adm-toast adm-toast--${toast.kind}`}>{toast.msg}</div>}

      {/* ── Tab bar ───────────────────────────────────────────────────── */}
      <div className="adm-editor-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`adm-editor-tab${activeTab === t.id ? ' is-active' : ''}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
            {t.id === 'images' && imageCount > 0 && (
              <span className="adm-tab-count">{imageCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      <div className="adm-editor-body">

        {/* ══ IDENTITY TAB ══════════════════════════════════════════════ */}
        {activeTab === 'identity' && (
          <section className="adm-card">
            <header className="adm-card-head">
              <h2 className="adm-h2">Product Identity</h2>
              <span className={`adm-pill adm-pill--${form.is_active ? 'active' : 'inactive'}`}>
                {form.is_active ? 'Active' : 'Inactive'}
              </span>
            </header>

            {/* Row 1: SKU · Slug · Collection */}
            <div className="adm-fields adm-fields--3">
              <label className="adm-field">
                <span className="adm-field-label">SKU *</span>
                <input
                  className="adm-input adm-mono"
                  value={form.sku}
                  disabled={!isNew}
                  onChange={(e) => set('sku', e.target.value)}
                  placeholder="AE520UQ"
                />
              </label>
              <label className="adm-field">
                <span className="adm-field-label">Slug *</span>
                <input
                  className="adm-input adm-mono"
                  value={form.slug}
                  onChange={(e) => set('slug', e.target.value)}
                  placeholder="abbraccio-swirl-diamond-ring"
                />
              </label>
              <label className="adm-field">
                <span className="adm-field-label">Collection</span>
                <input
                  className="adm-input"
                  value={form.collection ?? ''}
                  onChange={(e) => set('collection', e.target.value || null)}
                  placeholder="Abbraccio"
                />
              </label>
            </div>

            {/* Row 2: Name (full width) */}
            <div className="adm-fields">
              <label className="adm-field adm-field--full">
                <span className="adm-field-label">Ring Name *</span>
                <input
                  className="adm-input"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="Abbraccio Swirl Diamond Ring"
                />
              </label>
            </div>

            {/* Row 3: Category · Display Price */}
            <div className="adm-fields">
              <label className="adm-field">
                <span className="adm-field-label">Primary Category *</span>
                <select
                  className="adm-select"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  <option value="engagement">Engagement Rings</option>
                  <option value="wedding">Wedding Bands</option>
                  <option value="fine">Fine Jewelry</option>
                  <option value="mens">Men&apos;s</option>
                </select>
              </label>
              <label className="adm-field">
                <span className="adm-field-label">Display Price</span>
                <input
                  className="adm-input"
                  value={form.price_display ?? ''}
                  onChange={(e) => set('price_display', e.target.value || null)}
                  placeholder="From $5,390"
                />
              </label>
            </div>

            {/* Row 4: Also appears in (chips) */}
            <div className="adm-field">
              <span className="adm-field-label">Also Appears In</span>
              <div className="adm-chips" style={{ marginTop: 8 }}>
                {['engagement', 'wedding', 'fine', 'mens'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`adm-chip${(form.categories ?? []).includes(c) ? ' is-active' : ''}`}
                    onClick={() => toggleCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 5: Description */}
            <label className="adm-field">
              <span className="adm-field-label">Description (internal note)</span>
              <textarea
                rows={3}
                className="adm-input"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
              />
            </label>

            {/* Row 6: Active toggle */}
            <div className="adm-field">
              <label className="adm-checkbox">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => set('is_active', e.target.checked)}
                />
                <span>Visible on the live site</span>
              </label>
            </div>
          </section>
        )}

        {/* ══ IMAGES TAB ════════════════════════════════════════════════ */}
        {activeTab === 'images' && (
          <>
            <section className="adm-card">
              <header className="adm-card-head">
                <h2 className="adm-h2">Main Gallery</h2>
                <span className="adm-page-sub">
                  {imageCount > 0 ? `${imageCount} image${imageCount === 1 ? '' : 's'} · First is hero` : 'No images yet'}
                </span>
              </header>

              {/* Compact horizontal drop bar */}
              <div
                className={`adm-drop adm-drop--bar${dragOver ? ' is-over' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
                }}
                onClick={() => fileRef.current?.click()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 4v12m-6-6 6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span>Drop images or click to browse</span>
                <span className="adm-drop-hint">PNG · JPG · WebP · up to 12 MB each</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Upload progress */}
              {uploads.length > 0 && (
                <ul className="adm-uploads">
                  {uploads.map((u) => (
                    <li key={u.id} className={`adm-upload adm-upload--${u.status}`}>
                      <div className="adm-upload-row">
                        <span className="adm-upload-name">{u.name}</span>
                        <span className="adm-upload-pct">
                          {u.status === 'uploading' && `${u.progress}%`}
                          {u.status === 'done' && '✓ Done'}
                          {u.status === 'error' && `✗ ${u.error}`}
                        </span>
                      </div>
                      <div className="adm-upload-bar"><div style={{ width: `${u.progress}%` }} /></div>
                    </li>
                  ))}
                </ul>
              )}

              {/* Compact thumbnail strip */}
              {imageCount > 0 && (
                <div className="adm-thumb-strip">
                  {(form.images ?? []).map((src, i) => (
                    <div key={src + i} className="adm-thumb-item">
                      <Image src={src} alt="" width={88} height={88} unoptimized
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      {i === 0 && <span className="adm-gallery-tag">Hero</span>}
                      <div className="adm-thumb-actions">
                        <button type="button" className="adm-icon-btn" onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move left">←</button>
                        <button type="button" className="adm-icon-btn" onClick={() => moveImage(i, 1)} disabled={i === imageCount - 1} title="Move right">→</button>
                        <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={() => removeImage(i)} title="Remove">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Per-metal galleries */}
            {(form.metals ?? []).length > 0 && (
              <section className="adm-card">
                <header className="adm-card-head">
                  <h2 className="adm-h2">Per-Metal Photos</h2>
                  <span className="adm-page-sub">Override per variant — empty rows fall back to main gallery</span>
                </header>
                <div className="adm-metal-galleries">
                  {(form.metals ?? []).map((m) => {
                    const arr = form.metal_images?.[m] ?? [];
                    return (
                      <MetalGallerySlot
                        key={m}
                        metal={m}
                        images={arr}
                        onUpload={(files) => uploadMetalFiles(m, files)}
                        onRemove={(idx) => removeMetalImage(m, idx)}
                        onMove={(idx, dir) => moveMetalImage(m, idx, dir)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {(form.metals ?? []).length === 0 && (
              <p className="adm-page-sub" style={{ padding: '12px 0' }}>
                Add metals in the <button type="button" className="adm-link" style={{ font: 'inherit' }} onClick={() => setActiveTab('metals')}>Metals tab</button> to upload per-variant photos.
              </p>
            )}
          </>
        )}

        {/* ══ METALS TAB ════════════════════════════════════════════════ */}
        {activeTab === 'metals' && (
          <section className="adm-card">
            <header className="adm-card-head">
              <h2 className="adm-h2">Metals</h2>
            </header>

            <div>
              <span className="adm-field-label" style={{ display: 'block', marginBottom: 10 }}>
                Available in these metals
              </span>
              <div className="adm-chips">
                {METAL_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`adm-chip${(form.metals ?? []).includes(m) ? ' is-active' : ''}`}
                    onClick={() => toggleMetal(m)}
                  >
                    {m.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="adm-fields" style={{ marginTop: 8 }}>
              <label className="adm-field">
                <span className="adm-field-label">Default Metal (shown first on product page)</span>
                <select
                  className="adm-select"
                  value={form.default_metal ?? 'platinum'}
                  onChange={(e) => set('default_metal', e.target.value)}
                >
                  {METAL_OPTIONS.map((m) => (
                    <option key={m} value={m}>{m === 'platinum' ? 'Platinum' : m.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </label>
            </div>

            {(form.metals ?? []).length > 0 && (
              <p className="adm-page-sub">
                {(form.metals ?? []).length} metal{(form.metals ?? []).length === 1 ? '' : 's'} selected ·{' '}
                <button type="button" className="adm-link" style={{ font: 'inherit' }} onClick={() => setActiveTab('images')}>
                  Upload per-metal photos →
                </button>
              </p>
            )}
          </section>
        )}

        {/* ══ PRICING TAB ═══════════════════════════════════════════════ */}
        {activeTab === 'pricing' && (
          <>
            {/* Metal weight */}
            <section className="adm-card">
              <header className="adm-card-head">
                <h2 className="adm-h2">Metal Specs</h2>
              </header>
              <div className="adm-fields">
                <label className="adm-field">
                  <span className="adm-field-label">Weight in Platinum (grams)</span>
                  <input
                    type="number" step="0.1" className="adm-input"
                    value={form.gold_weight_g ?? ''}
                    onChange={(e) => set('gold_weight_g', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="e.g. 4.8"
                  />
                </label>
              </div>
            </section>

            {/* Stone groups */}
            <section className="adm-card">
              <header className="adm-card-head">
                <h2 className="adm-h2">Stones</h2>
                <button type="button" className="adm-btn adm-btn--sm" onClick={addStoneGroup}>
                  + Add Group
                </button>
              </header>

              <div className="adm-stone-groups">
                {(form.stone_groups ?? []).map((g, i) => (
                  <div className="adm-stone-group" key={i}>
                    <div className="adm-stone-group-head">
                      <span className="adm-field-label">
                        {i === 0 ? 'Stone Group' : `Group ${i + 1}`}
                      </span>
                      {(form.stone_groups ?? []).length > 1 && (
                        <button type="button" className="adm-link adm-link--danger" onClick={() => removeStoneGroup(i)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="adm-fields adm-fields--4">
                      <label className="adm-field">
                        <span className="adm-field-label">Count</span>
                        <input
                          type="number" step="1" min="0" className="adm-input"
                          value={g.count ?? ''}
                          onChange={(e) => updateStoneGroup(i, { count: e.target.value === '' ? null : Number(e.target.value) })}
                          placeholder="38"
                        />
                      </label>
                      <label className="adm-field">
                        <span className="adm-field-label">Length (mm)</span>
                        <input
                          type="number" step="0.05" min="0" className="adm-input"
                          value={g.length_mm ?? ''}
                          onChange={(e) => {
                            const length = e.target.value === '' ? null : Number(e.target.value);
                            const width = g.width_mm ?? null;
                            const eff = length != null && width != null ? (length + width) / 2 : (length ?? width);
                            updateStoneGroup(i, { length_mm: length, size_mm: eff });
                          }}
                          placeholder="6.50"
                        />
                      </label>
                      <label className="adm-field">
                        <span className="adm-field-label">Width (mm)</span>
                        <input
                          type="number" step="0.05" min="0" className="adm-input"
                          value={g.width_mm ?? ''}
                          onChange={(e) => {
                            const width = e.target.value === '' ? null : Number(e.target.value);
                            const length = g.length_mm ?? null;
                            const eff = length != null && width != null ? (length + width) / 2 : (width ?? length);
                            updateStoneGroup(i, { width_mm: width, size_mm: eff });
                          }}
                          placeholder="6.50"
                        />
                      </label>
                      <label className="adm-field">
                        <span className="adm-field-label">Shape</span>
                        <div className="adm-shape-select">
                          <DiamondShapeIcon shape={g.shape} className="adm-shape-select-icon" />
                          <select
                            className="adm-select adm-select--with-icon"
                            value={g.shape ?? 'round'}
                            onChange={(e) => updateStoneGroup(i, { shape: e.target.value })}
                          >
                            {DIAMOND_SHAPES.map((s) => (
                              <option key={s.slug} value={s.slug}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </label>
                    </div>
                    <StoneGroupReadout group={g} />
                  </div>
                ))}
              </div>
            </section>

            {/* Labour */}
            <section className="adm-card">
              <header className="adm-card-head">
                <h2 className="adm-h2">Labour</h2>
              </header>
              <div className="adm-labour-split">
                <LabourField
                  label="Setting Labour (USD)"
                  value={form.base_labor_usd}
                  onChange={(v) => set('base_labor_usd', v)}
                />
                <LabourField
                  label="Setting Center Diamond (USD)"
                  value={form.diamond_labor_usd}
                  onChange={(v) => set('diamond_labor_usd', v)}
                />
              </div>
              <div className="adm-labour-total">
                <span className="adm-field-label">Total Labour</span>
                <strong>${totalLabour.toLocaleString('en-US')}</strong>
              </div>
            </section>

            {/* Auto-calculated totals */}
            <section className="adm-card">
              <header className="adm-card-head">
                <h2 className="adm-h2">Auto-Calculated Totals</h2>
                <span className="adm-page-sub">Updates live as you type above</span>
              </header>

              <div className="adm-pricing-breakdown">
                <div className="adm-pricing-row">
                  <span>Stones ({productTotal.total_carats > 0 ? `${productTotal.total_carats.toFixed(3)} ct` : '—'})</span>
                  <strong>${Math.round(productTotal.total_stone_price_usd).toLocaleString('en-US')}</strong>
                </div>
                <div className="adm-pricing-row">
                  <span>Metal ({productTotal.metal_weight_g.toFixed(2)} g @ ${productTotal.metal_price_per_g_usd}/g)</span>
                  <strong>${Math.round(productTotal.metal_cost_usd).toLocaleString('en-US')}</strong>
                </div>
                <div className="adm-pricing-row">
                  <span>Labour (setting + center stone)</span>
                  <strong>${Math.round(totalLabour).toLocaleString('en-US')}</strong>
                </div>
                <div className="adm-pricing-total">
                  <span>Total Product Price</span>
                  <strong>
                    {productTotal.total_product_price_usd > 0
                      ? `$${Math.round(productTotal.total_product_price_usd).toLocaleString('en-US')}`
                      : '—'}
                  </strong>
                </div>
              </div>

              {/* Overrides */}
              <div className="adm-fields" style={{ marginTop: 16 }}>
                <label className="adm-field adm-field--full">
                  <span className="adm-field-label">Stone Value Override (leave blank to use auto)</span>
                  <input
                    type="number" step="50" className="adm-input"
                    value={form.stones_value_usd ?? ''}
                    onChange={(e) => set('stones_value_usd', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder={
                      productTotal.total_stone_price_usd > 0
                        ? `Auto: ${Math.round(productTotal.total_stone_price_usd)}`
                        : 'Override stone cost here'
                    }
                  />
                </label>
                <label className="adm-field adm-field--full">
                  <span className="adm-field-label">Accounting Cost (USD)</span>
                  <input
                    type="number" step="10" className="adm-input"
                    value={form.accounting_cost_usd ?? ''}
                    onChange={(e) => set('accounting_cost_usd', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="Internal cost — flows to Accounting dashboard"
                  />
                </label>
              </div>
            </section>
          </>
        )}

      </div>{/* end .adm-editor-body */}

      {/* ── Sticky save/delete bar ────────────────────────────────────── */}
      <div className="adm-sticky-bar">
        <div className="adm-sticky-bar-info">
          {form.sku
            ? <><span className="adm-mono">{form.sku}</span> &middot; {form.name || 'Untitled'}</>
            : 'New product'}
        </div>
        <div className="adm-sticky-bar-actions">
          {!isNew && (
            <button type="button" className="adm-btn adm-btn-danger" disabled={deleting} onClick={remove}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button type="button" className="adm-btn adm-btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : isNew ? 'Create Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StoneGroupReadout({ group }: { group: StoneGroup }) {
  const eff = groupEffectiveSize(group);
  const b = computeStoneBreakdown(eff, group.count);
  if (!eff || b.total_carats <= 0) {
    return (
      <p className="adm-stone-readout adm-stone-readout--empty">
        Enter length &amp; width to estimate carats &amp; cost.
      </p>
    );
  }
  return (
    <p className="adm-stone-readout">
      <span>{b.carat_per_stone.toFixed(3)} ct each</span>
      <span className="adm-stone-readout-sep">·</span>
      <span><strong>{b.total_carats.toFixed(3)} ct</strong> total</span>
      <span className="adm-stone-readout-sep">·</span>
      <span>≈ <strong>${Math.round(b.total_stone_price_usd).toLocaleString('en-US')}</strong></span>
    </p>
  );
}

function LabourField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="adm-labour-field">
      <span className="adm-field-label">{label}</span>
      <div className="adm-chips adm-labour-presets">
        {LABOUR_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={`adm-chip${value === p ? ' is-active' : ''}`}
            onClick={() => onChange(p)}
          >
            ${p}
          </button>
        ))}
      </div>
      <input
        type="number" step="1" min="0" className="adm-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="Custom amount"
      />
    </div>
  );
}

function MetalGallerySlot({
  metal,
  images,
  onUpload,
  onRemove,
  onMove,
}: {
  metal: string;
  images: string[];
  onUpload: (files: FileList | File[]) => void;
  onRemove: (idx: number) => void;
  onMove: (idx: number, dir: -1 | 1) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const label = metal.replace(/_/g, ' ');

  return (
    <div className="adm-metal-slot">
      <div className="adm-metal-slot-head">
        <h3 className="adm-h3 adm-metal-slot-title">{label}</h3>
        <span className="adm-page-sub">
          {images.length === 0 ? 'Uses main gallery' : `${images.length} image${images.length === 1 ? '' : 's'}`}
        </span>
      </div>

      <div
        className={`adm-drop adm-drop--compact${dragOver ? ' is-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files);
        }}
        onClick={() => fileRef.current?.click()}
      >
        <span>+ Add photos for {label}</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => e.target.files && onUpload(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {images.length > 0 && (
        <div className="adm-thumb-strip">
          {images.map((src, i) => (
            <div key={src + i} className="adm-thumb-item">
              <Image src={src} alt="" width={88} height={88} unoptimized
                style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
              {i === 0 && <span className="adm-gallery-tag">Hero</span>}
              <div className="adm-thumb-actions">
                <button type="button" className="adm-icon-btn" onClick={() => onMove(i, -1)} disabled={i === 0} title="Move left">←</button>
                <button type="button" className="adm-icon-btn" onClick={() => onMove(i, 1)} disabled={i === images.length - 1} title="Move right">→</button>
                <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={() => onRemove(i)} title="Remove">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
