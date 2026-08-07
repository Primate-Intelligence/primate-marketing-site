/**
 * FAQ copy (PRI-492) — single source of truth for the visible FAQ sections
 * AND their schema.org FAQPage JSON-LD. Rendering both from this module
 * guarantees the JSON-LD matches the visible text exactly (a Google/LLM
 * eligibility requirement for FAQPage markup).
 */

import { GRANT_FRAMES_LABEL, PREVIEW_PRICING_FAQ_SENTENCE } from './pricingCopy';

export interface FaqItem {
  q: string;
  a: string;
}

export const PRICING_FAQ: FaqItem[] = [
  {
    q: 'How much does video analysis cost?',
    a: `The rate is $0.0000015 per frame processed (0.00015¢/frame) — replacing our previous per-second model. An hour of 30 fps video is about 16¢; the same hour at 1 fps is about half a cent, so your capture rate sets your cost. Queued time is never charged and failed jobs are not charged. ${PREVIEW_PRICING_FAQ_SENTENCE} The live rate is always at GET /v1/credit-pricing.`,
  },
  {
    // PRI-554: preview-pricing rationale (approved copy, Matt 2026-08-07 —
    // incl. confirmed credit-value policy).
    q: 'Why is a preview product paid, and why is pricing labeled "preview"?',
    a: 'You\u2019re paying for what delivers value today: a metered per-frame price well below LLM-based video analysis, native streaming ingestion, and low-latency answers. "Preview" on the price means the rate itself is early-access: we set it before having full demand data, and it may change — up or down — as the model matures, demand develops, and processing costs change. Credits you\u2019ve already bought keep their value; rate changes apply to new processing only, and are announced in the changelog before they take effect. The live rate is always at GET /v1/credit-pricing.',
  },
  {
    q: 'Do I need an account or credit card to test it?',
    a: `No. POST https://api.primateintelligence.ai/v1/sandbox returns a free test API key with no email, no card, and no signup — test keys return deterministic fixture results, ideal for CI. Creating an account adds a free grant of ${GRANT_FRAMES_LABEL} — up to 30 hours of continuous monitoring at 1 fps (1 hour at 30 fps) — for real GPU processing, still with no card required.`,
  },
  {
    q: 'Do credits expire?',
    a: `Paid credits never expire. The free ${GRANT_FRAMES_LABEL} signup grant expires after 30 days.`,
  },
  {
    q: 'How is Primate Vision different from Twelve Labs or Google Video Intelligence?',
    a: 'Primate Vision answers plain-English questions about video with a deterministic result: yes, no, or indeterminate, plus a confidence score and timestamped evidence clips — rather than returning label taxonomies or embeddings for you to interpret. Pricing is a single metered rate ($0.0000015 per frame processed) with no subscription tiers, and the API is built agent-first: a free key in one POST, an OpenAPI 3.1 spec, and an MCP server for Claude, Cursor, and other AI agents.',
  },
  {
    q: 'What happens when my balance runs out?',
    a: 'You can buy credits manually ($10 / $25 / $50 / $100 presets or a custom amount) or enable auto-refill, which tops up before your balance drops below 600 seconds ($6). Above $20k/month, Enterprise pricing is custom — contact sales@primateintelligence.ai.',
  },
];

export const DOCS_FAQ: FaqItem[] = [
  {
    q: 'Do I need an account to try the API?',
    a: 'No. POST https://api.primateintelligence.ai/v1/sandbox returns a pv_test_ key with no email, card, or signup, plus a pre-seeded fixture video you can analyze immediately. Test keys return deterministic canned results — perfect for CI.',
  },
  {
    q: 'What does the API actually return?',
    a: 'A structured analysis resource. result.answer is always yes, no, or indeterminate; result.confidence is 0..1; result.clips gives timestamped evidence ({start_s, end_s, confidence}) showing where in the video the answer was found. No free-text hallucinations.',
  },
  {
    q: 'How do I go from a test key to real GPU inference?',
    a: `Sign up for an account (a billing gate, not an integration gate — your code does not change) to get a pv_live_ key and a free credit grant of ${GRANT_FRAMES_LABEL} (up to 30 hours of monitoring at 1 fps), no card required. Live analyses run real GPU inference at $0.0000015 per frame processed.`,
  },
  {
    q: 'Can AI agents use this API directly?',
    a: 'Yes — it is designed for that. Agents can self-serve a key in one POST, read the OpenAPI 3.1 spec at /v1/openapi.json, follow the condensed agent guide at /docs/agents, or connect through the MCP server (@primate-intelligence/mcp) from Claude, Cursor, or any MCP client.',
  },
];

/** Build a schema.org FAQPage object from a list of items. */
export function faqPageLd(items: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}
