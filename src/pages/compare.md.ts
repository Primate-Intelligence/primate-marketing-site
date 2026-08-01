/**
 * Markdown twin for the compare hub: /compare.md
 */
import type { APIRoute } from 'astro';
import { getCompareEntries } from '../lib/compare';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = async () => {
  const posts = await getCompareEntries();
  const lines = posts
    .map((p) => `- [${p.data.title}](${SITE}/compare/${p.data.slug}): ${p.data.excerpt}`)
    .join('\n');

  const body = `---
title: "Compare"
canonical: ${SITE}/compare
site: Primate Intelligence
---

# How Primate Vision compares

Honest, spec-table-driven comparisons against every major video understanding API.
Every claim links to vendor docs. Failure modes printed where they exist.

## Comparison pages

${lines}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
