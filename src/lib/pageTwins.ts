/**
 * Markdown twins for the data-driven marketing pages (/index.md, /pricing.md,
 * /use-cases.md, /team.md, /values.md, /careers.md).
 *
 * These are generated at build time from the SAME data modules that render the
 * HTML pages — never hand-maintained (PRI-502: drift is worse than absence).
 */
import { SLIDES } from '../data/carousel';
import { USE_CASES_HERO, VERTICALS, USE_CASES_CTA } from '../data/useCases';
import { TEAM, TEAM_HERO } from '../data/team';
import { VALUES, VALUES_HERO, VALUES_TEAM } from '../data/values';
import { CAREERS_HERO, LOOK_FOR, OFFER, OPEN_ROLES } from '../data/careers';
import { PRICING_FAQ } from './faq';
import {
  STREAMING_ROWS,
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
# Watch it understand video. Live.

Point Primate Vision at any camera and ask questions in plain language.
Live answers, structured data, and alerts — no training, no labeling.

[Try Primate Vision](${SITE}/) · [Use cases](${SITE}/use-cases) · [Pricing](${SITE}/pricing)

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
file uploads, or live streams. A second is one second of source video clock
time, independent of frame rate.

**Launch rate: $0.01 / video second** ($0.60/min · $36/hr). Reviewed after
benchmark and demand data; Enterprise is custom above $20k/month.

## Free start — try real processing without a card

- Signup grant: 6,000s ($60 face value, expires after 30 days)
- Card grant: +6,000s / +$60 ($0 setup)
- Total face value: $120
- API keys available immediately after account creation

## Self-serve — metered credits for production work

- $0.01 / second ($0.60/min · $36/hr)
- Refill presets: $10 · $25 · $50 · $100 (custom amounts supported)
- Auto-refill before your balance drops below 600s ($6)
- Paid credits never expire

## Enterprise — custom pricing for committed volume

For customers forecasting or committing to more than $20k/month. A nonstop
30-day stream is $25,920/mo self-serve. Rate card: custom. Terms: volume
commit. Support: SLA + dedicated. Contact: sales@primateintelligence.ai

## How metering works

1. **Upload or stream** — We inspect source video duration, not processed frame count.
2. **Reserve seconds** — Uploads reserve upfront. Streams debit elapsed time while live.
3. **Settle ledger** — Every event records job, source, seconds, credit type, and balance.

## Same video, same charge

- 10s at 1fps = 10s
- 10s at 60fps = 10s
- 8m stream = 480s
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

## Streaming analysis (live video over WebRTC)

${specTable(STREAMING_ROWS)}

## Async analysis (upload, then ask)

${specTable(ASYNC_ROWS)}

## Accuracy — published benchmarks

${accuracyTable}

Source: [${ACCURACY_SOURCE.label}](${SITE}${ACCURACY_SOURCE.href}) (${ACCURACY_SOURCE.author}, ${ACCURACY_SOURCE.date}).

## Methodology

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
