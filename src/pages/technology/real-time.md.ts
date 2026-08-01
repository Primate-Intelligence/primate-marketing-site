import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "Real-time streaming"
canonical: ${SITE}/technology/real-time
site: Primate Intelligence
---

# Real-time streaming

Primate Vision ingests live video over WebRTC and returns analysis results on a data
channel while the stream is still running. Sustained streaming analysis runs at 11.8 fps
on production hardware, with 45ms p50 per-frame inference.

See also: [Streaming guide](${SITE}/docs/guides/streaming) · [Performance numbers](${SITE}/performance)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
