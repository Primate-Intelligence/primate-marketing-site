---
title: "Primate Vision vs. Self-Hosted Open VLMs (2026): Buying Answers vs. Building a Video Pipeline"
slug: "open-vlms"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-07-31"
readTime: "7 min read"
tags: ["Comparisons", "Open Source"]
status: "published"
excerpt: "Qwen3-VL, InternVL, LLaVA, Moondream — open VLMs are excellent, improving quarterly, and free to download. But the weights are not the product. No open model ships streaming ingest, calibrated verdicts, evidence artifacts, or a published latency number. Here's the honest math."
---

Open vision-language models are the strongest honest case against any managed video API, ours included. Qwen3-VL, InternVL3.5, LLaVA-OneVision-2, Moondream — genuinely excellent, improving every quarter, free to download. If you have a large in-house ML team, a big 24/7 camera fleet, or video that legally cannot leave the building, self-hosting is the right call and I'll say so plainly below.

But the weights are not the product.

No open model ships a streaming ingestion layer, a calibrated verdict, evidence artifacts, webhooks, or a published latency number. Every one of those is a build project measured in engineer-months, then a permanent ops burden. Primate Vision is the finished version of that build: a managed API that watches video live over WebRTC at native frame rates and returns a deterministic verdict — `yes` / `no` / `indeterminate` — with a calibrated 0–1 confidence score and an annotated evidence video, at 45ms p50 per-frame inference, published on a public [/performance](https://www.primateintelligence.ai/performance) page.

The real comparison isn't model vs. model. It's a parts list vs. an answer.

*This is part of our [full 2026 video-AI landscape comparison](/compare/video-ai-landscape-2026).*

---

## Two different purchases

Downloading Qwen3-VL gets you a state-of-the-art model — Alibaba calls it "the most powerful vision-language model in the Qwen series to date," with native 256K context and timestamp-grounded video understanding ([Qwen3-VL GitHub](https://github.com/QwenLM/Qwen3-VL)). What it does *not* get you: frame capture from a camera, session management, batching, a verdict schema, confidence calibration, clip extraction, overlay rendering, job orchestration, webhooks, an eval harness, or anyone on call when it breaks at 3am. Every item on a managed product's feature list is a build project here — weeks to months of engineering, then permanent MLOps.

Primate Vision answers the question those teams are ultimately trying to answer: *"Is X happening — and can you prove it?"* Point it at a live stream (managed WebRTC) or a file (upload or URL ingest, up to 2 GiB), ask in plain English, and get a verdict from a closed vocabulary — never free-form generation — with a calibrated 0–1 confidence score, timestamped evidence segments, and an annotated overlay evidence video. Model version pinned (`darwin-1.3`), cost known before you run it (`validate_only` dry-run), zero GPUs owned.

## The head-to-head

| Capability | Primate Vision | Self-hosted open VLMs |
|---|---|---|
| Live stream input | ✅ managed WebRTC, native frame rate | ❌ no model ships a streaming layer — RTSP/WebRTC capture, batching, session state are all DIY |
| Published latency | ✅ 45ms p50 / 316ms p95, 11.8 fps sustained | ⚠️ per-frame real-time achievable with small models; no published end-to-end latency anywhere — entirely deployment-dependent |
| Verdict contract | ✅ closed-vocab yes/no/indeterminate + calibrated 0–1 confidence | ⚠️ constrained decoding can force a yes/no schema, but confidence is uncalibrated and hallucination risk is yours |
| Timestamped segments | ✅ included | ⚠️ Qwen3-VL claims "text–timestamp alignment… precise, timestamp-grounded event localization" — vendor claim, production accuracy unverified ([Qwen3-VL GitHub](https://github.com/QwenLM/Qwen3-VL)) |
| Evidence artifacts | ✅ annotated overlay evidence video + timestamped clips | ❌ nothing built-in; clip extraction and overlay rendering are yours to build |
| Bounding boxes / spatial JSON | ❌ overlay only, no JSON | ✅ Qwen3-VL ships 2D *and* 3D grounding cookbooks — a genuine open-VLM strength |
| Transcript / OCR / audio | ❌ visual only | ⚠️ Qwen3-VL OCR in 32 languages (strong); audio needs a separate ASR model |
| Batch/async + webhooks | ✅ webhooks (Standard Webhooks signing, retries, redelivery) + `Prefer: wait` | ❌ self-built — vLLM batch APIs help, but job orchestration and webhooks are yours |
| Edge / air-gap | ❌ cloud API (enterprise plans include on-site deployment options) | ✅ the category's ace: weights run fully offline, from Moondream on edge boxes to Qwen3-VL on your own racks |
| Docs / SLA / support | ✅ OpenAPI 3.1 on prod, npm + PyPI SDKs, MCP server, llms.txt; published availability targets | ⚠️ HF/vLLM community quality is good, but no product docs, no SLA, no support line |

## The streaming layer no model ships

This is the category's cleanest structural gap: **not one open VLM ships live-stream ingestion.** There's no RTSP listener, no WebRTC endpoint, no session manager in any repo — Qwen3-VL, InternVL3.5, LLaVA-OneVision-2, Moondream, none of them. "Video input" means frames or files you've already captured. To watch a camera you build the capture pipeline, the frame sampler, the batching logic, the reconnect handling, and the latency proof — and then you maintain it as the model landscape shifts under you every quarter.

On Primate Vision that layer is the product: managed WebRTC sessions at native frame rates, mid-stream prompt changes over one WebSocket message (`update_prompt` — no reconnect, no re-upload), session caps and warnings surfaced in the API, and per-second metering that stops when the session ends.

## Verdicts: a contract vs. constrained decoding

Self-hosted, you can JSON-mode a VLM into answering "yes" or "no." What you can't get from any open checkpoint is a *calibrated* answer. No vendor publishes verdict calibration, sampling defaults are stochastic (Qwen recommends temperature 0.7 for VL models), and generative decoders confidently assert events that never happened. Nobody publishes hallucination rates on surveillance-style footage — the category's biggest evidential gap. If your output feeds an alert, a workflow, or a compliance record, that gap is your problem to close, with your own eval harness and your own QA.

Primate Vision's verdict is a different kind of object: an answer drawn from a closed vocabulary, computed by similarity scoring against the video rather than sampled from a language model, with a calibrated 0–1 confidence score, model version pinning so behavior changes only when you choose, and a fully deterministic test mode for CI. And every yes ships with proof a human can watch and forward.

Worth stating honestly: open models are also still behind the closed frontier on hard video reasoning — on Video-MME-v2's non-linear split, Gemini-3-Pro scores 49.4 vs. 39.1 for the best open model ([arXiv 2604.05015](https://arxiv.org/abs/2604.05015)). The free lunch is real, but it isn't the best lunch.

## Pricing: two lanes vs. the GPU bill

**Self-hosting's cost floor is genuinely spectacular — let's do the math in the open.** Weights are free (check each checkpoint's license tag on Hugging Face — terms vary). An RTX 4090 rents for $0.69/hr on [RunPod](https://www.runpod.io/pricing), and spot marketplaces dip lower. Our engineering estimate: a batched Qwen3-VL-8B deployment on one 4090 sustains roughly 10–20 concurrent 1fps camera streams, which pencils out to **~$0.03–$0.15 per camera-hour** (estimate — throughput figures are unpublished; measure before relying on them). That is the cheapest raw compute in the entire category, by orders of magnitude.

But that headline **silently assumes 100% GPU utilization and free engineers.** Add what the invoice doesn't show: the streaming-infra build (weeks to months), roughly 0.5–1 FTE of MLOps (~$8–15k/month loaded), an eval and hallucination-QA harness, prompt regression testing, spot-interruption handling, and on-call. With those carried, our estimate is that self-hosting wins only above roughly **20–50 continuous cameras** or under hard data-privacy requirements. Below that line, you're paying senior-engineer salaries to reinvent a product.

**Primate Vision has two lanes**, stated plainly:

1. **Metered — $0.01 per second of source video** ($0.60/min), flat and fps-independent. Queued time free; failed jobs free. A 30-second clip → verdict + confidence + timestamps + evidence video = $0.30. Run up to 10 questions against one video in a single batch call, each after the first at 50% off. `validate_only` estimates cost before touching GPU or credits.
2. **[Enterprise — contact us](https://primateintelligence.ai/pricing#enterprise)** for 24/7 continuous monitoring and camera fleets: dedicated capacity or on-site deployment at a small fraction of the metered rate, under highly discounted enterprise plans.

The honest normalization: the metered lane works out to $36/camera-hour† against a self-hosted ~$0.03–$0.15 — raw compute is cheaper by two to three orders of magnitude, and if you're running a large fleet with an ML team, that gap is real and you should weigh it (then talk to our enterprise team, because the metered rate is deliberately not our fleet price). But the two numbers buy different things. The GPU rate buys *tokens out of a model* — no ingestion, no verdict contract, no calibration, no evidence clips, no webhooks, no SLA, no one to page. The Primate meter buys *answered questions with proof*, live or on demand, on infrastructure someone else keeps running. You don't buy camera-hours on our metered lane. You buy verdicts.

† *Metered rate normalized for comparison. Primate does not sell 24/7 continuous monitoring at the metered rate — continuous and fleet workloads use enterprise plans; [contact us](https://primateintelligence.ai/pricing#enterprise).*

(One managed exception inside the open ecosystem: [Moondream Cloud](https://moondream.ai/pricing) sells its small models token-priced — ~$0.36/camera-hour real-time by our token math, estimate. It's a real option for lightweight visual QA, in a much smaller model class, and still leaves the verdict/evidence/streaming layers to you.)

## Choose self-hosted open VLMs instead when…

This alternative is legitimately right for whole categories of buyers:

- **You run a large 24/7 camera fleet (roughly 20–50+ continuous streams) and have an in-house ML team.** At that scale the per-camera-hour cost floor dominates and the fixed engineering cost amortizes. This is the strongest honest case against any managed API, ours included.
- **Your video cannot leave the premises.** Classified, defense, hospital-internal, air-gapped environments: open weights running fully offline are the only answer. (If your constraint is deployment location rather than absolute isolation, our enterprise plans include on-site deployment options — [talk to us](https://primateintelligence.ai/pricing#enterprise).)
- **You need breadth beyond verdicts.** One Qwen3-VL deployment covers OCR in 32 languages, document parsing, 2D/3D grounding, GUI agents — many workloads sharing one set of GPUs. Primate Vision is deliberately narrow: visual verdicts with evidence.
- **You want zero marginal cost on re-querying.** Once the GPUs are sunk cost, asking the same footage a thousand questions is free. Our meter bills each analysis.
- **You're researching or prototyping.** A $0 license and a rented 4090 beats any procurement cycle, and the open frontier improves quarterly at no cost to you — LLaVA-OneVision-2's codec-aligned video processing (April 2026) is genuinely novel architecture, free ([LMMs-Lab](https://www.lmms-lab.com/posts/llava_onevision_2/)).
- **You need to fine-tune on your own domain.** Open weights (and Moondream's Lens at $0.60/1M training tokens) offer customization no managed verdict API matches today.

## Choose Primate Vision when…

- **You need the answer this quarter, not the infrastructure roadmap.** Streaming ingestion, verdict schema, calibration, evidence rendering, webhooks — with open VLMs each is a build project; with us it's one API call.
- **The output feeds a decision.** A closed-vocabulary verdict with calibrated confidence and a watchable evidence video beats an uncalibrated generative "yes" when an alert, a workflow, or a compliance record hangs on it — and nobody publishes hallucination rates for open VLMs on this class of footage.
- **Latency is a requirement, not a hope.** We publish 45ms p50 / 316ms p95 / 11.8 fps sustained / 6.6s session setup on a public page. No open-VLM stack publishes anything comparable — you'd have to achieve *and prove* it yourself.
- **Your true TCO includes engineers.** Below fleet scale, the managed meter is almost always cheaper than 0.5–1 FTE of MLOps plus GPU utilization risk — and it's zero ops from day one.
- **The camera count is one, or bursty, or agent-driven.** Clips, incidents, on-demand checks: $0.30 answers a question about a 30-second clip, with proof, no GPU rented.

## Try it

**[Try it for free](https://primateintelligence.ai/signup)** — real processing, no card required to start.

**Your AI agent can do it for you — right from Claude.** Primate Vision ships an MCP server, llms.txt, markdown docs twins, and a sandbox key available in a single POST — your agent can get a key, upload a clip, and read back a verdict without a human touching a dashboard.

For 24/7 monitoring, camera fleets, and on-site deployment: [see our enterprise plans](https://primateintelligence.ai/pricing#enterprise).

---

*Method note: every open-VLM claim traces to vendor repos, model cards, pricing pages, and papers accessed 2026-07-31. All $/camera-hour figures for self-hosted deployments are labeled estimates with assumptions stated.*
