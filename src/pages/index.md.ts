import type { APIRoute } from 'astro';
import { homeMd } from '../lib/pageTwins';

export const GET: APIRoute = () =>
  new Response(homeMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
