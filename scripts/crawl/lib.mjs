/**
 * Shared helpers for the danhov.com full-catalog mirror crawler.
 *
 * The crawl runs in stages, each writing JSON state under data/crawl/ so the
 * whole pipeline is resumable and inspectable:
 *
 *   01-discover.mjs        → products.manifest.json   (every product-page URL)
 *   02-galleries.mjs       → galleries.json           (metadata + full-res image URLs)
 *   03-download-upload.mjs → uploads.json             (danhov URL → storage URL map)
 *   04-build-catalog.mjs   → catalog.json             (final product rows)
 *
 * danhov.com is a Magento store. Every metal variant is its own product page
 * (…-14w, …-14y, …-18r). We mirror that 1:1 — one product record per page.
 */

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(__dirname, '..', '..');
export const CRAWL_DIR = join(ROOT, 'data', 'crawl');
mkdirSync(CRAWL_DIR, { recursive: true });

export const BASE = 'https://www.danhov.com';
export const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/**
 * The catalog tree, taken from the live megamenu (the footer links are stale
 * 404s — these are the canonical ones). `section` becomes the product's
 * primary `category`; `collection` is the sub-grouping (null for the
 * section-wide sweep that catches anything not under a sub-category).
 *
 * Metal-filter views (white/yellow/rose-gold) are intentionally omitted —
 * they're just filtered subsets of the collections and would only produce
 * URL duplicates (deduped anyway).
 */
export const CATEGORY_TREE = [
  // ── Engagement Rings (14 collections) ─────────────────────────────────
  { section: 'engagement', category: 'engagement', path: 'engagement-rings', collection: null },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/award-winners', collection: 'award-winners' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/swirl-engagement-rings-abbraccio', collection: 'abbraccio' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/carezza', collection: 'carezza' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/classico', collection: 'classico' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/couture', collection: 'couture' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/eleganza', collection: 'eleganza' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/per-lei', collection: 'per-lei' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/petalo', collection: 'petalo' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/solo-filo', collection: 'solo-filo' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/tubetto', collection: 'tubetto' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/unito', collection: 'unito' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/voltaggio', collection: 'voltaggio' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/norme-de-danhov', collection: 'norme-de-danhov' },
  { section: 'engagement', category: 'engagement', path: 'engagement-rings/perlina', collection: 'perlina' },

  // ── Wedding Bands ─────────────────────────────────────────────────────
  { section: 'wedding', category: 'wedding', path: 'wedding-bands', collection: null },
  { section: 'wedding', category: 'wedding', path: 'wedding-bands/award-winners', collection: 'award-winners' },
  { section: 'wedding', category: 'wedding', path: 'wedding-bands/her-bands', collection: 'her-bands' },
  { section: 'wedding', category: 'wedding', path: 'wedding-bands/his-bands', collection: 'his-bands' },

  // ── Fine Jewelry ──────────────────────────────────────────────────────
  { section: 'fine', category: 'fine', path: 'fine-jewelry', collection: null },
  { section: 'fine', category: 'fine', path: 'fine-jewelry/bands', collection: 'bands' },
  { section: 'fine', category: 'fine', path: 'fine-jewelry/earrings', collection: 'earrings' },
  { section: 'fine', category: 'fine', path: 'fine-jewelry/online', collection: 'online' },
  { section: 'fine', category: 'fine', path: 'fine-jewelry/pop-of-color', collection: 'pop-of-color' },
  { section: 'fine', category: 'fine', path: 'fine-jewelry/rings', collection: 'rings' },

  // ── Men's Jewelry ─────────────────────────────────────────────────────
  { section: 'mens', category: 'mens', path: 'men-jewelry', collection: null },
  { section: 'mens', category: 'mens', path: 'men-jewelry/rings', collection: 'rings' },
  { section: 'mens', category: 'mens', path: 'men-jewelry/bracelet', collection: 'bracelet' },
  { section: 'mens', category: 'mens', path: 'men-jewelry/necklaces-pendants', collection: 'necklaces-pendants' },
];

const CACHE_RE = /\/cache\/[a-f0-9]+\//i;

/** Strip Magento's /cache/{hash}/ segment → original full-resolution upload. */
export function toCanonical(url) {
  if (typeof url !== 'string') return url;
  return url.replace(CACHE_RE, '/');
}

