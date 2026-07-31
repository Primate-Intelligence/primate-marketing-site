---
title: "Primate Vision vs. Gemini (API + Live) (2026): 1fps Stills vs. Native Frame Rate"
slug: "primate-vision-vs-gemini"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-07-31"
readTime: "6 min read"
tags: ["Comparisons", "LLMs"]
status: "published"
excerpt: "Gemini is the strongest general-purpose video model you can rent — and at 1fps it's dramatically cheaper than us. But its live video input is spec-capped at 1fps JPEG stills with 2-minute sessions and a compounding token meter. Here's the honest head-to-head."
---

**TL;DR:** Gemini is the strongest general-purpose video-understanding model you can rent, and at its default 1fps sampling it's dramatically cheaper than us. If you want conversational answers about stored video — summaries, Q&A, world-knowledge reasoning — it's excellent, and we say so. But for *real-time video analysis*, the spec sheet decides: Gemini Live's video input is hard-capped at **1fps JPEG stills**, audio+video sessions last **2 minutes** without context compression, and the meter **re-bills the entire session context on every turn**. Primate Vision watches live video at native frame rates over managed WebRTC (45ms p50 per-frame inference) and returns a **deterministic verdict** — yes / no / indeterminate — with calibrated confidence, timestamps, and an annotated evidence video, on a flat per-second meter.

*A note on keeping Google straight: this post is about **Gemini** — Google's modern multimodal surface. Google Video Intelligence, the 2017-era annotation API, is a different product with different criticisms; we cover it in the [full landscape comparison](/blog/primate-vision-vs-video-ai-landscape-2026). Don't conflate them — we don't.*

---

## Two different jobs

Gemini is a universal brain: video is one input modality among many, decomposed into sampled frames plus audio tokens, answered with generated prose or JSON. Google's own docs describe the capability well — "describe, segment, and extract information from videos, answer questions about video content" ([video understanding docs](https://ai.google.dev/gemini-api/docs/video-understanding)).

Primate Vision is a measurement instrument: it watches video — live (managed WebRTC) or uploaded (up to 2 GiB, direct or URL ingest) — and answers one framed question with a deterministic verdict (`yes` / `no` / `indeterminate`), a calibrated 0–1 confidence score, timestamped evidence segments, and an annotated overlay evidence video. Verdicts are computed by similarity scoring against the video, not sampled from a language model, and you can pin the model version (`darwin-1.3`) so behavior changes only when you choose.

## The head-to-head

