import type { APIRoute } from 'astro';
const SITE = 'https://primateintelligence.ai';
export const GET: APIRoute = () => new Response(
  `---\ntitle: "Manufacturing — Use Case"\ncanonical: ${SITE}/use-cases/manufacturing\n---\n\n# Process-step verification\n\nConfirm each assembly step happened, in order, with timestamps. Deterministic outputs are auditable and legally defensible.\n`,
  { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
);
