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
  /** Per-metal gallery overrides keyed by metal slug. Customer-facing
   *  product page swaps to these when a metal swatch is clicked. */
  metal_images: Record<string, string[]> | null;
  price_display: string | null;
  description?: string | null;
  default_metal: string | null;
  gold_weight_g: number | null;
  markup_multiplier: number | null;
  base_labor_usd: number | null;        // jewellery labour
  diamond_labor_usd: number | null;     // diamond-setting labour
  stones_value_usd: number | null;
  // New manual stone-spec fields the studio fills on creation; the
  // three carat/$/total numbers below are auto-derived from these.
  stone_count_input: number | null;
  stone_size_mm: number | null;
  // One or more stone groups, each {count, size_mm, shape}. The first
  // group mirrors stone_count_input / stone_size_mm for back-compat.
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

// Quick-pick labour amounts shown as chips next to each labour input.
const LABOUR_PRESETS = [100, 200, 300, 400];

function blankStoneGroup(): StoneGroup {
  return { count: null, size_mm: null, length_mm: null, width_mm: null, shape: 'round' };
}

// Effective diameter from length × width (avg); falls back to size_mm.
function groupEffectiveSize(g: StoneGroup): number | null {
  const l = g.length_mm ?? null;
  const w = g.width_mm ?? null;
  if (l != null && w != null) return (Number(l) + Number(w)) / 2;
  if (l != null) return Number(l);
  if (w != null) return Number(w);
  return g.size_mm ?? null;
}

