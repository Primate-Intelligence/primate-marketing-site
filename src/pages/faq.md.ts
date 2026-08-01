import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "FAQ"
canonical: ${SITE}/faq
site: Primate Intelligence
---

# Frequently asked questions

## What is Primate Vision?

Primate Vision is a real-time video intelligence API. Upload a video or point at a live stream,
ask a question in plain English, get a deterministic verdict with confidence score and timestamped
evidence.

## How is Primate Vision different from a VLM like GPT-4o or Gemini?

VLMs sample frames and generate stochastic text. Primate Vision uses Darwin, a JEPA world model
that predicts in representation space — language only enters at the query layer. Output is
deterministic: same video, same prompt, same verdict.

## What does "deterministic" mean here, and why does it matter?

Same video, same prompt → same verdict, same confidence score, same timestamps. Every time.
Required for auditable production systems (security, compliance, robotics).

## What is JEPA, or a "world model"?

A Joint-Embedding Predictive Architecture learns by predicting future representations, not pixels.
Darwin builds a semantic model of video scenes and predicts forward in representation space.
See ${SITE}/technology/how-jepa-works.

## Can I try it for free?

Yes. Signup grant: 6,000s ($60 face value, 30-day expiry). Add a card: +6,000s ($0 setup).
AI agents: POST https://api.primateintelligence.ai/v1/sandbox — no signup, instant key.

## Can my AI agent use Primate Vision without my involvement?

Yes. POST /v1/sandbox for a free key, discover via /llms.txt and /agents.md, run analysis,
return results. Human only enters loop for paid credits.

## Does it work on live streams, or only uploaded video?

Both. WebRTC live-stream ingestion and file uploads up to 2 GiB. See ${SITE}/technology/real-time.

## What about 24/7 continuous monitoring pricing?

Not the $0.01/s rate — that's for metered use. Continuous deployments run on enterprise plans.
Contact sales@primateintelligence.ai.

## What happens to my video data?

Processed to produce analysis results, not used for model training. See ${SITE}/privacy.

## Where can I read the API docs?

${SITE}/docs · Reference: ${SITE}/docs/reference · OpenAPI: https://api.primateintelligence.ai/v1/openapi.json
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
