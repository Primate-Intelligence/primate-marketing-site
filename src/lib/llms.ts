/**
 * llms.txt / llms-full.txt generators (PRI-504; updated for menu-IA restructure).
 *
 * Both are built from the docs corpus + blog collection + compare collection — the same
 * sources that render the HTML pages — so they can never drift from the site.
 *
 * agents.md / changelog.md content in llms-full.txt comes from the committed
 * snapshots in src/snapshots/ (drift vs the API-canonical copies fails CI via
 * scripts/check-spec-drift.mjs — staleness is loud, not silent).
 */
import { getDocsPages, docMarkdownTwin, API } from './docsCorpus';
import { referenceMarkdown } from './openapiRef';
import { getPublishedPosts, toMarkdownTwin } from './blog';
import { getCompareEntries, toMarkdownTwin as compareMarkdownTwin } from './compare';

/** Host where the docs canonically live after the P4 flip. */
export const DOCS_HOST = 'https://www.primateintelligence.ai';
/** Host for the marketing pages (P1 canonical; reconciled with www at P4). */
const SITE = 'https://primateintelligence.ai';

export async function llmsTxt(): Promise<string> {
  const pages = await getDocsPages();
  const posts = await getPublishedPosts();
  const comparePosts = await getCompareEntries();

  const docLines = pages
    .map((p) => `- [${p.title}](${DOCS_HOST}/docs/${p.slug}.md): ${p.description}`)
    .join('\n');

  const postLines = posts
    .slice(0, 4)
    .map((p) => `- [${p.data.title}](${SITE}/blog/${p.data.slug}): ${p.data.excerpt}`)
    .join('\n');

  const compareLines = comparePosts
    .slice(0, 3)
    .map((p) => `- [${p.data.title}](${SITE}/compare/${p.data.slug}): ${p.data.excerpt}`)
    .join('\n');

  return `# Primate Vision API — Primate Intelligence

> Video scene understanding API. Upload a video (or point at a URL), ask a question in plain English, get a deterministic answer with confidence and clip timestamps — no hallucinations. Zero-touch provisioning: \`POST ${API}/v1/sandbox\` returns an instant free test key (no email, no card).

Start here (agents): [Quickstart for AI agents](${DOCS_HOST}/docs/agents.md)

## Machine-readable surfaces

- [OpenAPI 3.1 spec](${API}/v1/openapi.json): the full API contract — source of truth
- [Error registry](${API}/v1/errors): every error code with retryable/idem flags
- [Test fixture](${API}/v1/test-fixture): stable video + prompt + expected answer for CI self-verification
- [Credit pricing](${API}/v1/credit-pricing): current pricing, public

## Integration contract

- Base URL: \`${API}\` · Auth: \`Authorization: Bearer $PRIMATE_API_KEY\`
- Env var: \`PRIMATE_API_KEY\` (both SDKs + MCP server read it; keys never go in URLs or tool arguments)
- Core loop: \`POST /v1/videos\` → \`POST /v1/analyses\` → \`GET /v1/analyses/{id}\` (or \`Prefer: wait=60\` to collapse the poll)
- SDKs: \`npm install @primate-intelligence/sdk\` · \`pip install primate-intelligence\`
- MCP server: \`npx @primate-intelligence/mcp\` (env: PRIMATE_API_KEY)

## Docs

${docLines}
- [API reference](${DOCS_HOST}/docs/reference.md): Every endpoint and schema, generated from the OpenAPI 3.1 contract.

## Full corpus

- [llms-full.txt](${DOCS_HOST}/llms-full.txt): every docs page in one file

## Product pages

- [Home](${SITE}/): Product overview — markdown twin at /index.md
- [Pricing](${SITE}/pricing): $0.01/video-second metered credits — markdown twin at /pricing.md
- [Performance & latency](${SITE}/performance): Measured production p50/p95 latency, throughput, and accuracy benchmarks — markdown twin at /performance.md
- [Use Cases](${SITE}/use-cases): Eight markets, one model — markdown twin at /use-cases.md
- [For AI agents](${SITE}/agents): Zero-touch integration for AI agents — markdown twin at /agents-page.md
- [Technology](${SITE}/technology): How Darwin (JEPA world model) works — markdown twin at /technology.md
- [Technology — How JEPA works](${SITE}/technology/how-jepa-works): Joint-embedding predictive architecture explained
- [Technology — Determinism](${SITE}/technology/determinism): Why same-input → same-output matters for production
- [Technology — Benchmarks](${SITE}/technology/benchmarks): Action detection, temporal localization, published results
- [Technology — Real-time streaming](${SITE}/technology/real-time): WebRTC ingestion and streaming architecture
- [Team](${SITE}/team): Founders — markdown twin at /team.md
- [About](${SITE}/about): Mission, founders, founding story — markdown twin at /about.md
- [Values](${SITE}/values): Seven principles — markdown twin at /values.md
- [Careers](${SITE}/careers): Open roles — markdown twin at /careers.md
- [FAQ](${SITE}/faq): Frequently asked questions — markdown twin at /faq.md

## Compare

Honest, spec-table-driven comparisons of Primate Vision against every major video understanding API.
Each comparison has a markdown twin: append .md to the compare URL (e.g. /compare/twelve-labs.md).

- [Compare hub](${SITE}/compare): All comparisons — markdown twin at /compare.md
${compareLines}

## Learn

- [Blog](${SITE}/blog): Research notes and perspectives — RSS at /rss.xml
- Every blog post has a markdown twin: append .md to the post URL (e.g. /blog/jepa-deep-dive.md)
${postLines}
- [Technology](${SITE}/technology): Model releases and capability updates
- [Darwin-preview-1.3B](${SITE}/technology/darwin-preview): The Darwin-preview-1.3B model — full supported-actions vocabulary (532 classes) — markdown twin at /technology/darwin-preview.md

## Legal

- [Privacy Policy](${SITE}/privacy)
- [Terms of Service](${SITE}/terms)
- [Cookie Policy](${SITE}/cookie-policy)
`;
}

export async function llmsFullTxt(): Promise<string> {
  const pages = await getDocsPages();
  const posts = await getPublishedPosts();
  const comparePosts = await getCompareEntries();

  const segments: string[] = [
    `# Primate Vision API — full docs corpus (llms-full.txt)

> Every docs page in one file. Canonical per-page markdown lives at ${DOCS_HOST}/docs/<slug>.md. The OpenAPI 3.1 contract is the source of truth: ${API}/v1/openapi.json
`,
  ];

  for (const p of pages) {
    segments.push(
      `\n---\n\n<!-- source: ${DOCS_HOST}/docs/${p.slug}.md -->\n\n${docMarkdownTwin(p)}`,
    );
  }
  segments.push(
    `\n---\n\n<!-- source: ${DOCS_HOST}/docs/reference.md -->\n\n${referenceMarkdown()}`,
  );
  for (const post of posts) {
    segments.push(
      `\n---\n\n<!-- source: ${SITE}/blog/${post.data.slug}.md -->\n\n${toMarkdownTwin(post)}`,
    );
  }
  for (const post of comparePosts) {
    segments.push(
      `\n---\n\n<!-- source: ${SITE}/compare/${post.data.slug}.md -->\n\n${compareMarkdownTwin(post)}`,
    );
  }
  return segments.join('\n');
}
