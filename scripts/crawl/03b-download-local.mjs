/**
 * Stage 3b — download every unique full-resolution image to a local mirror
 * using ONE `curl --parallel` process.
 *
 * Why: orchestrating ~14k downloads as individual node-spawned child
 * processes kept wedging (undici pool, then curl stdout-pipe backpressure).
 * curl's own --parallel engine is built for exactly this — thousands of
 * transfers in a single process, each with its own --max-time. No node in
 * the per-file loop.
 *
 * Resumable: only URLs whose local file is missing/empty are queued, so
 * re-running fills gaps. Local mirror lives at LOCAL_ROOT, keyed by the
 * danhov media path (a/e/ae520uq_r1_1_wg.jpg).
 *
 * Run:  node scripts/crawl/03b-download-local.mjs
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { UA, readState, statePath } from './lib.mjs';

export const LOCAL_ROOT = 'C:/tmp/danhov_media';
const MEDIA_PREFIX = '/media/catalog/product/';
const PARALLEL = 20;

export function keyForUrl(url) {
  const u = new URL(url);
  let p = u.pathname;
  const i = p.indexOf(MEDIA_PREFIX);
  if (i >= 0) p = p.slice(i + MEDIA_PREFIX.length);
  else p = p.replace(/^\/+/, '');
  return p.replace(/^cache\/[a-f0-9]+\//i, '').replace(/^\/+/, '');
}

export function localPathFor(url) {
  return `${LOCAL_ROOT}/${keyForUrl(url)}`;
}

function main() {
  const galleries = readState('galleries.json', {});
  const urlSet = new Set();
  for (const p of Object.values(galleries)) for (const u of p.images || []) urlSet.add(u);
  const allUrls = [...urlSet];

  mkdirSync(LOCAL_ROOT, { recursive: true });

  const todo = allUrls.filter((u) => {
    const lp = localPathFor(u);
    try {
      return statSync(lp).size === 0;
    } catch {
      return true; // missing
    }
  });

  console.log(`→ ${allUrls.length} unique images · ${todo.length} to download · ${allUrls.length - todo.length} already local\n`);
  if (todo.length === 0) {
    console.log('✓ local mirror already complete');
    return;
  }

  // Build a curl config file: url + output pairs. Pre-create dirs so curl
  // doesn't race on --create-dirs for the same folder across parallel xfers.
  const lines = [];
  const dirs = new Set();
  for (const u of todo) {
    const out = localPathFor(u);
    const d = dirname(out);
    if (!dirs.has(d)) {
      mkdirSync(d, { recursive: true });
      dirs.add(d);
    }
    lines.push(`url = "${u}"`);
    lines.push(`output = "${out}"`);
  }
  const cfg = statePath('curl-download.txt');
  writeFileSync(cfg, lines.join('\n'));
  console.log(`  wrote curl config (${todo.length} transfers) → ${cfg}\n`);

  const args = [
    '-sS',
    '--parallel',
    '--parallel-max', String(PARALLEL),
    '-L',
    '-f',
    '--retry', '2',
    '--retry-delay', '1',
    '--connect-timeout', '15',
    '--max-time', '90',
    '-A', UA,
    '-K', cfg,
  ];

  console.log(`  launching: curl --parallel --parallel-max ${PARALLEL} …\n`);
  const child = spawn('curl', args, { stdio: ['ignore', 'inherit', 'inherit'] });

  child.on('close', (code) => {
    // curl exits non-zero if ANY transfer failed (-f) — that's fine, we
    // verify by counting local files and the gaps get retried on re-run.
    let have = 0;
    for (const u of allUrls) {
      try {
        if (statSync(localPathFor(u)).size > 0) have++;
      } catch {}
    }
    console.log(`\n✓ curl exited (code ${code}). local images present: ${have}/${allUrls.length}`);
    if (have < allUrls.length) {
      console.log(`  ${allUrls.length - have} still missing — re-run to retry just those.`);
    }
  });
}

// Only run the download when executed directly — 03c imports the helpers above.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