| Capability | Primate Vision | Gemini (API + Live) |
|---|---|---|
| Live video input | ✅ managed WebRTC, native frame rate | ⚠️ Live API: "images (JPEG <= 1FPS)" — frame-push stills, WebRTC only via third parties ([Live docs](https://ai.google.dev/gemini-api/docs/live-api)) |
| Live session length | ✅ up to 1 hour per session on top plans; API publishes your cap and warns before cutoff | ⚠️ audio+video capped at 2 minutes without compression; ~10-min connection lifetime ([session docs](https://ai.google.dev/gemini-api/docs/live-api/session-management)) |
| Published latency | ✅ 45ms p50 / 316ms p95, 11.8 fps sustained, 6.6s setup | ❌ none — "low-latency" marketing language only |
| Verdict contract | ✅ deterministic yes/no/indeterminate + calibrated 0–1 confidence | ⚠️ JSON schema possible, but uncalibrated, no indeterminate semantics, nondeterministic LLM sample |
| Reproducibility | ✅ deterministic verdict path, model pinning, deterministic test mode | ❌ `temperature`/`top_p`/`top_k` deprecated on 3.x (2026-07-21) — you can't even pin temperature=0 ([changelog](https://ai.google.dev/gemini-api/docs/changelog)) |
| Evidence artifacts | ✅ annotated overlay evidence video + timestamped clips | ❌ text/JSON/audio out only |
| Fast-action fidelity | ✅ native frame rate | ⚠️ Google's own docs: 1fps "might lose detail… Consider slowing down such clips" ([docs](https://ai.google.dev/gemini-api/docs/video-understanding)) |
| Transcript / OCR / audio | ❌ visual only | ✅ native audio, transcription, OCR |
| Embeddings / search | ❌ none | ✅ multimodal embeddings GA |
| Webhooks | ✅ Standard Webhooks + `Prefer: wait` | ✅ launched 2026-05-04 for Batch + long-running ops |

That last row matters for honesty: earlier analyses called Google "polling-only." That's now wrong for Gemini — they shipped webhooks in May 2026. (It remains true for Google Video Intelligence, the other Google surface.)

## The 1fps wall

This is the crux, and it's Google's spec, not our characterization. The Live API's input modalities are listed as "Audio…, images (JPEG <= 1FPS), text." A person falls in 0.7 seconds. A package is snatched between frames. At one still per second, fast events physically cannot be seen — which is why Google's video docs recommend "slowing down such clips" as the workaround for fast action. That's a fine tip for stored files. It is not available advice for a live camera.

On the file path you can request a higher custom fps — and then the token meter answers. Which brings us to pricing.

## Pricing: flat meter vs. compounding token curve

**Gemini bills tokens.** Each frame is 258 tokens at default resolution; ~300 tokens/second of video all-in. At the 1fps default on Flash-Lite, that's roughly **$0.28 per camera-hour input** (estimate, input-only) — 100×+ cheaper than our metered rate, and we won't pretend otherwise. If 1fps is enough and prose is enough, Gemini is very cheap.

But two curves bend the other way:

1. **Fidelity parity.** At 12fps — what Primate Vision actually sustains — Gemini's *input tokens alone* reach **$0.28–$0.37/min** on frontier models (3.6 Flash / 3.1 Pro): 46–62% of Primate's **all-in $0.60/min**, before output tokens, before thinking tokens, and with no verdict layer, no calibration, and no evidence artifacts on top.
2. **The Live re-billing trap.** Google's own best-practices page: "Past tokens are re-processed and accounted for in each new turn… As a session lengthens, the cost per turn increases because the conversational history is re-processed" ([best practices](https://ai.google.dev/gemini-api/docs/live-api/best-practices)). Interactive live-video sessions get superlinearly expensive and CFO-unpredictable.

**Primate Vision has two lanes**, stated plainly:

1. **Metered — $0.01 per second of source video** ($0.60/min), flat, fps-independent — 10 seconds at 60fps bills as 10 seconds. Queued time free; failed jobs free. A 30-second clip → verdict + confidence + timestamps + evidence video = $0.30.
2. **[Enterprise — contact us](https://primateintelligence.ai/pricing#enterprise)** for 24/7 continuous monitoring and camera fleets: dedicated capacity or on-site deployment at a small fraction of the metered rate, under highly discounted enterprise plans.

Normalized honestly: at 1fps Gemini is ~$0.28–$1.39/camera-hour (estimate, input-only) versus $36/camera-hour† at our metered rate. The metered lane isn't priced for passive camera-hours — it's priced per answered question with evidence. When the workload *is* camera-hours, that's the enterprise lane.

† *Metered rate normalized for comparison. Primate does not sell 24/7 continuous monitoring at the metered rate — continuous and fleet workloads use enterprise plans; [contact us](https://primateintelligence.ai/pricing#enterprise).*

One more production consideration: model churn. Gemini 2.0 was shut down June 2026; preview models are routinely retired on ~30-day notice; the Live model on the developer API is still `-preview` (GA only via Vertex). Every forced migration means re-validating your video pipeline. Primate Vision versions models as pinnable resources — behavior changes when you choose.

## Choose Gemini instead when…

Genuinely — these are its lanes, not ours:

- **Conversational "what am I looking at?" experiences.** Voice assistant over a screen share or camera where prose/audio *is* the product — Shopify's Sidekick is built on Gemini Live via Vertex. We don't do conversation.
- **Low-fps, low-stakes monitoring at massive scale**, where ~$0.30–$1.40/camera-hour beats everything and an occasional miss is tolerable.
- **Rich Q&A and summarization over stored footage** where world knowledge matters more than temporal precision — lectures, meetings, content libraries. And it can hear: transcription and audio understanding we simply don't have.
- **Semantic search over video** via multimodal embeddings (GA) — we offer no embeddings.
- **One-vendor GCP shops** that want LLM + vision + audio + embeddings under Vertex SLAs.

## Choose Primate Vision when…

- **The event is faster than one second.** Native frame rate vs. 1fps stills isn't a tuning difference; it's whether the event is visible at all.
- **The output feeds an alert, a workflow, or a compliance record.** A deterministic verdict with calibrated confidence and a watchable evidence video — versus a nondeterministic prose sample you can no longer even pin to temperature=0.
- **You need sessions longer than 2 minutes** on live audio+video, without context-compression gymnastics and resumption tokens.
- **You need a predictable bill.** Seconds × $0.01, flat — versus a token meter that compounds per turn.
- **Latency is a requirement.** We publish 45ms p50 / 316ms p95 / 11.8 fps / 6.6s setup on a public /performance page. Google publishes no latency numbers for video on either surface.

## Try it

**[Try it for free](https://primateintelligence.ai/signup)** — real processing, no card required to start.

**Your AI agent can do it for you — right from Claude.** Primate Vision ships an MCP server, llms.txt, markdown docs twins, and a sandbox key available in a single POST — your agent can get a key, upload a clip, and read back a verdict without a human touching a dashboard.

For 24/7 monitoring and camera fleets: [see our enterprise plans](https://primateintelligence.ai/pricing#enterprise).

---

*Method note: every Gemini claim traces to ai.google.dev docs, pricing, and changelog pages accessed 2026-07-31. Estimates are labeled. Google's own per-minute price equivalences are internally inconsistent with its documented tokenization (~8× gap) — we quote the documented token math.*
