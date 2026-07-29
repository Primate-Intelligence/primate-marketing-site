/**
 * /llms.txt — agent discovery index, generated at build time from the docs
 * corpus + blog collection (PRI-504; replaces the P1 static stub).
 */
import type { APIRoute } from 'astro';
import { llmsTxt } from '../lib/llms';

export const GET: APIRoute = async () =>
  new Response(await llmsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
