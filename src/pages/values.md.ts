import type { APIRoute } from 'astro';
import { valuesMd } from '../lib/pageTwins';

export const GET: APIRoute = () =>
  new Response(valuesMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
