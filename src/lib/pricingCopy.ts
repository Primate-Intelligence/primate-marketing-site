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
