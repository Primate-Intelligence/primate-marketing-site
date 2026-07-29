import type { APIRoute } from 'astro';
import { careersMd } from '../lib/pageTwins';

export const GET: APIRoute = () =>
  new Response(careersMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
