import type { APIRoute } from 'astro';
import { performanceMd } from '../lib/pageTwins';

export const GET: APIRoute = () =>
  new Response(performanceMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