// Seed the editable stone-group list: prefer a stored stone_groups array,
// otherwise fall back to the legacy single count/size pair, otherwise one
// empty group so the studio always has a row to fill.
function initialStoneGroups(p: {
  stone_groups: StoneGroup[] | null;
  stone_count_input: number | null;
  stone_size_mm: number | null;
}): StoneGroup[] {
  if (Array.isArray(p.stone_groups) && p.stone_groups.length > 0) {
    return p.stone_groups.map((g) => ({
      count: g?.count ?? null,
      size_mm: g?.size_mm ?? null,
      // Seed length/width from stored values, else mirror the legacy
      // single size_mm into both so old products still show numbers.
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

  // Auto-derived full product cost — recomputes whenever the studio
  // changes the mm size, stone count, weight, labour, or default metal.
  // Displayed read-only so the numbers feel "looked up" rather than
  // editable. The third row is the ALL-IN product price
  // (stone cost + metal cost + labour) — no markup multiplier.
  const productTotal = useMemo(
    () =>
      computeProductTotal({
        stoneGroups: form.stone_groups,
        weightInPlatinumG: form.gold_weight_g,
        jewelleryLabourUsd: form.base_labor_usd,
        diamondLabourUsd: form.diamond_labor_usd,
        defaultMetal: form.default_metal,
      }),
    [
      form.stone_groups,
      form.gold_weight_g,
      form.base_labor_usd,
      form.diamond_labor_usd,
      form.default_metal,
    ],
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

  // ── Stone-group helpers ───────────────────────────────────────────
  function updateStoneGroup(idx: number, patch: Partial<StoneGroup>) {
    setForm((f) => {
      const groups = (f.stone_groups ?? []).map((g, i) =>
        i === idx ? { ...g, ...patch } : g,
      );
      return { ...f, stone_groups: groups };
    });
  }

  function addStoneGroup() {
    setForm((f) => ({
      ...f,
      stone_groups: [...(f.stone_groups ?? []), blankStoneGroup()],
    }));
  }

  function removeStoneGroup(idx: number) {
    setForm((f) => {
      const groups = (f.stone_groups ?? []).filter((_, i) => i !== idx);
      return {
        ...f,
        stone_groups: groups.length > 0 ? groups : [blankStoneGroup()],
      };
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
      // Drop empty trailing groups and mirror the first group back into the
      // legacy single count/size columns so customer-facing reads (which
      // still use stone_count_input / stone_size_mm) keep working.
      const cleanGroups = (form.stone_groups ?? [])
        .filter((g) => g.count != null || g.length_mm != null || g.width_mm != null || g.size_mm != null)
        // Keep size_mm (effective diameter) in sync on save so pricing reads work.
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
      const res = await fetch(`/api/admin/products/${encodeURIComponent(product.sku)}`, {
        method: 'DELETE',
      });
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
          setUploads((prev) =>
            prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u))
          );
        });
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'done', progress: 100, url } : u))
        );
        setForm((f) => ({ ...f, images: [...(f.images ?? []), url] }));
      } catch (e) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? { ...u, status: 'error', error: e instanceof Error ? e.message : 'failed' }
              : u
          )
        );
      }
    }
    // Auto-clear the completed list after 5s
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status === 'uploading'));
    }, 5000);
  }

  function uploadWithProgress(file: File, onProgress: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/admin/upload');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.url) return resolve(data.url);
            reject(new Error('No URL returned'));
          } catch {
            reject(new Error('Invalid response'));
          }
        } else {
          let msg = `Upload failed (${xhr.status})`;
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.error) msg = data.error;
          } catch {}
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
    setForm((f) => ({
      ...f,
      images: (f.images ?? []).filter((_, i) => i !== idx),
    }));
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

  // ── Per-metal gallery helpers ──────────────────────────────────────
  // Upload one or more files into a specific metal's gallery slot.
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
          setUploads((prev) =>
            prev.map((u) => (u.id === item.id ? { ...u, progress: pct } : u))
          );
        });
        setUploads((prev) =>
          prev.map((u) => (u.id === item.id ? { ...u, status: 'done', progress: 100, url } : u))
        );
        setForm((f) => {
          const map = { ...(f.metal_images ?? {}) };
          const arr = map[metal] ? [...map[metal]] : [];
          arr.push(url);
          map[metal] = arr;
          return { ...f, metal_images: map };
        });
      } catch (e) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === item.id
              ? { ...u, status: 'error', error: e instanceof Error ? e.message : 'failed' }
              : u
          )
        );
      }
    }
    setTimeout(() => {
      setUploads((prev) => prev.filter((u) => u.status === 'uploading'));
    }, 5000);
  }

  function removeMetalImage(metal: string, idx: number) {
    setForm((f) => {
      const map = { ...(f.metal_images ?? {}) };
      const arr = (map[metal] ?? []).filter((_, i) => i !== idx);
      if (arr.length === 0) delete map[metal];
      else map[metal] = arr;
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
      const set = new Set(f.metals ?? []);
      if (set.has(m)) set.delete(m);
      else set.add(m);
      return { ...f, metals: Array.from(set) };
    });
  }

  function toggleCategory(c: string) {
    setForm((f) => {
      const set = new Set(f.categories ?? []);
      if (set.has(c)) set.delete(c);
      else set.add(c);
      return { ...f, categories: Array.from(set) };
    });
  }

  return (
    <div className="adm-edit">
      {toast && <div className={`adm-toast adm-toast--${toast.kind}`}>{toast.msg}</div>}

      <div className="adm-edit-grid">
        {/* IMAGES */}
        <section className="adm-card">
          <header className="adm-card-head">
            <h2 className="adm-h2">Gallery</h2>
            <span className="adm-page-sub">{(form.images ?? []).length} images</span>
          </header>

          <div
            className={`adm-drop${dragOver ? ' is-over' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M12 4v12m-6-6 6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>Drop images here or click to browse</p>
            <span className="adm-page-sub">PNG / JPG / WebP — up to 12MB each</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && uploadFiles(e.target.files)}
              style={{ display: 'none' }}
            />
          </div>

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
                  <div className="adm-upload-bar">
                    <div style={{ width: `${u.progress}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="adm-gallery">
            {(form.images ?? []).map((src, i) => (
              <div key={src + i} className="adm-gallery-cell">
                <Image src={src} alt="" width={140} height={140} unoptimized />
                <div className="adm-gallery-overlay">
                  <button type="button" className="adm-icon-btn" onClick={() => moveImage(i, -1)} disabled={i === 0} title="Move up">↑</button>
                  <button type="button" className="adm-icon-btn" onClick={() => moveImage(i, 1)} disabled={i === (form.images ?? []).length - 1} title="Move down">↓</button>
                  <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={() => removeImage(i)} title="Remove">✕</button>
                </div>
                {i === 0 && <span className="adm-gallery-tag">Hero</span>}
              </div>
            ))}
          </div>
        </section>

        {/* PER-METAL GALLERIES — one mini uploader per selected metal so
            the live product page can swap photos when a customer picks
            a metal swatch. If a metal has no per-metal images uploaded,
            the public site falls back to the main Gallery above. */}
        {(form.metals ?? []).length > 0 && (
          <section className="adm-card">
            <header className="adm-card-head">
              <h2 className="adm-h2">Per-metal galleries</h2>
              <span className="adm-page-sub">
                Upload photos for each metal variant. Empty rows fall back to the main gallery.
              </span>
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

        {/* DETAILS */}
        <section className="adm-card">
          <header className="adm-card-head"><h2 className="adm-h2">Details</h2></header>
          <div className="adm-fields">
            <label className="adm-field">
              <span className="adm-field-label">SKU *</span>
              <input className="adm-input adm-mono" value={form.sku} disabled={!isNew}
                onChange={(e) => set('sku', e.target.value)} />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">Slug *</span>
              <input className="adm-input adm-mono" value={form.slug}
                onChange={(e) => set('slug', e.target.value)} placeholder="ae520uq" />
            </label>
            <label className="adm-field adm-field--full">
              <span className="adm-field-label">Name *</span>
              <input className="adm-input" value={form.name}
                onChange={(e) => set('name', e.target.value)} placeholder="Abbraccio Swirl Diamond Ring" />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">Collection</span>
              <input className="adm-input" value={form.collection ?? ''}
                onChange={(e) => set('collection', e.target.value || null)} placeholder="Abbraccio" />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">Primary category *</span>
              <select className="adm-select" value={form.category}
                onChange={(e) => set('category', e.target.value)}>
                <option value="engagement">Engagement rings</option>
                <option value="wedding">Wedding bands</option>
                <option value="fine">Fine jewelry</option>
                <option value="mens">Men&apos;s</option>
              </select>
            </label>
            <div className="adm-field adm-field--full">
              <span className="adm-field-label">Also appears in</span>
              <div className="adm-chips">
                {['engagement','wedding','fine','mens'].map((c) => (
                  <button key={c} type="button"
                    className={`adm-chip${(form.categories ?? []).includes(c) ? ' is-active' : ''}`}
                    onClick={() => toggleCategory(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <label className="adm-field adm-field--full">
              <span className="adm-field-label">Display price (legacy / fallback)</span>
              <input className="adm-input" value={form.price_display ?? ''}
                onChange={(e) => set('price_display', e.target.value || null)} placeholder="From $5,390" />
            </label>
            <label className="adm-field adm-field--full">
              <span className="adm-field-label">Description (optional internal note)</span>
              <textarea rows={3} className="adm-input"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)} />
            </label>
            <div className="adm-field adm-field--full">
              <label className="adm-checkbox">
                <input type="checkbox" checked={form.is_active}
                  onChange={(e) => set('is_active', e.target.checked)} />
                <span>Active (visible on the live site)</span>
              </label>
            </div>
          </div>
        </section>

        {/* METALS */}
        <section className="adm-card">
          <header className="adm-card-head"><h2 className="adm-h2">Metals available</h2></header>
          <div className="adm-chips">
            {METAL_OPTIONS.map((m) => (
              <button key={m} type="button"
                className={`adm-chip${(form.metals ?? []).includes(m) ? ' is-active' : ''}`}
                onClick={() => toggleMetal(m)}>
                {m.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </section>

        {/* PIECE SPECS — the studio enters these by hand */}
        <section className="adm-card">
          <header className="adm-card-head"><h2 className="adm-h2">Piece specs</h2></header>
          <div className="adm-fields">
            <label className="adm-field">
              <span className="adm-field-label">Default metal</span>
              <select className="adm-select" value={form.default_metal ?? 'platinum'}
                onChange={(e) => set('default_metal', e.target.value)}>
                {METAL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m === 'platinum' ? 'Platinum' : m.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span className="adm-field-label">Weight in platinum (grams)</span>
              <input type="number" step="0.1" className="adm-input"
                value={form.gold_weight_g ?? ''}
                onChange={(e) => set('gold_weight_g', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="e.g. 4.8" />
            </label>
          </div>

          {/* STONE GROUPS — one or more sets of stones, each with its own
              count, mm size and diamond shape. The + button adds another. */}
          <div className="adm-stone-groups">
            {(form.stone_groups ?? []).map((g, i) => (
              <div className="adm-stone-group" key={i}>
                <div className="adm-stone-group-head">
                  <span className="adm-field-label">
                    {i === 0 ? 'Stones' : `Stone group ${i + 1}`}
                  </span>
                  {(form.stone_groups ?? []).length > 1 && (
                    <button type="button" className="adm-link adm-link--danger"
                      onClick={() => removeStoneGroup(i)}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="adm-fields">
                  <label className="adm-field">
                    <span className="adm-field-label">Number of stones</span>
                    <input type="number" step="1" min="0" className="adm-input"
                      value={g.count ?? ''}
                      onChange={(e) => updateStoneGroup(i, { count: e.target.value === '' ? null : Number(e.target.value) })}
                      placeholder="e.g. 38" />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Length (mm)</span>
                    <input type="number" step="0.05" min="0" className="adm-input"
                      value={g.length_mm ?? ''}
                      onChange={(e) => {
                        const length = e.target.value === '' ? null : Number(e.target.value);
                        const width = g.width_mm ?? null;
                        const eff = length != null && width != null ? (length + width) / 2 : (length ?? width);
                        updateStoneGroup(i, { length_mm: length, size_mm: eff });
                      }}
                      placeholder="e.g. 6.50" />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Width (mm)</span>
                    <input type="number" step="0.05" min="0" className="adm-input"
                      value={g.width_mm ?? ''}
                      onChange={(e) => {
                        const width = e.target.value === '' ? null : Number(e.target.value);
                        const length = g.length_mm ?? null;
                        const eff = length != null && width != null ? (length + width) / 2 : (width ?? length);
                        updateStoneGroup(i, { width_mm: width, size_mm: eff });
                      }}
                      placeholder="e.g. 6.50" />
                  </label>
                  <label className="adm-field">
                    <span className="adm-field-label">Diamond shape</span>
                    <div className="adm-shape-select">
                      <DiamondShapeIcon shape={g.shape} className="adm-shape-select-icon" />
                      <select className="adm-select adm-select--with-icon" value={g.shape ?? 'round'}
                        onChange={(e) => updateStoneGroup(i, { shape: e.target.value })}>
                        {DIAMOND_SHAPES.map((s) => (
                          <option key={s.slug} value={s.slug}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </label>
                </div>

                {/* Live per-group readout so the studio sees the carats and
                    cost of this set of stones as they type. */}
                <StoneGroupReadout group={g} />
              </div>
            ))}
            <button type="button" className="adm-add-group" onClick={addStoneGroup}>
              <span aria-hidden>＋</span> Add stone group
            </button>
          </div>

          {/* LABOUR — split into jewellery + diamond, each with quick-pick
              presets plus a free-text custom amount. */}
          <div className="adm-labour-block">
            <div className="adm-fields adm-labour-fields">
              <LabourField
                label="Jewellery labour (USD)"
                value={form.base_labor_usd}
                onChange={(v) => set('base_labor_usd', v)}
              />
              <LabourField
                label="Diamond Setting Labour (USD)"
                value={form.diamond_labor_usd}
                onChange={(v) => set('diamond_labor_usd', v)}
              />
            </div>
            <div className="adm-labour-total">
              <span className="adm-field-label">Total labour</span>
              <strong>
                ${(((form.base_labor_usd ?? 0) + (form.diamond_labor_usd ?? 0)) || 0).toLocaleString('en-US')}
              </strong>
            </div>
          </div>
        </section>

        {/* AUTO-FILLED — derived from the inputs above. The third row is
            the ALL-IN product price (stone cost + metal cost + labour). */}
        <section className="adm-card">
          <header className="adm-card-head">
            <h2 className="adm-h2">Pricing (auto-filled)</h2>
            <span className="adm-page-sub">
              Updates as you edit the inputs above.
            </span>
          </header>
          <div className="adm-fields">
            <label className="adm-field">
              <span className="adm-field-label">Total carats</span>
              <input
                type="text"
                className="adm-input adm-input--readonly"
                value={productTotal.total_carats > 0
                  ? `${productTotal.total_carats.toFixed(3)} ct`
                  : '—'}
                readOnly
                aria-readonly
              />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">Price per carat</span>
              <input
                type="text"
                className="adm-input adm-input--readonly"
                value={productTotal.price_per_carat_usd > 0
                  ? `$${productTotal.price_per_carat_usd.toLocaleString('en-US')}/ct`
                  : '—'}
                readOnly
                aria-readonly
              />
            </label>
            <label className="adm-field">
              <span className="adm-field-label">Total product price</span>
              <input
                type="text"
                className="adm-input adm-input--readonly"
                value={productTotal.total_product_price_usd > 0
                  ? `$${Math.round(productTotal.total_product_price_usd).toLocaleString('en-US')}`
                  : '—'}
                readOnly
                aria-readonly
              />
            </label>
            <div className="adm-field adm-field--full">
              <div className="adm-page-sub" style={{ lineHeight: 1.7 }}>
                Stones <strong>${Math.round(productTotal.total_stone_price_usd).toLocaleString('en-US')}</strong>{' '}
                · Metal ({productTotal.metal_weight_g.toFixed(2)} g @ ${productTotal.metal_price_per_g_usd}/g){' '}
                <strong>${Math.round(productTotal.metal_cost_usd).toLocaleString('en-US')}</strong>{' '}
                · Jewellery labour <strong>${Math.round(form.base_labor_usd ?? 0).toLocaleString('en-US')}</strong>{' '}
                · Diamond setting labour <strong>${Math.round(form.diamond_labor_usd ?? 0).toLocaleString('en-US')}</strong>
              </div>
            </div>
            <label className="adm-field adm-field--full">
              <span className="adm-field-label">Total Stone Value (USD) — override</span>
              <input type="number" step="50" className="adm-input"
                value={form.stones_value_usd ?? ''}
                onChange={(e) => set('stones_value_usd', e.target.value === '' ? null : Number(e.target.value))}
                placeholder={
                  productTotal.total_stone_price_usd > 0
                    ? `Auto: ${Math.round(productTotal.total_stone_price_usd)}`
                    : '0'
                } />
              <span className="adm-page-sub" style={{ marginTop: 6 }}>
                Leave blank to use the auto value. Set a number here to override (e.g. if you paid a different lot price).
              </span>
            </label>
            <label className="adm-field adm-field--full">
              <span className="adm-field-label">Accounting cost (USD)</span>
              <input type="number" step="10" className="adm-input"
                value={form.accounting_cost_usd ?? ''}
                onChange={(e) => set('accounting_cost_usd', e.target.value === '' ? null : Number(e.target.value))}
                placeholder="What you booked the piece in at — flows to /admin/accounting" />
            </label>
          </div>
        </section>
      </div>

      <div className="adm-sticky-bar">
        <div className="adm-sticky-bar-info">
          {form.sku ? <><span className="adm-mono">{form.sku}</span> &middot; {form.name || 'Untitled'}</> : 'New product'}
        </div>
        <div className="adm-sticky-bar-actions">
          {!isNew && (
            <button type="button" className="adm-btn adm-btn-danger" disabled={deleting} onClick={remove}>
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          <button type="button" className="adm-btn adm-btn-primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Live cost readout for a single stone group — shows carats per stone, total
 * carats, and the estimated stone cost, recomputed as the studio types. Stays
 * silent until there's enough input (a size) to compute something.
 */
function StoneGroupReadout({ group }: { group: StoneGroup }) {
  const eff = groupEffectiveSize(group);
  const b = computeStoneBreakdown(eff, group.count);
  if (!eff || b.total_carats <= 0) {
    return (
      <p className="adm-stone-readout adm-stone-readout--empty">
        Enter the stone length &amp; width to estimate carats &amp; cost.
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

/**
 * A labour input with quick-pick preset chips ($100/$200/$300/$400) plus
 * a free-text custom amount. A preset is highlighted when it matches the
 * current value; the studio can still type any number in the box.
 */
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
    <div className="adm-field adm-field--full">
      <span className="adm-field-label">{label}</span>
      <div className="adm-chips adm-labour-presets">
        {LABOUR_PRESETS.map((p) => (
          <button key={p} type="button"
            className={`adm-chip${value === p ? ' is-active' : ''}`}
            onClick={() => onChange(p)}>
            ${p}
          </button>
        ))}
      </div>
      <input type="number" step="10" min="0" className="adm-input"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        placeholder="Custom amount, e.g. 450" />
    </div>
  );
}

/**
 * One uploader + thumbnail strip per metal variant. Same drag/drop +
 * click-to-browse pattern as the main Gallery card, but scoped to a
 * single metal slug.
 */
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
        <span>+ Drop or click to add photos for {label}</span>
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
        <div className="adm-gallery">
          {images.map((src, i) => (
            <div key={src + i} className="adm-gallery-cell">
              <Image src={src} alt="" width={120} height={120} unoptimized />
              <div className="adm-gallery-overlay">
                <button type="button" className="adm-icon-btn" onClick={() => onMove(i, -1)} disabled={i === 0} title="Move up">↑</button>
                <button type="button" className="adm-icon-btn" onClick={() => onMove(i, 1)} disabled={i === images.length - 1} title="Move down">↓</button>
                <button type="button" className="adm-icon-btn adm-icon-btn--danger" onClick={() => onRemove(i)} title="Remove">✕</button>
              </div>
              {i === 0 && <span className="adm-gallery-tag">Hero</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
