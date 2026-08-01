/**
 * Markdown twin for /agents — /agents-page.md
 * Note: /agents.md is already reserved by vercel.json (rewrite to the API docs agents.md).
 * This twin serves at /agents-page.md to avoid conflict.
 */
import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';
const API = 'https://api.primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "Built for AI agents"
canonical: ${SITE}/agents
site: Primate Intelligence
---

# Built for AI agents

Primate Vision is the first video understanding API an AI agent can integrate end-to-end
with zero human touch. The agent mints its own sandbox key, discovers the API via
machine-readable surfaces, runs an analysis, and returns results. A human only enters
the loop when money is owed.

## Get a key — no email, no card

\`\`\`bash
curl -X POST ${API}/v1/sandbox
\`\`\`

## Discovery surfaces

- [/llms.txt](${SITE}/llms.txt): agent-readable index of the entire API and every product page
- [/llms-full.txt](${SITE}/llms-full.txt): full docs corpus in one file
- [/agents.md](${SITE}/agents.md): agent quickstart guide with copy-paste curl commands
- Markdown twins: append .md to any URL (e.g. /pricing.md, /compare/twelve-labs.md)
- [MCP server on Smithery](https://smithery.ai/servers/matt-uwba/primate-intelligence)

## Docs

${SITE}/docs · OpenAPI: ${API}/v1/openapi.json
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
