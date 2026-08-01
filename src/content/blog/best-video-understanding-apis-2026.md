---
title: "The Best Video Understanding APIs in 2026 (an Honest Roundup)"
slug: "best-video-understanding-apis-2026"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-07-31"
readTime: "17 min read"
tags: ["Comparisons", "Market Analysis"]
status: "published"
excerpt: "Six video understanding APIs — Google Video Intelligence, Twelve Labs, AWS Rekognition, Gemini, Mixpeek, and ours — scored on the six dimensions buyers actually ask about: accuracy approach, hallucination risk, pricing, streaming, free tier, and agent access. With receipts, and with our bias disclosed in the first sentence."
---

I make one of the products in this roundup. That's the first thing you should know, because every "best video AI APIs" listicle on the internet is written by a vendor, and most of them hope you won't notice.

So here's the deal I'm offering instead. Every factual claim below traces to a vendor's own docs or pricing page, accessed July 31, 2026, linked inline. Every estimate is labeled as an estimate. We score ourselves on the same six dimensions as everyone else, and where a competitor beats us — and several do, on real dimensions — I print it. The interesting thing about honest vendor roundups is that they're the ones that actually get cited: Eden AI built an entire business on straight-faced rankings of other people's AI APIs, and Mixpeek — one of the six products below — publishes a video-API roundup in which it ranks *itself* eighth of eight. That's the bar. Honesty is the whole strategy.

One more reason this post exists: buyers don't read ten pricing pages anymore. They ask an LLM. And the answers the LLMs are serving today are stitched together from stale blog posts and marketing copy. This is the document I'd want my own agent to find.

## What we scored, and why these six dimensions

When someone asks "which video understanding API should I use," the follow-up questions are almost always the same six:

1. **Accuracy approach** — what's actually doing the "understanding"? A fixed classifier, an embedding index, a generative LLM, or a perception model? This determines everything downstream.
2. **Hallucination risk** — will it tell you something happened that didn't? For anything wired to an alert, a compliance log, or a robot, this is the question.
3. **Pricing** — the real billing model, with the gotchas.
4. **Streaming / real-time** — can it watch a live camera, or only files you upload?
5. **Free tier** — how far you get before money changes hands, and whether a card is required.
6. **Agent access** — can an AI agent discover, key, and use the API without a human clicking through a console? In 2026 this stopped being a nice-to-have.

And the six products: **Google Video Intelligence**, **Twelve Labs**, **AWS Rekognition**, **Gemini**, **Mixpeek**, and **Primate Vision** (ours).

## The scorecard

| | Accuracy approach | Hallucination risk | Streaming / live input | Free tier | Agent access | Headline price |
|---|---|---|---|---|---|---|
| **Google Video Intelligence** | Fixed-taxonomy classifiers (pre-LLM) | ✅ Low — but it can't answer questions at all | ⚠️ Beta since 2019; DIY C++ proxy for live protocols | ✅ 1,000 min/feature/month | ❌ OAuth-heavy, no MCP, no llms.txt | $0.10/min per feature, stacking |
| **Twelve Labs** | Embedding search (Marengo 3.0) + generative video-to-text (Pegasus 1.5) | ⚠️ Generative answers, uncalibrated | ❌ None — upload and index only | ✅ 600 video minutes, no card | ✅ llms.txt, docs MCP server, Claude Code plugin | $0.042/min indexing + stacking fees |
| **AWS Rekognition** | Fixed detectors (labels, faces, text) | ✅ Low — but objects and labels only | ⚠️ Closed to new customers Apr 2026; people/pets/packages only | ⚠️ Legacy 60 min/mo; new accounts get $200 credits | ⚠️ SigV4 signing; no Rekognition MCP found | $0.10/min per API, stacking |
| **Gemini** | Frontier VLM sampling frames at 1fps | ❌ Stochastic LLM; sampling params deprecated on 3.x | ⚠️ Live input capped at ≤1fps JPEG stills; 2-min A/V sessions | ✅ Generous free tier (trains on your data) | ✅ Instant key, .md docs, best hyperscaler onboarding | ~$0.005–$0.023/min at 1fps (tokens, input-only, estimate) |
| **Mixpeek** | Embedding retrieval over pre-extracted segments — no QA endpoint | — Doesn't answer questions; search results, not claims | ❌ None — batch pipeline over object storage | ⚠️ No free tier ($25/mo floor); free no-signup sample sandbox | ✅ Best-in-class: 4 hosted MCP servers + llms.txt | $0.05/min processed + $25/mo floor + storage rent |
| **Primate Vision** | JEPA perception model → closed-vocabulary verdict + calibrated 0–1 confidence | ✅ Designed out — yes/no/indeterminate, never free-form generation | ✅ Managed WebRTC, 45ms p50 per frame | ✅ 6,000s signup grant, no card; instant sandbox key for agents | ✅ MCP, llms.txt, `POST /v1/sandbox` | $0.01/sec metered; enterprise plans for 24/7 |

