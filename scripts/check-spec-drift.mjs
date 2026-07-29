#!/usr/bin/env node
/**
 * check-spec-drift.mjs (PRI-504) — CI drift gate for the committed API
 * snapshots. Fails LOUDLY when the live API disagrees with what the docs
 * were built from, so a human bumps the snapshots deliberately
 * (scripts/refresh-snapshots.mjs) instead of the docs drifting silently.
 *
 * Semantic comparison for JSON (parsed, key-order-insensitive); exact bytes
 * for markdown. Network failure = exit 2 (infra, not drift) so a flaky API
 * doesn't masquerade as a contract change.
 *
 * Run: node scripts/check-spec-drift.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API = 'https://api.primateintelligence.ai';

const targets = [
  { url: `${API}/v1/openapi.json`, local: 'src/spec/openapi.json', json: true },
  { url: `${API}/v1/errors`, local: 'src/spec/error-registry.json', json: true },
  { url: `${API}/docs/agents.md`, local: 'src/snapshots/agents.md', json: false },
  { url: `${API}/docs/changelog.md`, local: 'src/snapshots/changelog.md', json: false },
];

/** Deep key-sorted stringify — key order is formatting, not contract. */
function sortDeep(value) {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortDeep(value[k])]),
    );
  }
  return value;
}

function canon(text) {
  return JSON.stringify(sortDeep(JSON.parse(text)));
}

let drift = 0;
for (const t of targets) {
  let live;
  try {
    const res = await fetch(t.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    live = await res.text();
  } catch (err) {
    console.error(`INFRA: could not fetch ${t.url} (${err.message}) — cannot check drift`);
    process.exit(2);
  }
  const local = readFileSync(join(root, t.local), 'utf8');
  const same = t.json ? canon(live) === canon(local) : live === local;
  if (same) {
    console.log(`ok      ${t.local}`);
  } else {
    drift++;
    console.error(`DRIFT   ${t.local} differs from ${t.url}`);
  }
}

if (drift) {
  console.error(
    `\n${drift} snapshot(s) drifted from the live API. The docs no longer match the contract.` +
      `\nFix: review the change, then run  node scripts/refresh-snapshots.mjs  and commit.` +
      `\nNOTE: the API contract is FROZEN for MCP scoring — unexpected openapi drift may indicate an unauthorized contract change. Escalate before bumping.`,
  );
  process.exit(1);
}
console.log('\nAll snapshots match the live API.');
