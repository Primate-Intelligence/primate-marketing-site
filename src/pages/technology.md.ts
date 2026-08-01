import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "Technology"
canonical: ${SITE}/technology
site: Primate Intelligence
---

# World models, not video models

Primate Intelligence builds Darwin, a JEPA-based predictive world model for video.

Generative video models learn to render pixels; world models learn what happens next
and why — the actual substrate of understanding. Prediction in representation space
(not pixel space) is what makes Darwin fast, deterministic, and deployable at the edge.

## Technology deep-dives

- [How JEPA works](${SITE}/technology/how-jepa-works): Joint-embedding predictive architecture — semantic understanding without a language model in the perception loop.
- [Determinism](${SITE}/technology/determinism): Same input, same output, every time — why repeatability is the defining property for production video systems.
- [Benchmarks](${SITE}/technology/benchmarks): What we measure, against which baselines, and honest failure modes.
- [Real-time streaming](${SITE}/technology/real-time): WebRTC ingestion, per-GPU stream backends, and what "real-time" actually costs.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
