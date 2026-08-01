import type { APIRoute } from 'astro';
const SITE = 'https://primateintelligence.ai';
export const GET: APIRoute = () => new Response(
  `---\ntitle: "Retail — Use Case"\ncanonical: ${SITE}/use-cases/retail\n---\n\n# Queue analytics and shelf monitoring in plain English\n\nNo per-store model training. Ask in plain English, get deterministic structured outputs. Works across store layouts and camera configurations.\n`,
  { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
);
