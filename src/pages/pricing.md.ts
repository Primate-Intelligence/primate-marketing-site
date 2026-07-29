import type { APIRoute } from 'astro';
import { pricingMd } from '../lib/pageTwins';

export const GET: APIRoute = () =>
  new Response(pricingMd(), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
