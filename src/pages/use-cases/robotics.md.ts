import type { APIRoute } from 'astro';
const SITE = 'https://primateintelligence.ai';
export const GET: APIRoute = () => new Response(
  `---\ntitle: "Robotics — Use Case"\ncanonical: ${SITE}/use-cases/robotics\n---\n\n# Robots that understand before they act\n\nScene state for manipulation and navigation — deterministic, low-latency perception on edge compute. One API replaces YOLO, SAM, and custom glue.\n`,
  { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
);
