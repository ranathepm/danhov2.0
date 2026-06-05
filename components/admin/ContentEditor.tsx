'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Item = {
  key: string;
  category: string;
  label: string;
  multiline: boolean;
  defaultValue: string;
  currentValue: string;
};

export default function ContentEditor({
  items,
  categories,
}: {
  items: Item[];
  categories: string[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    () => Object.fromEntries(items.map((i) => [i.key, i.currentValue]))
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [activeCat, setActiveCat] = useState(categories[0]);

  function flash(kind: 'ok' | 'err', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 2500);
  }

  async function save(it: Item) {
    setSavingKey(it.key);
    try {
      const r = await fetch('/api/admin/content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: it.key,
          value: values[it.key],
          category: it.category,
          description: it.label,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
      flash('ok', 'Saved · live within a minute');
      router.refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingKey(null);
    }
  }

  async function reset(it: Item) {
    if (!confirm('Reset this field to the original copy?')) return;
    setSavingKey(it.key);
    try {
      const r = await fetch(`/api/admin/content?key=${encodeURIComponent(it.key)}`, {
        method: 'DELETE',
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
      setValues((prev) => ({ ...prev, [it.key]: it.defaultValue }));
      flash('ok', 'Reset to original');
      router.refresh();
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setSavingKey(null);
    }
  }

  const visible = items.filter((i) => i.category === activeCat);

  return (
    <>
      {toast && <div className={`adm-toast adm-toast--${toast.kind}`}>{toast.msg}</div>}
      <div className="adm-tabs">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`adm-tab${activeCat === c ? ' is-active' : ''}`}
            onClick={() => setActiveCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="adm-content-list">
        {visible.map((it) => {
          const dirty = values[it.key] !== it.currentValue;
          const overridden = it.currentValue !== it.defaultValue;
          return (
            <div key={it.key} className="adm-card adm-content-card">
              <div className="adm-content-head">
                <div>
                  <div className="adm-field-label">{it.label}</div>
                  <div className="adm-mono adm-page-sub">{it.key}</div>
                </div>
                <div className="adm-content-tags">
                  {overridden && <span className="adm-pill adm-pill--active">overridden</span>}
                  {dirty && <span className="adm-pill adm-pill--pending">unsaved</span>}
                </div>
              </div>
              {it.multiline ? (
                <textarea
                  className="adm-input adm-input--mono"
                  rows={Math.max(3, Math.min(8, (values[it.key]?.split('\n').length ?? 1) + 1))}
                  value={values[it.key]}
                  onChange={(e) => setValues((p) => ({ ...p, [it.key]: e.target.value }))}
                />
              ) : (
                <input
                  className="adm-input"
                  value={values[it.key]}
                  onChange={(e) => setValues((p) => ({ ...p, [it.key]: e.target.value }))}
                />
              )}
              <div className="adm-content-actions">
                {overridden && (
                  <button type="button" className="adm-link adm-link--danger"
                    onClick={() => reset(it)} disabled={savingKey === it.key}>
                    Reset to original
                  </button>
                )}
                <button type="button" className="adm-btn adm-btn-primary adm-btn--sm"
                  disabled={!dirty || savingKey === it.key}
                  onClick={() => save(it)}>
                  {savingKey === it.key ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
