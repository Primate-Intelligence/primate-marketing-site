/**
 * Markdown twins for the data-driven marketing pages (/index.md, /pricing.md,
 * /use-cases.md, /team.md, /values.md, /careers.md).
 *
 * These are generated at build time from the SAME data modules that render the
 * HTML pages — never hand-maintained (PRI-502: drift is worse than absence).
 */
import { SLIDES } from '../data/carousel';
import {
  GRANT_EQUIVALENCE_ROWS,
  GRANT_FRAMES_LABEL,
  PRICE_PER_FRAME_USD_LABEL,
  PER_FRAME_30FPS_PER_HOUR_LABEL,
  PAID_RATE_EQUIVALENCE_ROWS,
  PREVIEW_PRICING_EYEBROW,
  PREVIEW_PRICING_FOOTNOTE,
} from './pricingCopy';
import { USE_CASES_HERO, VERTICALS, USE_CASES_CTA } from '../data/useCases';
import { TEAM, TEAM_HERO } from '../data/team';
import { VALUES, VALUES_HERO, VALUES_TEAM } from '../data/values';
import { CAREERS_HERO, LOOK_FOR, OFFER, OPEN_ROLES } from '../data/careers';
import { PRICING_FAQ } from './faq';
import {
  STREAMING_ROWS,
  FLEET_ROWS,
  FLEET_WINDOW,
  ASYNC_ROWS,
  ACCURACY_ROWS,
  ACCURACY_SOURCE,
  METHODOLOGY,
  MEASURED_AT,
  PERFORMANCE_FAQ,
} from '../data/performance';

const SITE = 'https://primateintelligence.ai';

function header(title: string, path: string): string {
  return `---\ntitle: "${title}"\ncanonical: ${SITE}${path}\nsite: Primate Intelligence\n---\n`;
}

export function homeMd(): string {
  const slides = SLIDES.map((s) => {
    const eyebrow = s.eyebrow ? `**${s.eyebrow}** — ` : '';
    const cta = s.cta ? ` [${s.cta.label.replace(' →', '')}](${SITE}${s.cta.href})` : '';
    return `- ${eyebrow}${s.heading} ${s.body}${cta}`;
  }).join('\n');
  return `${header('Real-time video intelligence', '/')}
# Darwin is our JEPA video model. He recognizes Actions & Objects in real-time video.

JEPA models learn actions directly from video sequences. Unlike LLM based models which
understand video by guessing actions from the text labels of single frames. JEPA can't
hallucinate & results are deterministic. Primate's JEPA is orders of magnitude more
efficient than LLMs. $0.0000015/frame — about 16¢ per camera hour at 30fps.

[Try Primate Vision](${SITE}/) · [Use your Agent](${SITE}/agents) · [Benchmarks](${SITE}/technology/benchmarks) · [Why JEPA](${SITE}/technology/how-jepa-works) · [Pricing](${SITE}/pricing)

## For developers — first answer in one minute, no signup

\`\`\`bash
# Get a key — no email, no card
curl -s -X POST https://api.primateintelligence.ai/v1/sandbox

# Ask a question about video
curl -s -X POST https://api.primateintelligence.ai/v1/analyses \\
  -H "Authorization: Bearer $PRIMATE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Prefer: wait=60" \\
  -d '{"video_id": "video_…", "prompt": "Is there a person in this video?"}'
\`\`\`

Docs: ${SITE}/docs · OpenAPI: https://api.primateintelligence.ai/v1/openapi.json

## Platform

${slides}
`;
}

