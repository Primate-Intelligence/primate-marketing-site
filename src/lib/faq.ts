/**
 * FAQ copy (PRI-492) — single source of truth for the visible FAQ sections
 * AND their schema.org FAQPage JSON-LD. Rendering both from this module
 * guarantees the JSON-LD matches the visible text exactly (a Google/LLM
 * eligibility requirement for FAQPage markup).
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const PRICING_FAQ: FaqItem[] = [
  {
    q: 'How much does video analysis cost?',
    a: 'The launch rate is $0.01 per video second — $0.60 per minute, $36 per hour. You are billed on source video clock time, independent of frame rate: 10 seconds at 60fps costs the same as 10 seconds at 1fps. Queued time is never charged and failed jobs are not charged.',
  },
  {
    q: 'Do I need an account or credit card to test it?',
    a: 'No. POST https://api.primateintelligence.ai/v1/sandbox returns a free test API key with no email, no card, and no signup — test keys return deterministic fixture results, ideal for CI. Creating an account adds a 6,000-second free grant ($60 face value) for real GPU processing, still with no card required.',
  },
  {
    q: 'Do credits expire?',
    a: 'Paid credits never expire. The free 6,000-second signup grant expires after 30 days.',
  },
  {
    q: 'How is Primate Vision different from Twelve Labs or Google Video Intelligence?',
    a: 'Primate Vision answers plain-English questions about video with a deterministic result: yes, no, or indeterminate, plus a confidence score and timestamped evidence clips — rather than returning label taxonomies or embeddings for you to interpret. Pricing is a single metered rate ($0.01 per video second) with no subscription tiers, and the API is built agent-first: a free key in one POST, an OpenAPI 3.1 spec, and an MCP server for Claude, Cursor, and other AI agents.',
  },
  {
    q: 'Can I ask multiple questions about the same video in one request?',
    a: 'Yes — batch analyses accept up to 10 prompts per request. The first prompt bills the full video duration and each additional prompt is 50% off. Example: a 100-second video with 4 prompts bills 250 seconds (100 + 3 × 50), not 400. The current discount is served live by GET https://api.primateintelligence.ai/v1/credit-pricing.',
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
    a: 'Sign up for an account (a billing gate, not an integration gate — your code does not change) to get a pv_live_ key and a 6,000-second free credit grant, no card required. Live analyses run real GPU inference at $0.01 per video second.',
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
