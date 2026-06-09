'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  id: string;
  currentStatus: string;
  email: string;
  name: string;
}

export default function AffiliateActions({ id, currentStatus, email, name }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function updateStatus(status: string) {
    setBusy(true);
    try {
      await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteRow() {
    if (!confirm(`Delete application from ${name}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await fetch('/api/admin/affiliates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-action-btns">
      {currentStatus !== 'approved' && (
        <button
          onClick={() => updateStatus('approved')}
          disabled={busy}
          className="adm-action-btn adm-action-btn--approve"
          title={`Approve ${name}`}
        >
          Approve
        </button>
      )}
      {currentStatus !== 'rejected' && (
        <button
          onClick={() => updateStatus('rejected')}
          disabled={busy}
          className="adm-action-btn adm-action-btn--reject"
          title={`Reject ${name}`}
        >
          Reject
        </button>
      )}
      <a href={`mailto:${email}`} className="adm-action-btn adm-action-btn--email">
        Email
      </a>
      <button
        onClick={deleteRow}
        disabled={busy}
        className="adm-action-btn adm-action-btn--delete"
        title={`Delete application from ${name}`}
      >
        Delete
      </button>
    </div>
  );
}
