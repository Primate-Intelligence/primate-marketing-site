import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "How JEPA works"
canonical: ${SITE}/technology/how-jepa-works
site: Primate Intelligence
---

# How JEPA works

A joint-embedding predictive architecture (JEPA) is a model that learns by predicting
the representation of a future or masked state — not by reconstructing raw pixels.

Darwin builds an internal representation of a video scene and predicts forward in
representation space, giving semantic understanding without a language model anywhere
in the perception loop. Language only enters at the query layer.

Further reading: [JEPA deep dive](${SITE}/blog/jepa-deep-dive)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
