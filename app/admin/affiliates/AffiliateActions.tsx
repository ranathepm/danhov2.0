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
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {currentStatus !== 'approved' && (
        <button
          onClick={() => updateStatus('approved')}
          disabled={busy}
          style={btnStyle('#2a7a2a')}
          title={`Approve ${name}`}
        >
          Approve
        </button>
      )}
      {currentStatus !== 'rejected' && (
        <button
          onClick={() => updateStatus('rejected')}
          disabled={busy}
          style={btnStyle('#AC3438')}
          title={`Reject ${name}`}
        >
          Reject
        </button>
      )}
      <a
        href={`mailto:${email}`}
        style={{ ...btnStyle('#AC3438'), textDecoration: 'none', display: 'inline-block' }}
      >
        Email
      </a>
      <button
        onClick={deleteRow}
        disabled={busy}
        style={btnStyle('#6b5e57')}
        title={`Delete application from ${name}`}
      >
        Delete
      </button>
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return {
    padding: '4px 12px',
    background: bg,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: 11,
    fontFamily: "'Jost', sans-serif",
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}
