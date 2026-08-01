import type { APIRoute } from 'astro';
const SITE = 'https://primateintelligence.ai';
export const GET: APIRoute = () => new Response(
  `---\ntitle: "Drones — Use Case"\ncanonical: ${SITE}/use-cases/drones\n---\n\n# Understood, not just recorded\n\nSurvey and inspection event detection over long flights. Timestamped events instead of hours of footage review. Edge-capable for onboard inference.\n`,
  { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } }
);
