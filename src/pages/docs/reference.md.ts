/**
 * /docs/reference.md — the full API reference as one markdown document,
 * generated from the committed OpenAPI snapshot (same source as the HTML
 * page; PRI-502 twin rule).
 */
import type { APIRoute } from 'astro';
import { referenceMarkdown } from '../../lib/openapiRef';

export const GET: APIRoute = () =>
  new Response(referenceMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