/** Undo Magento's JSON escaping of URLs inside the gallery blob. */
export function decodeJsonUrl(s) {
  return s.replace(/\\\//g, '/').replace(/\\u002F/gi, '/').replace(/&amp;/g, '&');
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Hard wall-clock guard around any promise. Rejects after `ms` no matter
 * where the wrapped work is stuck (e.g. a Supabase upload with no internal
 * timeout, or a socket an AbortController didn't catch). Guarantees a worker
 * can never freeze indefinitely.
 */
export function withTimeout(promise, ms, label = 'op') {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

/** GET with browser UA, redirect-follow, and a few retries on transient errors. */
export async function fetchText(url, { retries = 3, timeoutMs = 45000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
          redirect: 'follow',
          signal: ctrl.signal,
        });
        if (res.status === 404) return { ok: false, status: 404, url: res.url, html: null };
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return { ok: true, status: res.status, url: res.url, html: await res.text() };
      } finally {
        clearTimeout(t);
      }
    } catch (e) {
      if (attempt === retries) return { ok: false, status: 0, url, html: null, error: String(e?.message || e) };
      await sleep(500 * (attempt + 1));
    }
  }
}

/**
 * Download a binary via the system `curl`, writing the body to a TEMP FILE
 * (not stdout). Writing to a pipe (`-o -`) deadlocks: when several large
 * bodies arrive faster than the parent drains stdout, curl blocks on the
 * pipe write and `--max-time` can't fire. A file sink has no such backpressure,
 * so --max-time reliably caps every transfer. A belt-and-suspenders parent
 * timer hard-kills the curl process if it somehow outlives --max-time.
 *
 * Returns { ok, buffer }.
 */
let __curlSeq = 0;
export function curlBuffer(url, { timeoutMs = 30000, retries = 2 } = {}) {
  return new Promise((resolve) => {
    const tmp = join(tmpdir(), `dh_${process.pid}_${__curlSeq++}_${(url.length * 2654435761) >>> 0}.bin`);
    const maxTime = Math.ceil(timeoutMs / 1000);
    const child = execFile(
      'curl',
      [
        '-s', // silent
        '-f', // fail (non-zero exit) on HTTP >= 400
        '-L', // follow redirects
        '-A', UA,
        '--max-time', String(maxTime),
        '--connect-timeout', '15',
        '--retry', String(retries),
        '--retry-delay', '1',
        '-o', tmp, // body to temp file (no pipe backpressure)
        url,
      ],
      { windowsHide: true },
      (err) => {
        clearTimeout(hardKill);
        if (err) {
          try { rmSync(tmp, { force: true }); } catch {}
          const code = typeof err.code === 'number' ? err.code : 0;
          resolve({ ok: false, status: code === 22 ? 404 : 0, error: `curl ${err.killed ? 'killed' : code}` });
          return;
        }
        try {
          const buf = readFileSync(tmp);
          rmSync(tmp, { force: true });
          if (!buf || buf.length === 0) {
            resolve({ ok: false, status: 0, error: 'empty body' });
            return;
          }
          resolve({ ok: true, status: 200, buffer: buf, contentType: '' });
        } catch (e) {
          try { rmSync(tmp, { force: true }); } catch {}
          resolve({ ok: false, status: 0, error: String(e?.message || e) });
        }
      }
    );
    // Hard kill ~5s past curl's own --max-time, in case the process wedges.
    const hardKill = setTimeout(() => {
      try { child.kill('SIGKILL'); } catch {}
    }, (maxTime + 5) * 1000);
  });
}

/** GET binary with retries → Buffer + content-type. */
export async function fetchBuffer(url, { retries = 5, timeoutMs = 20000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      // Keep the abort timer armed through the *body* read — a throttled
      // server can send headers then trickle/stall the body, which would
      // otherwise hang arrayBuffer() forever.
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctrl.signal });
        if (!res.ok) {
          if (res.status === 404) return { ok: false, status: 404 };
          throw new Error(`HTTP ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        return { ok: true, status: res.status, buffer: buf, contentType: res.headers.get('content-type') || '' };
      } finally {
        clearTimeout(t);
      }
    } catch (e) {
      if (attempt === retries) return { ok: false, status: 0, error: String(e?.message || e) };
      // Longer, jittered backoff — lets a throttle window pass before retrying.
      await sleep(800 * (attempt + 1) + Math.floor((url.length * 37) % 400));
    }
  }
}

/** Run `worker(item, index)` over items with bounded concurrency. */
export async function pool(items, concurrency, worker) {
  let i = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

// ── tiny JSON state helpers ────────────────────────────────────────────────
export function statePath(name) {
  return join(CRAWL_DIR, name);
}
export function readState(name, fallback) {
  const p = statePath(name);
  if (!existsSync(p)) return fallback;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}
export function writeState(name, data) {
  writeFileSync(statePath(name), JSON.stringify(data, null, 2));
}