export function pricingMd(): string {
  return `${header('Pricing', '/pricing')}
# One balance for every video workflow.

Buy video processing credits once. Use them through the web app, API, agents,
file uploads, or live streams. You pay per frame actually processed — the
slower your capture rate, the less you pay for the same coverage.

**${PREVIEW_PRICING_EYEBROW}: ${PRICE_PER_FRAME_USD_LABEL} / frame processed** (≈${PER_FRAME_30FPS_PER_HOUR_LABEL} per
hour of 30 fps video). ${PREVIEW_PRICING_FOOTNOTE}
Live rate always at GET /v1/credit-pricing. Enterprise is custom.

## Free start — up to 30 hours of continuous monitoring free

- Signup grant: ${GRANT_FRAMES_LABEL} — a fixed frame budget (expires after 30 days)
- The slower your capture rate, the longer it lasts:
${GRANT_EQUIVALENCE_ROWS.map((r) => `  - ${r.label} → ${r.duration}`).join('\n')}
- API keys available immediately after account creation, no card required

## Self-serve — metered credits for production work

- ${PRICE_PER_FRAME_USD_LABEL} / frame processed — replacing our per-second model
${PAID_RATE_EQUIVALENCE_ROWS.map((r) => `- ${r.label} → ${r.cost}`).join('\n')}
- Refill presets: $10 · $25 · $50 · $100 (custom amounts supported)
- Auto-refill when your balance runs low
- Paid credits never expire

## Enterprise — custom pricing for committed volume

For 24/7 monitoring and camera fleets: dedicated capacity, volume terms, and
SLAs at committed-use rates. Rate card: custom. Terms: volume commit.
Support: SLA + dedicated. Contact: sales@primateintelligence.ai

## How metering works

1. **Upload or stream** — We count the frames actually processed; your capture rate sets your cost.
2. **Reserve credits** — Uploads reserve upfront. Streams reserve while live and reconcile at end.
3. **Settle ledger** — Every event records job, source, frames, credit type, and balance — the API reports which rule billed it (metering_rule).

## Fewer frames, smaller bill

- 1 hour @ 30 fps ≈ 16¢
- 1 hour @ 1 fps ≈ 0.5¢
- You choose the capture rate
- No queued-time charge
- Failed jobs not charged

## Frequently asked questions

${PRICING_FAQ.map((item) => `### ${item.q}\n\n${item.a}`).join('\n\n')}
`;
}

export function useCasesMd(): string {
  const sections = VERTICALS.map(
    (v) => `## ${v.badge} — ${v.headline}

Status: ${v.statusLabel}

${v.description}

**Key benefit:** ${v.keyBenefit}`,
  ).join('\n\n');
  return `${header('Use Cases', '/use-cases')}
# ${USE_CASES_HERO.heading}

${USE_CASES_HERO.lede}

${USE_CASES_HERO.note}

${sections}

---

${USE_CASES_CTA.heading} ${USE_CASES_CTA.body}
Try it: ${SITE}/ · Talk to us: ${USE_CASES_CTA.secondary.href}
`;
}

export function teamMd(): string {
  const members = TEAM.map(
    (p) => `## ${p.name} — ${p.title}

${p.bio.join('\n\n')}

LinkedIn: ${p.linkedin}`,
  ).join('\n\n');
  return `${header('Team', '/team')}
# ${TEAM_HERO.heading}

${members}
`;
}

export function valuesMd(): string {
  const values = VALUES.map((v) => `## ${v.name}\n\n${v.body}`).join('\n\n');
  const team = VALUES_TEAM.members
    .map((m) => `- **${m.name}** (${m.title}) — ${m.blurb}`)
    .join('\n');
  return `${header('Our Values', '/values')}
# ${VALUES_HERO.heading}

${VALUES_HERO.lede}

— ${VALUES_HERO.attribution}

${values}

## ${VALUES_TEAM.heading}

${team}
`;
}

export function performanceMd(): string {
  const specTable = (rows: typeof STREAMING_ROWS) =>
    [
      '| Metric | p50 | p95 | Samples | Notes |',
      '|---|---|---|---|---|',
      ...rows.map((r) => `| ${r.metric} | ${r.p50} | ${r.p95} | ${r.n} | ${r.notes} |`),
    ].join('\n');
  const accuracyTable = [
    '| Benchmark | Result | Protocol |',
    '|---|---|---|',
    ...ACCURACY_ROWS.map((r) => `| ${r.benchmark} | ${r.result} | ${r.protocol} |`),
  ].join('\n');
  const faq = PERFORMANCE_FAQ.map((f) => `### ${f.q}\n\n${f.a}`).join('\n\n');
  return `${header('Performance & latency', '/performance')}
# Performance & latency

Measured on the live production API (api.primateintelligence.ai), ${MEASURED_AT}. Repeatable with a free key: \`POST https://api.primateintelligence.ai/v1/sandbox\` (no signup).

## How fast is streaming analysis (live video over WebRTC)?

${specTable(STREAMING_ROWS)}

## What do real production sessions see?

Server-side fleet telemetry from every customer streaming session, ${FLEET_WINDOW} — not a synthetic benchmark.

${specTable(FLEET_ROWS)}

## How long does an async analysis take (upload, then ask)?

${specTable(ASYNC_ROWS)}

## How accurate is the model? (published benchmarks)

${accuracyTable}

Source: [${ACCURACY_SOURCE.label}](${SITE}${ACCURACY_SOURCE.href}) (${ACCURACY_SOURCE.author}, ${ACCURACY_SOURCE.date}).

## How were these numbers measured?

${METHODOLOGY.map((m) => `- ${m}`).join('\n')}

## FAQ

${faq}
`;
}

export function careersMd(): string {
  return `${header('Careers', '/careers')}
# ${CAREERS_HERO.heading}

${CAREERS_HERO.lede}

## What we look for

${LOOK_FOR.map((i) => `- ${i}`).join('\n')}

## What we offer

${OFFER.map((i) => `- ${i}`).join('\n')}

## Open roles (${OPEN_ROLES.count})

${OPEN_ROLES.emptyTitle}. ${OPEN_ROLES.emptyBody}

Contact: ${OPEN_ROLES.email}
`;
}
