import type { APIRoute } from 'astro';
import { teamMd } from '../lib/pageTwins';

export const GET: APIRoute = () =>
  new Response(teamMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
