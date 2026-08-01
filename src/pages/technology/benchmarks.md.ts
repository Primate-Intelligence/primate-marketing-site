import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "Benchmarks"
canonical: ${SITE}/technology/benchmarks
site: Primate Intelligence
---

# Benchmarks

What we measure (action detection, temporal localization, question-answering with timestamps),
against which baselines, and honest failure modes.

Darwin beats V-JEPA 2.1 on SSv2 and EK-100 action benchmarks at a fraction of the training cost.

- [Darwin: Video JEPA model that outperforms SOTA models while running on edge CPU](${SITE}/blog/darwin-video-jepa-benchmarks)
- [Benchmark post — methodology and extended results](${SITE}/blog/benchmark-post)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