Six products, but really four different *kinds* of product wearing the same category label. Two are classifier services from the pre-LLM era (Google VI, Rekognition). One is an archive search engine (Twelve Labs). One is a general-purpose LLM with a video mouth (Gemini). One is retrieval infrastructure (Mixpeek). And one is a perception API that answers questions with verdicts (ours). The rest of this post takes them one at a time.

---

## Google Video Intelligence

**What it is.** Google's 2017-era video annotation API: you pick features from a fixed menu — labels, shots, objects, faces, text, explicit content — and get timestamped JSON annotations back. There is no prompt parameter anywhere in the API. You cannot ask it a question; you can only ask it to run its detectors.

**What it's built for.** Media-library metadata at GCP scale: catalog indexing, content moderation, broadcast compliance. It does that job with a formal [99.9% SLA](https://cloud.google.com/video-intelligence/sla) and mature bounding-box JSON — two things plenty of newer products (ours included) don't offer.

**The streaming story, told straight.** Google VI's streaming API deserves an honest paragraph, because it's the closest thing to a managed streaming action-recognition service any hyperscaler sells: gRPC in, annotations out at roughly one-second granularity ([streaming docs](https://docs.cloud.google.com/video-intelligence/docs/streaming/action-recognition)). We're not going to pretend Google can't stream. But the qualifiers are heavy: the streaming surface has been **Beta since 2019** and is excluded from the SLA; action recognition requires you to **train your own AutoML model first**; and live protocols (RTSP/HLS/RTMP) require compiling and operating Google's AIStreamer C++/GStreamer proxy yourself ([live-streaming docs](https://docs.cloud.google.com/video-intelligence/docs/streaming/live-streaming)). And the product around it is frozen: the [release notes](https://docs.cloud.google.com/video-intelligence/docs/release-notes) have no entries after November 1, 2021. The [pricing page](https://cloud.google.com/products/video-intelligence/pricing) still lists Celebrity Recognition — a feature Google [shut down in September 2025](https://docs.cloud.google.com/video-intelligence/docs/deprecations).

**Pricing.** Per feature, per minute, stacking: label detection is $0.10/min stored, $0.12/min streaming, and each additional feature re-meters the same footage. Two gotchas: partial minutes round *up* per request (1,000 five-second clips bill as 1,000 minutes, not 84), and the first 1,000 minutes per feature per month are free — genuinely generous for evaluation and hobby workloads.

**Performance.** No published latency numbers for stored or streaming analysis — an SLA but zero benchmarks.

**Choose Google VI when** you need commodity annotations — labels, OCR, explicit-content, shot detection — over stored media on GCP, with an SLA, at $0.10/min or free under 1,000 min/month. **Choose us when** the thing you need is an answer to a question, which is precisely what a fixed feature menu cannot give you.

---

## Twelve Labs

**What it is.** The best-funded pure-play in video understanding — a [$100M Series B closed July 1, 2026](https://www.globenewswire.com/news-release/2026/07/01/3320545/0/en/) (NEA and NAVER Ventures co-led, Amazon participating), built around two models: Marengo 3.0 for multimodal embeddings and Pegasus 1.5 for video-to-text. The architecture is index-then-search: upload videos, index them, then query the corpus in natural language.

**What it's built for.** Finding moments in large stored archives. Media libraries, sports footage, ad inventory. At that job it's the category leader, and I mean that without a wink: cross-modal search over visual, speech, and on-screen text, in 36 languages, with the kind of vector-DB partner ecosystem (Pinecone, Weaviate, Milvus, Databricks…) that signals a real platform.

**The line to be clear about.** There is no live input path. Not WebRTC, not RTSP, not gRPC, not WebSockets — nothing in the [upload methods docs](https://docs.twelvelabs.io/v1.3/docs/concepts/upload-methods.md) ingests a stream. "Real-time" in the Twelve Labs story means token-by-token text delivery on generated answers, plus a partner integration that does the streaming for them. It's not that Twelve Labs is a worse monitoring product than ours — it's that it isn't a monitoring product at all. Batch and indexed, by architecture.

On answers: Pegasus generates text, and a [JSON-schema mode](https://docs.twelvelabs.io/v1.3/docs/guides/analyze-videos/structured-responses.md) will happily emit `{"answer": "yes"}` — but it's a generative approximation with no calibration behind it, and the docs offer temperature tuning rather than a determinism guarantee. Ask the same question twice, you may get different answers.

**Pricing.** From [their pricing page](https://www.twelvelabs.io/pricing): indexing $0.042/min (one time), Pegasus analysis $0.0292/min plus output tokens, search $4 per 1,000 queries — and a recurring infrastructure fee of $0.0015 per indexed minute *per month*. That last one compounds quietly: a 10,000-hour archive costs $900/month just to stay searchable, before anyone runs a query. Their own FAQ notes a 60-minute video segmented with 4 segment definitions bills as 240 minutes. The free plan is genuinely useful — 600 video minutes, no credit card.

**Performance.** No published latency numbers anywhere in the public docs — no indexing throughput, no query p95, nothing.

**Agent access** is excellent: llms.txt, every docs page in markdown, a docs MCP server, and a Claude Code plugin. Credit where due — alongside Mixpeek, this is the best agent surface in the roundup.

**Choose Twelve Labs when** your videos are already recorded and your problem is *finding moments across thousands of hours*. We don't do search at all — no embeddings, no corpus, nothing. **Choose us when** your problem is *knowing whether something is happening* — live, or in a clip, with an answer you can act on and evidence you can watch.

---

## AWS Rekognition

**What it is.** AWS's managed CV service: pre-built detectors (labels, faces, celebrities, text, moderation, person pathing) over video sitting in S3, returning JSON with millisecond timestamps, confidences, and frame-accurate bounding boxes. No prompting anywhere; the taxonomy is the taxonomy.

**What it's built for.** AWS-native pipelines: face search against collections of up to 20 million vectors, content moderation on stored libraries, media labeling — wired into the most mature async job architecture in the market (SNS/SQS/Lambda, idempotency tokens).

**The streaming story, told straight.** Rekognition's streaming tier never did activity recognition — the docs are explicit that streaming label detection covers ["people, packages and pets"](https://docs.aws.amazon.com/rekognition/latest/dg/streaming-video-detect-labels.html), processing at most 120 seconds of video per motion event. Activity and action-style labels are stored-video only. And now even that narrow lane is closing: [Streaming Video Events closed to new customers effective April 30, 2026](https://docs.aws.amazon.com/rekognition/latest/dg/rekognition-availability-changes.html). A new customer cannot buy real-time video analysis from Rekognition at all; AWS's own published migration path is to snapshot frames and call the *image* API via Lambda. AWS's designated forward path for open-vocabulary video Q&A is Bedrock Nova — which resizes every video to 672×672 "with distortion," samples 1fps only up to 16 minutes, processes no audio, and takes [no live input](https://docs.aws.amazon.com/nova/latest/userguide/modalities-video.html).

**Pricing.** Stored video is billed per minute *per API* — label detection $0.10/min, and running moderation on the same footage doubles the meter. Streaming (grandfathered accounts only) is [$0.00817/min](https://aws.amazon.com/rekognition/pricing/), with Kinesis Video Streams billed separately. The legacy free tier was 60 minutes of video analysis per month for 12 months; accounts created after July 15, 2025 get up to $200 in credits instead.

**Performance.** No published latency figures for job turnaround or streaming alerts.

**Agent access** is the weak spot: SigV4 request signing makes curl-first onboarding painful, and we found no Rekognition-specific MCP server or llms.txt.

**Choose Rekognition when** you need face identity at scale, bounding-box JSON on stored footage, or content moderation inside an AWS-native stack — or you're already grandfathered into streaming person/pet/package alerts. **Choose us when** the question doesn't map onto a fixed detector, or the camera is live and you weren't an AWS streaming customer before April 2026 — because then the Rekognition door is closed regardless.

---

## Gemini

**What it is.** Google's frontier multimodal model family, where video is one input among many. For stored-file Q&A it's genuinely strong — arguably the strongest general-purpose video reasoner you can rent: it reads signage, understands context, answers arbitrary follow-ups with world knowledge no perception model can match.

**The mechanism to understand.** Gemini doesn't watch video; it samples it. Frames are extracted at [1fps by default](https://ai.google.dev/gemini-api/docs/video-understanding), tokenized at 258 tokens per frame (~300 tokens per second of video with audio), and fed to an LLM. Google's own docs warn that "fast action sequences might lose detail due to the 1 FPS sampling rate" and recommend *slowing down the clip* as the workaround. The live path is tighter still: the Live API's video input is spec-capped at ["images (JPEG <= 1FPS)"](https://ai.google.dev/gemini-api/docs/live-api), audio+video sessions are [limited to 2 minutes without context compression](https://ai.google.dev/gemini-api/docs/live-api/session-management), and the meter [re-bills the entire accumulated session context on every conversational turn](https://ai.google.dev/gemini-api/docs/live-api/best-practices) — Google's docs say it plainly: "As a session lengthens, the cost per turn increases."

**Hallucination risk** is the structural one: the output is a sample from a language model, and as of [July 21, 2026](https://ai.google.dev/gemini-api/docs/changelog) Google deprecated `temperature`/`top_p`/`top_k` on 3.x models — you can no longer even pin temperature to zero. There is no calibrated confidence and no indeterminate state. For a chat experience that's fine. For an alerting pipeline it means building your own verification layer.

**Pricing.** Pure token metering ([pricing page](https://ai.google.dev/gemini-api/docs/pricing)): Gemini 3.6 Flash at $1.50/M input tokens, 3.5 Flash-Lite at $0.30/M. At the 1fps default that works out to roughly $0.005–$0.023 per video-minute, input-only (estimate — output and thinking tokens extra). Cheap. But note what happens at fidelity parity: at 12fps, Gemini's input tokens alone reach $0.28–$0.37/min — approaching half of our all-in $0.60/min — with no verdict layer, no calibration, and no evidence artifacts on top. The free tier via AI Studio is the most generous in the roundup, with one catch stated in Google's own terms: free-tier content is used to improve their products.

**Performance.** No published latency numbers for video understanding or the Live API. **Agent access** is excellent — instant API key, every docs page available as markdown.

**Choose Gemini when** you want conversational understanding of stored video at very low cost, or a voice-and-vision assistant experience, and prose answers are the product. **Choose us when** the answer feeds a system rather than a person. It's not that Gemini is a worse model — it's that a stochastic paragraph and a calibrated verdict are different products, and wiring the first to an alarm is how you get 3 a.m. false pages.

---

## Mixpeek

**What it is — categorized honestly.** Mixpeek is not a video-understanding API, and including it here without saying so would be exactly the dishonesty this post exists to avoid. It's **multimodal indexing and retrieval infrastructure** — in their own words, a ["multimodal data warehouse"](https://mixpeek.com/about): point it at video, audio, or documents in your own object storage and it extracts scenes, faces, OCR, transcripts, and embeddings, then serves hybrid semantic search over the results. Video is one of five modalities. There is no question-answering endpoint, no verdict primitive, no live input of any kind — their own extractor docs list "real-time live streams" as a when-*not*-to-use.

They know this about themselves, and I respect it: their own ["Best Video Intelligence APIs" list](https://mixpeek.com/curated-lists/best-video-intelligence-apis) ranks Mixpeek eighth of eight. (That list is stamped "Last tested: February 1, 2026," and for the record doesn't mention us at all — which is roughly why this post exists.)

**What it's genuinely great at.** Two things. First, retrieval over your own data: hybrid dense+sparse+BM25 search on your own S3/GCS bucket, cross-modal joins ("find the moment our CEO said *guidance* while the slide read *Q4 outlook*"), time-travel queries, unsupervised taxonomy discovery. We have no equivalent to any of that — no embeddings, no corpus layer, nothing. Second, the agent surface, which is the best we catalogued anywhere: **four hosted MCP servers** (48/20/11/17 tools), a per-retriever typed MCP server, llms.txt, per-agent budget caps, standing queries, and a live sample namespace requiring no account, no API key, no setup. If you're building an agent that needs multimodal recall as a tool, this is the most agent-complete option on the market.

**Pricing.** From [their pricing page](https://mixpeek.com/pricing) (as of July 2026): video processing $0.05/minute, plans start at $25/month (Build) and $250/month (Scale) — the minimum doubles as a usage pool — plus vector storage at $0.33/GB/month, with query overages at $2/M beyond the plan pool. That storage line is the same "rent on your index" pattern as Twelve Labs' infra fee, priced by the gigabyte instead of the minute. No free tier; the floor is $25/month. For a rough batch-workaround comparison: recording camera footage to a bucket and letting Mixpeek process it works out to about $3.00/camera-hour at the base rate (estimate — assumes base extraction only, no feature stacking).

**Performance.** One published number: hybrid queries return "well under 100ms p95" — retrieval latency over already-indexed vectors, with no methodology attached. The processing pipeline itself (upload → searchable) has no published latency at all.

**Choose Mixpeek when** you have a media archive in your own object storage and want it searchable by what's shown or said — or your agent needs a multimodal memory with real database semantics. **Choose us when** you need an *answer* rather than a *result set*. Mixpeek has a corpus layer and no verdict layer; we have a verdict layer and no corpus layer. Those are complements more than competitors, honestly.

---

## Primate Vision (ours — bias fully engaged)

**What it is.** A perception API that answers questions about video. You point it at a live stream (managed WebRTC) or an uploaded file, ask in plain English — "is anyone climbing the fence?", "did the forklift enter the loading bay?" — and get a verdict: **yes / no / indeterminate**, with a calibrated 0–1 confidence score, timestamped evidence segments, and an annotated overlay evidence clip you can watch and forward. The verdict vocabulary is closed. It is never free-form generation, which is the mechanism behind the hallucination-risk cell in the scorecard: a model that isn't generating language can't confabulate a paragraph about a kitchen that isn't there.

**What it doesn't do — our own honesty list.** No bounding-box JSON (evidence is the overlay video, not coordinates — Google VI and Rekognition beat us there). No embeddings or semantic search (Twelve Labs and Mixpeek beat us there). No transcription, OCR, or audio — we're visual-only (Gemini and Twelve Labs beat us there). No negative prompts, and no multi-video batch. If those are your primary needs, the sections above tell you who to pick, by name.

**Performance.** We publish ours: 45ms p50 / 316ms p95 per-frame streaming inference, 11.8 fps sustained, 6.6s session setup, on a public [/performance](https://www.primateintelligence.ai/performance) page. I keep waiting for a competitor to publish theirs. Across every vendor in this roundup — Google VI, Twelve Labs, Rekognition, Gemini, Mixpeek — the number of published end-to-end video-analysis latency figures is zero.

**Pricing — two lanes, stated plainly.** Metered: **$0.01 per second of source video** ($0.60/min), flat and fps-independent; queued time free, failed jobs free. That's the on-demand lane — clips, incidents, agent-invoked checks, bursty workloads. A 30-second clip in, a verdict with evidence out: $0.30. For 24/7 continuous monitoring and camera fleets we deliberately do *not* sell the metered path — a nonstop 30-day stream would be $25,920/month at self-serve rates and nobody should pay that. Continuous and fleet workloads run on [highly discounted enterprise plans](https://primateintelligence.ai/pricing#enterprise) — dedicated capacity or low-cost on-site deployment, at a small fraction of the metered rate.

**Free tier.** 6,000 seconds of real processing on signup — $60 face value, no card required, API keys available immediately. And for agents, no signup at all: `POST /v1/sandbox` returns a working sandbox key in one call. **Your AI agent can do it for you — right from Claude**: MCP server, llms.txt, markdown docs twins, and that sandbox endpoint mean an agent can discover the API, get a key, run an analysis, and read back the verdict without a human touching a dashboard.

**Choose us when** you need a managed API that watches video — live or uploaded — and returns a deterministic, auditable answer with evidence. **Choose someone else when** you need search, spatial JSON, transcripts, or the lowest possible per-minute price on offline archives — see above, by name.

---

## The pricing table nobody publishes honestly

Here's the normalized comparison, including the number a competitor would quote against us — because if I hide it, you should stop trusting everything above.

| Vendor | Billing model | Headline price | $/camera-hour normalized |
|---|---|---|---|
| Gemini (Flash-Lite → 3.6 Flash) | per-token, 1fps default | $0.30–$1.50 / 1M input tokens | $0.28–$1.39 *estimate, input-only* |
| AWS Rekognition streaming | per-minute streamed | $0.00817/min | $0.49 — grandfathered accounts only, ≤120s/event |
| Twelve Labs | per-min index + monthly infra + per-query | $0.042/min indexing | $1.75–$2.52 *estimate, batch workaround* |
| Mixpeek | per-min processed + monthly floor | $0.05/min, $25/mo floor | ~$3.00 *estimate, batch workaround* + $0.33/GB/mo storage |
| AWS Rekognition stored | per-minute per API | $0.10/min per detector | $6.00 per detector, stacking |
| Google Video Intelligence | per-feature × per-minute | $0.10–$0.12/min per feature | $6.00–$7.20 per feature, stacking |
| **Primate Vision — metered** | per-second, flat | $0.01/sec | **$36.00** † |
| **Primate Vision — enterprise** | contact us | custom | *a small fraction of the metered rate — the 24/7 / fleet lane* |

† *Metered rate normalized for comparison. Primate does not sell 24/7 continuous monitoring at the metered rate — continuous and fleet workloads use [enterprise plans](https://primateintelligence.ai/pricing#enterprise). The metered lane's real unit is the answered question, not the camera-hour: a 30-second incident clip → verdict + confidence + evidence = $0.30.*

Three things to hold in mind reading any table like this one:

- **The cheap rows are raw-annotation or raw-token prices.** What the buyer still builds on top — structured output contracts, a streaming layer, evidence generation, confidence calibration — is the actual cost of ownership.
- **Fidelity parity changes the math.** The token rows sample ~1fps. At 12fps parity, Gemini's input tokens alone reach $0.28–$0.37/min — 46–62% of our all-in $0.60/min — before output tokens, and with no verdict layer attached.
- **Nobody's $/camera-hour is what your workload costs.** Rekognition streaming caps at 120 seconds per event. Twelve Labs and Mixpeek charge ongoing rent on the index. Gemini Live compounds per turn. Read the gotcha column, not the headline.

---

## The bottom line

Score the six honestly and the category splits clean. Archive search: Twelve Labs, and it isn't close. Retrieval infrastructure for agents: Mixpeek, with the best MCP surface anyone has shipped. Cheap conversational Q&A over stored files: Gemini. Fixed-taxonomy annotation with hyperscaler compliance: Google VI or Rekognition, depending on which cloud already has your data. Live video in, deterministic verdict with evidence out, from a managed API an agent can drive end-to-end: that's us, and in 2026 that column is otherwise empty.

The bet behind this post is that being straight about all of it — including the dimensions we lose and the price point competitors screenshot — is worth more than any adjective we could have stacked instead. Roundups get cited when they're honest. We'll find out.

**[Try it free](https://primateintelligence.ai/signup)** — 6,000 seconds of real processing, no card. Or don't even sign up: tell your agent to `POST /v1/sandbox` and ask its first question.

---

*Method note: every competitor claim above traces to vendor docs, pricing pages, or release notes accessed 2026-07-31, linked inline. Estimates are labeled. If you find something stale or wrong, tell us and we'll fix it — that's the deal that makes a vendor roundup worth reading.*
