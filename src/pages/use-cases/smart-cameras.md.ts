import type { APIRoute } from 'astro';
const SITE = 'https://primateintelligence.ai';
export const GET: APIRoute = () => new Response(
  `---\ntitle: "Smart Cameras — Use Case"\ncanonical: ${SITE}/use-cases/smart-cameras\n---\n\n# Loitering detection that actually works\n\nPlain-English rules instead of retraining detectors. Darwin identifies actions and behaviors, not just objects, and delivers deterministic verdicts with timestamped evidence.\n`,
  { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
);
