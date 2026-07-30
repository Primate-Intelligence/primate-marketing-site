#!/usr/bin/env node
/**
 * check-pricing-drift.mjs (PRI-523) — extends the PRI-508 pricing drift gate
 * to the www pricing page. Compares the SSR launch defaults in
 * src/lib/pricingDefaults.ts against the live GET /v1/credit-pricing config.
 *
 * The page hydrates live values client-side, but the SSR defaults are what
 * SEO crawlers, /pricing.md agents, and no-JS readers see — so they must
 * match the endpoint. Fails LOUDLY on mismatch so a human updates the
 * defaults deliberately.
 *
 * Network failure = exit 2 (infra, not drift), matching check-spec-drift.mjs.
 *
 * Run: node scripts/check-pricing-drift.mjs
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENDPOINT = 'https://api.primateintelligence.ai/v1/credit-pricing';

// Parse PRICING_DEFAULTS out of the TS module without a TS toolchain:
// the object literal is plain JSON-compatible values.
const src = readFileSync(join(root, 'src/lib/pricingDefaults.ts'), 'utf8');
const match = src.match(/PRICING_DEFAULTS[^=]*=\s*({[\s\S]*?});/);
if (!match) {
  console.error('[pricing-drift] could not locate PRICING_DEFAULTS in pricingDefaults.ts');
  process.exit(1);
}
const defaults = Function(`return (${match[1]})`)();

let live;
try {
  const res = await fetch(ENDPOINT, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  live = await res.json();
} catch (err) {
  console.error(`[pricing-drift] network failure fetching ${ENDPOINT}: ${err.message}`);
  console.error('[pricing-drift] exit 2 — infra, not drift');
  process.exit(2);
}

const KEYS = [
  'price_per_second_cents',
  'signup_grant_seconds',
  'card_grant_seconds',
  'auto_refill_threshold_seconds',
  'allowed_purchase_cents',
  'custom_purchase_enabled',
  'min_purchase_cents',
  'batch_discount_pct',
  'batch_min_prompts',
  'batch_max_prompts',
];

const drift = [];
for (const key of KEYS) {
  const a = JSON.stringify(defaults[key]);
  const b = JSON.stringify(live[key]);
  if (b === undefined) {
    // Older API omits batch fields — treat as drift only when defaults expect them
    drift.push(`${key}: live endpoint omits it (defaults say ${a})`);
  } else if (a !== b) {
    drift.push(`${key}: defaults=${a} live=${b}`);
  }
}

if (drift.length) {
  console.error('[pricing-drift] www pricing defaults DRIFTED from live /v1/credit-pricing:');
  for (const line of drift) console.error(`  - ${line}`);
  console.error('[pricing-drift] update src/lib/pricingDefaults.ts to match the endpoint.');
  process.exit(1);
}

console.log(`[pricing-drift] OK — ${KEYS.length} keys match live /v1/credit-pricing`);
