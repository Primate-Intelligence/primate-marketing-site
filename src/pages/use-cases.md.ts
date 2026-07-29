import type { APIRoute } from 'astro';
import { useCasesMd } from '../lib/pageTwins';

export const GET: APIRoute = () =>
  new Response(useCasesMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
