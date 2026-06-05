'use client';

import { useState } from 'react';

export default function PasswordForm() {
  const [next, setNext] = useState('');
  const [confirmField, setConfirmField] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  function flash(kind: 'ok' | 'err', msg: string) {
    setToast({ kind, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 10) return flash('err', 'Password must be at least 10 characters.');
    if (next !== confirmField) return flash('err', 'Passwords do not match.');
    setLoading(true);
    try {
      const r = await fetch('/api/admin/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: next }),
      });
      if (!r.ok) throw new Error((await r.json()).error ?? `${r.status}`);
      flash('ok', 'Password updated');
      setNext('');
      setConfirmField('');
    } catch (e) {
      flash('err', e instanceof Error ? e.message : 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="adm-fields">
      {toast && <div className={`adm-toast adm-toast--${toast.kind}`}>{toast.msg}</div>}
      <label className="adm-field adm-field--full">
        <span className="adm-field-label">New password</span>
        <input type="password" className="adm-input" value={next}
          onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={10} required />
        <span className="adm-page-sub">At least 10 characters</span>
      </label>
      <label className="adm-field adm-field--full">
        <span className="adm-field-label">Confirm new password</span>
        <input type="password" className="adm-input" value={confirmField}
          onChange={(e) => setConfirmField(e.target.value)} autoComplete="new-password" required />
      </label>
      <div className="adm-field adm-field--full">
        <button type="submit" className="adm-btn adm-btn-primary" disabled={loading}>
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </div>
    </form>
  );
}
