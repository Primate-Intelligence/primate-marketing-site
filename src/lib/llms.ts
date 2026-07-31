/**
 * llms.txt / llms-full.txt generators (PRI-504).
 *
 * Both are built from the docs corpus + blog collection — the same sources
 * that render the HTML pages — so they can never drift from the site.
 *
 * Docs URLs point at the www host (Matt 2026-07-29: docs consolidate on
 * www.primateintelligence.ai/docs). The www domain is attached to this
 * project at the P4 flip (PRI-505); until then the canonical llms.txt in
 * production remains the SPA-served one at the apex.
 *
 * agents.md / changelog.md content in llms-full.txt comes from the committed
 * snapshots in src/snapshots/ (drift vs the API-canonical copies fails CI via
 * scripts/check-spec-drift.mjs — staleness is loud, not silent).
 */
import { getDocsPages, docMarkdownTwin, API } from './docsCorpus';
import { referenceMarkdown } from './openapiRef';
import { getPublishedPosts, toMarkdownTwin } from './blog';

/** Host where the docs canonically live after the P4 flip. */
export const DOCS_HOST = 'https://www.primateintelligence.ai';
/** Host for the marketing pages (P1 canonical; reconciled with www at P4). */
const SITE = 'https://primateintelligence.ai';

export async function llmsTxt(): Promise<string> {
  const pages = await getDocsPages();
  const posts = await getPublishedPosts();

  const docLines = pages
    .map((p) => `- [${p.title}](${DOCS_HOST}/docs/${p.slug}.md): ${p.description}`)
    .join('\n');

  const postLines = posts
    .slice(0, 4)
    .map((p) => `- [${p.data.title}](${SITE}/blog/${p.data.slug}): ${p.data.excerpt}`)
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
- [Team](${SITE}/team): Founders — markdown twin at /team.md
- [Values](${SITE}/values): Seven principles — markdown twin at /values.md
- [Careers](${SITE}/careers): Open roles — markdown twin at /careers.md

## Learn

- [Blog](${SITE}/blog): Research notes and perspectives — RSS at /rss.xml
- Every blog post has a markdown twin: append .md to the post URL (e.g. /blog/how-jepa-works.md)
${postLines}

## Legal

- [Privacy Policy](${SITE}/privacy)
- [Terms of Service](${SITE}/terms)
- [Cookie Policy](${SITE}/cookie-policy)
`;
}

export async function llmsFullTxt(): Promise<string> {
  const pages = await getDocsPages();
  const posts = await getPublishedPosts();

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
  return segments.join('\n');
}
