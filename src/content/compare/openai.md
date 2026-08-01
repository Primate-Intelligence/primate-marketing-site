---
title: "Primate Vision vs. OpenAI (2026): A Video API vs. a Frame-Extraction Workaround"
slug: "openai"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-07-31"
readTime: "7 min read"
tags: ["Comparisons", "LLMs"]
status: "published"
excerpt: "OpenAI ships the best general-purpose visual reasoning on the planet — for still images. There is no video input path in any OpenAI API, and the only video product they had shuts down September 2026. Here's the honest head-to-head between a video-native API and a frame stack."
---

Here's a fact that surprises almost everyone I say it to: **there is no video API at OpenAI.** Not for files, not for URLs, not for streams. Every "GPT watches video" demo you've seen is a caller-built pipeline that rips frames out of a video and mails the model a stack of stills.

And the direction of travel is away from video, not toward it. The only video-related API OpenAI ever shipped — Sora 2, generation-only — was deprecated March 24, 2026 and shuts down September 24, 2026 ([deprecations](https://developers.openai.com/api/docs/deprecations)). The SDK feature request asking for the video-input parity Gemini already has is still open ([openai/openai-node#1778](https://github.com/openai/openai-node/issues/1778)).

None of this makes OpenAI bad. GPT-5.6's visual reasoning over stills — charts, receipts, screenshots, documents — is the best available, and I'll say so repeatedly below. But if your input is *video* — moving, time-ordered, possibly live — OpenAI doesn't sell the product. Primate Vision is exactly that product: live WebRTC streams and 2 GiB uploads at native frame rates, returning a deterministic verdict — yes / no / indeterminate — with calibrated confidence, timestamped evidence, and published latency.

*This is part of our [full 2026 video-AI landscape comparison](/compare/video-ai-landscape-2026).*

---

## Two different questions

OpenAI Vision answers: *"What do you see in this image — and what should we do about it?"* Vision is a modality of their flagship reasoning models, not a video product — "Vision is the ability for a model to 'see' and understand images," per their own docs. Feed it stills (up to 1,500 per request, 512 MB total) and get world-class open-ended understanding, OCR, comparison, extraction, with the whole LLM ecosystem wrapped around the answer. ([images & vision guide](https://developers.openai.com/api/docs/guides/images-vision))

Primate Vision answers: *"Is X happening in this video — and can you prove it?"* Point it at a live stream (managed WebRTC) or a file (upload or URL ingest, up to 2 GiB), ask in plain English, and get a verdict from a closed vocabulary (`yes` / `no` / `indeterminate`), a calibrated 0–1 confidence score, timestamped evidence segments, and an annotated overlay evidence video — at 45ms p50 per-frame inference, published on a public [/performance](https://www.primateintelligence.ai/performance) page.

One of these products accepts video. The other genuinely does not.

## The head-to-head

| Capability | Primate Vision | OpenAI |
|---|---|---|
| Video file upload | ✅ MP4/MOV up to 2 GiB, presigned or URL ingest | ❌ images only — ≤512 MB, ≤1,500 images/request ([docs](https://developers.openai.com/api/docs/guides/images-vision)) |
| Live stream input | ✅ managed WebRTC, native frame rate | ⚠️ Realtime API = audio + still images, no video track ([realtime guide](https://developers.openai.com/api/docs/guides/realtime)) |
| Published latency | ✅ 45ms p50 / 316ms p95, 11.8 fps sustained | ❌ none; "Fast mode" claims only "up to 2.5× faster… at twice the price" ([changelog](https://developers.openai.com/api/docs/changelog)) |
| Verdict contract | ✅ deterministic yes/no/indeterminate + calibrated 0–1 confidence | ⚠️ JSON schema forces the shape, but confidence is model-generated text and answers are stochastic |
| Timestamped segments | ✅ per-clip start/end + confidence | ❌ no video input → no native timestamps; caller injects frame labels as text |
| Evidence artifacts | ✅ annotated overlay evidence video | ❌ text only |
| General reasoning / OCR / documents | ❌ visual verdicts only — no OCR, no transcription | ✅ world-class; plus transcription APIs from $0.0045/min ([pricing](https://developers.openai.com/api/docs/pricing)) |
| Spatial localization | ❌ overlay only, no bbox JSON | ⚠️ model-emitted boxes, but their own docs warn the model "struggles with tasks requiring precise spatial localization" |
| Batch + webhooks | ✅ webhooks (signed, retries, redelivery) + `Prefer: wait`; 2–10 prompts/video, 50% off after the first | ✅ Batch API at 50% off; platform webhooks — genuinely strong |
| Agent accessibility | ✅ llms.txt, markdown docs twins, MCP server, sandbox key in one POST | ✅ best-in-class: llms.txt, .md docs, MCP in Responses API, 6 SDKs, Terraform |

## "Just extract the frames" is not a video pipeline

The standard workaround — ffmpeg the video into 1fps stills, batch them into requests — is what every OpenAI video tutorial actually teaches, including OpenAI's own cookbook. Here's what it costs you beyond dollars:

- **Motion is invisible.** Anything that happens *between* samples never reaches the model. A fall, a thrown punch, a package grab takes well under a second.
- **Long video doesn't fit.** The 1,500-images-per-request cap means a 1-hour video at 1fps must be chunked into 3+ requests, each blind to the others' temporal context — a ~25-minute ceiling per request. ([docs limits](https://developers.openai.com/api/docs/guides/images-vision))
- **Time is a string.** No temporal primitives — no segments, no event timeline. You label frames "t=00:14:32" in text and trust a stochastic model to echo them back accurately.
- **You own the pipeline.** Frame extraction, chunking, retries, timestamp bookkeeping, cross-chunk reconciliation — all yours to build and operate, forever.

That's not a video pipeline. That's a stack of photographs and a prayer.

On Primate Vision the equivalent is one API call: `POST /v1/analyses` with a video and a question; a webhook (or `Prefer: wait`) delivers verdict + confidence + timestamped clips + an annotated evidence video.

## Realtime is real-time for voice, not for video

OpenAI's Realtime API is genuinely GA (the beta interface was removed May 12, 2026) and genuinely impressive — WebRTC/WebSocket/SIP voice agents that now accept **still images** in-session, priced at $5.00/1M image input tokens. But there is no video track and no continuous video-stream input; a client pushing periodic snapshots is a workaround, not a product. ([realtime guide](https://developers.openai.com/api/docs/guides/realtime); [pricing](https://developers.openai.com/api/docs/pricing); corroborated on [Microsoft Learn](https://learn.microsoft.com/en-us/answers/questions/2147073/))

Primate Vision's live lane is managed WebRTC at native frame rates, with mid-stream prompt changes over one WebSocket message and session caps the API tells you about up front (up to 1 hour per session on top plans).

## Verdicts: a contract vs. a conversation

Ask GPT-5.6 "did anyone enter the loading zone?" over a frame stack and you get prose — or, with Structured Outputs, JSON shaped like an answer. For exploratory questions that flexibility is wonderful. But the confidence number inside that JSON is generated text, not a calibrated score; the answer is stochastic; and OpenAI's own limitations list says the model "may generate incorrect descriptions or captions." ([docs limitations](https://developers.openai.com/api/docs/guides/images-vision))

It's not that GPT-5.6 is a weak model — it's that a language model sampling tokens is the wrong instrument for a measurement. Primate Vision's verdict is a different kind of object: an answer drawn from a **closed vocabulary** — `yes` / `no` / `indeterminate` — never free-form generation, computed by similarity scoring against the video rather than sampled from an LLM, with a calibrated 0–1 confidence, model version pinning (`darwin-1.3`) so behavior changes only when you choose, and a fully deterministic test mode for CI. And every yes ships with proof: timestamped clips plus an annotated overlay evidence video a human can watch and forward.

## Pricing: token math vs. a flat meter

**OpenAI bills per token, and video has no price because video has no product.** Frames are tokenized — GPT-5.x counts 32×32-pixel patches, so a 720p frame at high detail is ~920 input tokens — billed at the model's rate (gpt-5.6-terra: $2.00/1M input; gpt-5.6-sol: $5.00/1M). Our normalized estimate for DIY frame-by-frame analysis at 1fps: roughly **$1.84/camera-hour** (terra, low detail) up to **$6.62** (terra, high) or **$16.56** (sol, high) — *estimates*; they exclude output tokens, prompt overhead, and the chunking penalty, so real cost runs higher. ([pricing](https://developers.openai.com/api/docs/pricing); tokenization per the [vision guide](https://developers.openai.com/api/docs/guides/images-vision))

**Primate Vision has two lanes**, stated plainly:

1. **Metered — $0.01 per second of source video** ($0.60/min), flat and fps-independent. Queued time free; failed jobs free. A 30-second clip → verdict + confidence + timestamps + evidence video = $0.30. A `validate_only` dry-run estimates cost before you spend a credit.
2. **[Enterprise — contact us](https://primateintelligence.ai/pricing#enterprise)** for 24/7 continuous monitoring and camera fleets: dedicated capacity or on-site deployment at a small fraction of the metered rate, under highly discounted enterprise plans.

Normalized honestly: at 1fps stills, OpenAI's DIY route works out ~5–20× cheaper per raw hour (estimate) than $36/camera-hour† at Primate's metered rate — *if* your use case tolerates 1fps sampling, no temporal continuity, stochastic answers, and building the entire frame pipeline yourself. The meters buy different things: their tokens buy raw model reads of stills; our seconds buy answered questions about video, with evidence, at native frame rate, live or on demand. You don't buy camera-hours on our metered lane. You buy verdicts.

† *Metered rate normalized for comparison. Primate does not sell 24/7 continuous monitoring at the metered rate — continuous and fleet workloads use enterprise plans; [contact us](https://primateintelligence.ai/pricing#enterprise).*

## Choose OpenAI instead when…

These are real lanes, and they're wide ones:

- **Your input is stills or documents, not video.** Screenshots, photos, charts, receipts, PDFs-as-images — GPT-5.6's open-ended visual reasoning plus OCR is the best available, and Primate Vision doesn't do any of it (no OCR, no transcription, no open-ended description).
- **You need reasoning around the answer.** Explain, compare, extract, then call a tool and act — one model, one vendor. Primate answers one question about one video; it doesn't write your incident report.
- **Sparse sampling is genuinely fine.** One screenshot a minute of a screen recording, thumbnail triage, still-image moderation at scale — the Batch API at 50% off makes this very cheap (~$1.84/camera-hour at 1fps low detail, estimate).
- **You're already on the OpenAI / Azure / Bedrock stack** and want one vendor for text + vision + audio + agents, with enterprise controls (ZDR, data residency, spend limits) already built.
- **You want images inside a voice agent.** Realtime image input is GA with published pricing — a conversational agent that glances at a photo mid-call is a real, shipping OpenAI product.

## Choose Primate Vision when…

- **The input is actually video.** Files up to 2 GiB, URL ingest, or live WebRTC — no frame ripping, no chunking, no 25-minute ceiling. OpenAI has no video input path in any API.
- **The camera is live.** Managed WebRTC at native frame rates with mid-stream prompt changes, versus pushing snapshots into a voice-agent API as a workaround.
- **Motion is the point.** Falls, intrusions, safety events — things that happen between 1fps samples. Native-frame-rate analysis sees them; a frame stack doesn't.
- **You need an answer, not an essay.** A closed-vocabulary yes/no/indeterminate with calibrated confidence beats generated prose when the output feeds an alert, a workflow, or a compliance record.
- **You need proof.** Timestamped clips plus an annotated overlay evidence video — versus text that says it saw something.
- **You need to know cost and latency before you run it.** One flat meter plus a `validate_only` dry-run, and published 45ms p50 / 316ms p95 / 11.8 fps / 6.6s session setup. OpenAI publishes no vision latency numbers at all.

## Try it

**[Try it for free](https://primateintelligence.ai/signup)** — real processing, no card required to start.

**Your AI agent can do it for you — right from Claude.** Primate Vision ships an MCP server, llms.txt, markdown docs twins, and a sandbox key available in a single POST — your agent can get a key, upload a clip, and read back a verdict without a human touching a dashboard. (Credit where due: OpenAI's developer platform sets the bar here, and we built to it.)

For 24/7 monitoring and camera fleets: [see our enterprise plans](https://primateintelligence.ai/pricing#enterprise).

---

*Method note: every OpenAI claim traces to their live developer docs, pricing page, changelog, and deprecations page accessed 2026-07-31. Estimates are labeled.*
