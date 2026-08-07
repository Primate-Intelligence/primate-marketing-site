/**
 * pricingCopy.ts — PRI-552: single source of truth for per-frame pricing copy
 * on the marketing site (mirrors the API repo's src/lib/pricing-copy.ts and
 * the PRI-508 pattern: no hand-typed pricing literals in pages/templates).
 *
 * Live values are served by GET /v1/credit-pricing (price_per_frame_cents,
 * signup_grant_frames); these constants are the static-render mirror. A price
 * change is ONE edit here + the config row, not a page-by-page copy hunt.
 */

/** Final per-frame rate (Matt sign-off 2026-08-06): cents per processed frame. */
export const PRICE_PER_FRAME_CENTS = 0.00015;

/** Free signup grant: fixed frame budget. 108,000 frames = 1 hour @ 30fps. */
export const SIGNUP_GRANT_FRAMES = 108000;

/** "$0.0000015" — per-frame price in dollars (for display). */
export const PRICE_PER_FRAME_USD = PRICE_PER_FRAME_CENTS / 100;

/** fps → minutes of monitoring the frame grant covers. */
export function grantMinutesAtFps(fps: number, frames: number = SIGNUP_GRANT_FRAMES): number {
  return frames / fps / 60;
}

/** The three pricing-page equivalence rows (Matt, PRI-552). */
export const GRANT_EQUIVALENCE_ROWS = [
  { fps: 30, label: '30 fps', duration: '60 minutes' },
  { fps: 5, label: '5 fps', duration: '360 minutes (6 hours)' },
  { fps: 1, label: '1 fps', duration: '1,800 minutes (30 hours)' },
] as const;

/** Headline framing: biggest literally-true number (1 fps). */
export const FREE_TIER_HEADLINE = 'Up to 30 hours of continuous monitoring free';

/** "108,000 frames" formatted. */
export const GRANT_FRAMES_LABEL = `${SIGNUP_GRANT_FRAMES.toLocaleString('en-US')} frames`;

// ── Paid tier (PRI-552 frame-native cutover, Matt Option A 2026-08-06) ───────
// Live source of truth: GET /v1/credit-pricing → price_per_frame_cents.
// These are the static-render mirror — a price change is ONE edit here.

/** "$0.0000015" — headline per-frame rate in dollars (0.00015¢), display string. */
export const PRICE_PER_FRAME_USD_LABEL = '$0.0000015';

/** ≈ one hour of continuous 30 fps video: 108,000 frames × 0.00015¢ = 16.2¢. */
export const PER_FRAME_30FPS_PER_HOUR_LABEL = '16¢';

// ── PRI-554: preview pricing (approved copy, Matt 2026-08-07) ──────────────
// Mirrors the API repo's PRICING_PREVIEW_CAVEAT single-source pattern.
// Policy: the rate is early-access and may change — up or down — as the
// model matures, customer demand develops, and processing costs change.
// Confirmed credit-value policy: purchased credits keep their value; rate
// changes apply to new processing only, changelog-announced first.

/** Rate-card eyebrow (replaces "Launch rate"). */
export const PREVIEW_PRICING_EYEBROW = 'Preview pricing';

/** Rate-card footnote sentence explaining what can move the rate and why. */
export const PREVIEW_PRICING_FOOTNOTE =
  'Preview pricing — set for early access and reviewed as the model matures, demand develops, and ' +
  'processing costs change; the rate may move up or down when the model leaves preview.';

/** One-line agent-facing form (llms.txt). */
export const PREVIEW_PRICING_LLMS_LINE =
  'PREVIEW PRICING: early-access rate, may change up or down with model maturity, demand, and ' +
  'processing costs; read the live rate from GET /v1/credit-pricing (pricing_tier: "preview"); ' +
  'never hardcode the rate.';

/** FAQ-length sentence appended to cost answers. */
export const PREVIEW_PRICING_FAQ_SENTENCE =
  'This is preview pricing — the rate may move up or down as the model matures, demand develops, ' +
  'and processing costs change.';

/** Per-fps cost equivalence rows for the paid-tier card (1 hour of video).
 *  30 fps: 108,000 × 0.00015¢ = 16.2¢ · 5 fps: 18,000 × 0.00015¢ = 2.7¢ ·
 *  1 fps: 3,600 × 0.00015¢ = 0.54¢. */
export const PAID_RATE_EQUIVALENCE_ROWS = [
  { label: '30 fps', cost: '≈16¢ / hour' },
  { label: '5 fps', cost: '≈2.7¢ / hour' },
  { label: '1 fps', cost: '≈0.5¢ / hour' },
] as const;
