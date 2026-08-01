/**
 * Product app origin (the SPA).
 *
 * Single source of truth for every "Try Primate Vision" / "Live demo" CTA.
 * Overridden per-environment at build time via PUBLIC_APP_URL so the dev
 * marketing site (dev-www.primateintelligence.ai, built from the `dev`
 * branch) links to the dev SPA instead of prod. Defaults to prod.
 */
export const APP_URL: string =
  import.meta.env.PUBLIC_APP_URL || 'https://app.primateintelligence.ai';

/** App origin with trailing slash — the exact href used in CTAs. */
export const APP_HREF = `${APP_URL.replace(/\/$/, '')}/`;
