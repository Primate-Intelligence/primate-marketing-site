import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "About Primate Intelligence"
canonical: ${SITE}/about
site: Primate Intelligence
---

# About Primate Intelligence

Video is the largest untapped data source in the world, and the tools to understand it either
hallucinate (VLMs) or are brittle single-purpose pipelines (YOLO-era CV). We built Darwin, a
JEPA-based perception model that watches video the way a systems engineer needs: deterministic,
timestamped, confidence-scored, queryable in plain English — shipped as an API you can try right
now, free, no signup, even from your AI agent.

Founded by Matt Miesnieks (CEO; previously founded 6D.ai, acquired by Niantic) and Mehdi Nikkhah
(PhD; led CV engineering and research at 6D.ai). Based in San Jose, CA.

- [Team](${SITE}/team)
- [Values](${SITE}/values)
- [Careers](${SITE}/careers)
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
