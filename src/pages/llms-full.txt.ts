/**
 * /llms-full.txt — the entire docs corpus (guides + error registry + API
 * reference + agents/changelog snapshots + blog posts) in one file (PRI-504).
 *
 * Static build artifact (deterministic). The agents/changelog segments come
 * from committed snapshots; drift vs the API-canonical copies fails CI
 * (scripts/check-spec-drift.mjs), so staleness is a loud reviewed event —
 * this replaces the SPA's serve-time composition function.
 */
import type { APIRoute } from 'astro';
import { llmsFullTxt } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(await llmsFullTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
