/**
 * pricingDefaults.ts — PRI-523: single source of the launch-default pricing
 * numbers rendered at build time (SSR, for SEO) on /pricing, /pricing.md and
 * the FAQ. The live values come from GET /v1/credit-pricing and hydrate the
 * page client-side (see the inline script in pricing.astro); these defaults
 * are the documented launch config the API serves today.
 *
 * If the live endpoint config changes, scripts/check-pricing-drift.mjs fails
 * the build until these defaults are updated (extends the PRI-508 drift gate
 * to the www page).
 */

export const PRICING_ENDPOINT = 'https://api.primateintelligence.ai/v1/credit-pricing';

export interface CreditPricing {
  price_per_second_cents: number;
  signup_grant_seconds: number;
  card_grant_seconds: number;
  auto_refill_threshold_seconds: number;
  allowed_purchase_cents: number[];
  custom_purchase_enabled: boolean;
  min_purchase_cents: number;
  batch_discount_pct?: number;
  batch_min_prompts?: number;
  batch_max_prompts?: number;
}

export const PRICING_DEFAULTS: Required<CreditPricing> = {
  price_per_second_cents: 1,
  signup_grant_seconds: 6000,
  card_grant_seconds: 6000,
  auto_refill_threshold_seconds: 600,
  allowed_purchase_cents: [1000, 2500, 5000, 10000],
  custom_purchase_enabled: true,
  min_purchase_cents: 1000,
  batch_discount_pct: 50,
  batch_min_prompts: 2,
  batch_max_prompts: 10,
};

/** "$0.01" from cents-per-second. */
export function fmtRate(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** "6,000" from seconds. */
export function fmtSeconds(s: number): string {
  return s.toLocaleString('en-US');
}

/**
 * Batch worked example: video of `videoSeconds` with `prompts` prompts.
 * First prompt bills full duration; each additional bills at
 * (100 - batch_discount_pct)% of duration.
 */
export function batchExampleSeconds(
  videoSeconds: number,
  prompts: number,
  discountPct: number,
): number {
  const additionalFactor = (100 - discountPct) / 100;
  return Math.round(videoSeconds + (prompts - 1) * videoSeconds * additionalFactor);
}
