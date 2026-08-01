import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "Determinism"
canonical: ${SITE}/technology/determinism
site: Primate Intelligence
---

# Determinism

Everyone benchmarks accuracy; nobody benchmarks whether a model gives the same answer twice.

For production video systems — safety, compliance, robotics — a 92%-accurate nondeterministic
model is unshippable, while a deterministic model with known failure modes is an engineering
component. Darwin's perception runs in embedding space with calibrated confidence scores;
language enters only at the query layer, never the perception layer — so outputs are repeatable.

Related: [The case for deterministic video AI](${SITE}/blog/determinism-post)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
