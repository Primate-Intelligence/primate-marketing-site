#!/usr/bin/env node
/**
 * refresh-snapshots.mjs (PRI-504) — deliberately bump the committed API
 * snapshots that the docs build reads:
 *
 *   src/spec/openapi.json          ← https://api.primateintelligence.ai/v1/openapi.json
 *   src/spec/error-registry.json   ← https://api.primateintelligence.ai/v1/errors
 *   src/snapshots/agents.md        ← https://api.primateintelligence.ai/docs/agents.md
 *   src/snapshots/changelog.md     ← https://api.primateintelligence.ai/docs/changelog.md
 *
 * The build NEVER fetches the live API (deterministic builds; an API blip
 * can't break docs, and an accidental API-side spec change can't silently
 * republish docs mid-freeze — Jeff's PRI-504 review). Drift between these
 * snapshots and the live API is surfaced by check-spec-drift.mjs; a human
 * runs this script, reviews the diff, and commits — drift is a reviewed
 * event, not a silent one.
 *
 * Run: node scripts/refresh-snapshots.mjs
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.primateintelligence.ai';

async function fetchText(url, minBytes) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`);
  const body = await res.text();
  if (body.length < minBytes) {
    throw new Error(`${url} suspiciously small (${body.length}B < ${minBytes}B) — refusing to overwrite snapshot`);
  }
  return body;
}

/** Canonical JSON formatting (sorted keys, 2-space indent) so diffs are meaningful. */
function canonicalJson(text) {
  return JSON.stringify(JSON.parse(text), null, 2) + '\n';
}

const targets = [
  { url: `${API}/v1/openapi.json`, dest: 'src/spec/openapi.json', min: 10_000, json: true },
  { url: `${API}/v1/errors`, dest: 'src/spec/error-registry.json', min: 2_000, json: true },
  { url: `${API}/docs/agents.md`, dest: 'src/snapshots/agents.md', min: 500, json: false },
  { url: `${API}/docs/changelog.md`, dest: 'src/snapshots/changelog.md', min: 500, json: false },
];

for (const t of targets) {
  const raw = await fetchText(t.url, t.min);
  const out = t.json ? canonicalJson(raw) : raw;
  mkdirSync(join(root, dirname(t.dest)), { recursive: true });
  writeFileSync(join(root, t.dest), out);
  console.log(`refreshed ${t.dest} (${out.length}B from ${t.url})`);
}
console.log('\nReview the diff, then commit. The API contract is FROZEN — an unexpected openapi.json diff during the freeze is a red flag, not a routine bump.');
