---
title: "Primate Vision vs. AWS Rekognition + Bedrock Nova (2026): The Door AWS Closed"
slug: "aws-rekognition"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-07-31"
readTime: "7 min read"
tags: ["Comparisons", "Cloud Vision"]
status: "published"
excerpt: "AWS closed Rekognition streaming to new customers on April 30, 2026 — its own migration advice is to snapshot frames into the image API. Here's what remains, what Bedrock Nova actually offers, and the honest head-to-head against a real-time verdict API."
---

The most important fact about AWS Rekognition in 2026 comes from AWS itself: **"Streaming Video and Bulk Image Analysis features will no longer be available to new customers, effective April 30, 2026."** ([availability changes](https://docs.aws.amazon.com/rekognition/latest/dg/rekognition-availability-changes.html))

Read that again. The largest cloud on earth decided real-time video analysis wasn't a business it wanted new customers in. A new customer cannot buy it from Rekognition at any price — AWS's own published migration advice is to snapshot frames and call the *image* API via Lambda. What remains is a solid fixed-taxonomy stored-video API (labels, faces, moderation, bounding boxes) and, on the generative side, Bedrock Nova — an explicitly **offline** video Q&A model.

Primate Vision is the managed real-time lane AWS exited: live WebRTC ingest at native frame rates, plain-English questions, and a **deterministic verdict** — yes / no / indeterminate — with calibrated confidence, timestamps, and an annotated evidence video.

*This is part of our [full 2026 video-AI landscape comparison](/compare/video-ai-landscape-2026).*

---

## What happened to Rekognition streaming

Rekognition's real-time story was Streaming Video Events: Kinesis Video Streams in, SNS alerts out. Even at its best it was narrow. The streaming detector covers "people, packages and pets" only, and processes a **maximum of 120 seconds of video per motion event** ([streaming docs](https://docs.aws.amazon.com/rekognition/latest/dg/streaming-video-detect-labels.html)). Doorbell alerts, not continuous monitoring. No actions, no activities, no questions.

As of April 30, 2026, that lane is closed to new customers. Grandfathered accounts (active in the last 12 months) keep access; everyone else is pointed at frame-snapshotting into the image API. AWS's designated forward path for open-vocabulary video understanding is Bedrock Nova — which we'll take seriously below, because on its own terms it's very cheap.

## The head-to-head

| Capability | Primate Vision | AWS Rekognition | Bedrock Nova |
|---|---|---|---|
| Live stream input | ✅ managed WebRTC, native frame rate | ⚠️ closed to new customers; grandfathered: people/pets/packages, ≤120s/event | ❌ file/S3 only |
| Open-vocab NL prompting | ✅ core product | ❌ fixed detector taxonomy, no prompts anywhere | ✅ free-form prompts |
| Verdict contract | ✅ deterministic yes/no/indeterminate + calibrated 0–1 confidence | ❌ exhaustive label lists; you post-process | ⚠️ generated text/JSON, uncalibrated, stochastic |
| Fidelity | ✅ native frame rate, full resolution | ✅ duration-billed, AWS samples internally | ⚠️ all video resized "with distortion" to 672×672; 1fps only ≤16 min (960-frame budget — a 1-hour video drops to 0.14fps) ([Nova docs](https://docs.aws.amazon.com/nova/latest/userguide/modalities-video.html)) |
| Evidence artifacts | ✅ annotated overlay evidence video + timestamped clips | ⚠️ one first-detection frame JPEG (streaming); JSON only (stored) | ❌ text only |
| Bounding-box JSON | ❌ overlay video only | ✅ frame-accurate, normalized, GA — genuinely excellent | ⚠️ limited spatial reasoning (self-declared) |
| Audio | ❌ visual only | ⚠️ OCR yes; transcription is a separate service | ❌ "Audio tracks in videos are not processed" |
| Ingest | ✅ direct upload or URL ingest, ≤2 GiB | ⚠️ S3 only, no upload/URL endpoint | ⚠️ base64 ≤25 MB or S3 ≤1 GB |
| Async model | ✅ webhooks (Standard Webhooks, retries, redelivery) + `Prefer: wait` | ✅ SNS/SQS/Lambda — the gold standard | ✅ Bedrock async |
| Onboarding | ✅ sandbox key in one POST, no email, no card | ⚠️ SigV4 signing; no sandbox, no curl-first path | ⚠️ Bedrock + IAM setup |
| Published latency | ✅ 45ms p50 / 316ms p95, 11.8 fps, 6.6s setup | ❌ none | ❌ none (minutes-scale per request) |

## Verdicts vs. label lists

Ask Rekognition about a warehouse camera and it returns everything it saw: labels, confidences, bounding boxes, timestamps. Thorough, machine-consumable, and entirely question-free. "Is the forklift reversing without a spotter?" is unanswerable — you build the reasoning layer yourself, on top of label streams, and you maintain it forever.

Nova can take the question. But it answers with a sampled LLM generation over 672×672 distorted frames at 1fps — no calibrated confidence, no indeterminate semantics, and re-asking means re-billing the full token count.

Primate Vision answers the question as a measurement: a deterministic verdict from a closed vocabulary, computed by similarity scoring against the video — not sampled from a language model — with a calibrated 0–1 confidence, a pinnable model version (`darwin-1.3`), timestamped evidence segments, and an annotated overlay video you can attach to an incident report.

## Pricing: three very different meters

**Rekognition (stored)** bills per minute *per API*: Label Detection $0.10/min, Content Moderation $0.10/min, Shot Detection $0.05/min — run three detectors on the same footage and pay three times. That's **$6.00/camera-hour for one detector**. Streaming (grandfathered only) is $0.00817/min ≈ **$0.49/camera-hour** — plus a separate Kinesis Video Streams bill. ([Rekognition pricing](https://aws.amazon.com/rekognition/pricing/))

**Nova** is the cheapest open-vocabulary option in the entire landscape for offline clips: roughly **$0.06/camera-hour** on Nova Lite (estimate; input tokens only, third-party-corroborated rates — AWS's own pricing page is JS-gated and its Price List API shows an ambiguous $0.03/M meter). The caveats the raw number hides: four separate requests per hour (16-minute cap at 1fps), minutes of latency per request, no audio, downscale distortion, one question per pass, no verdicts, no evidence.

**Primate Vision has two lanes:**

1. **Metered — $0.01 per second of source video** ($0.60/min), flat, fps-independent. Queued time free; failed jobs free. A 30-second clip → verdict + confidence + timestamps + evidence video = $0.30. Re-query the same upload for 30 days; batch 2–10 questions against one video at 50% off each after the first.
2. **[Enterprise — contact us](https://primateintelligence.ai/pricing#enterprise)** for 24/7 continuous monitoring and camera fleets: dedicated capacity or on-site deployment at a small fraction of the metered rate, under highly discounted enterprise plans.

Normalized honestly: our metered lane is $36/camera-hour† — versus $6/hr for one Rekognition detector, $0.49/hr for grandfathered streaming, ~$0.06/hr for offline Nova. Up to ~70× cheaper on raw numbers. If a fixed detector or an offline batch answer genuinely solves your problem, take the cheaper row. But none of those rows include the thing our meter prices: a live, deterministic, evidenced answer to *your* question. On the metered lane you buy verdicts, not camera-hours. When the workload really is camera-hours, that's the enterprise lane.

† *Metered rate normalized for comparison. Primate does not sell 24/7 continuous monitoring at the metered rate — continuous and fleet workloads use enterprise plans; [contact us](https://primateintelligence.ai/pricing#enterprise).*

## Choose AWS instead when…

There are real answers here, not straw men:

- **You need face identity at scale.** Face search against collections of up to 20M vectors, person pathing, celebrity recognition — Rekognition is purpose-built for it and we have nothing in the category.
- **You need bounding-box JSON for downstream geometry** — zones, dwell logic, heatmaps — on stored footage. Rekognition's spatial JSON is frame-accurate and GA; Primate Vision returns overlay video, not coordinates.
- **You need content moderation or media-catalog labeling** of large stored libraries at the lowest per-minute price, with the SNS/SQS/Lambda event architecture your team already runs.
- **You're grandfathered into Streaming Video Events** for doorbell-style person/pet/package alerts and it does the job — keep it running.
- **You can wait, chunk, and post-process**: Nova is the cheapest open-vocabulary clip Q&A anywhere. If offline is fine and evidence isn't required, it's hard to beat on cost.
- **AWS compliance surface is the requirement**: HIPAA eligibility, SOC scope, IAM/CloudTrail. We have published availability targets and Enterprise SLAs, but no SOC 2 certification yet.

## Choose Primate Vision when…

- **You're a new customer who needs real-time video analysis.** AWS does not sell it to you anymore. Frame-snapshotting into an image API is a workaround, not a product.
- **Your question isn't in the taxonomy.** Open-vocabulary, live or stored: "did anyone climb the fence," not "person detected."
- **The answer needs to be actionable and auditable**: deterministic verdict, calibrated confidence, timestamped clips, watchable evidence — one clean JSON contract instead of label streams plus a reasoning layer you build.
- **Fidelity matters**: native frame rate and full resolution, versus 1fps sampling and 672×672 distortion.
- **You want to evaluate in five minutes**: sandbox key in one POST, curl-first docs — versus SigV4 signing and IAM setup before your first call.

## Try it

**[Try it for free](https://primateintelligence.ai/signup)** — real processing, no card required to start.

**Your AI agent can do it for you — right from Claude.** Primate Vision ships an MCP server, llms.txt, markdown docs twins, and a sandbox key available in a single POST — your agent can get a key, upload a clip, and read back a verdict without a human touching a dashboard.

For 24/7 monitoring and camera fleets: [see our enterprise plans](https://primateintelligence.ai/pricing#enterprise).

---

*Method note: every AWS claim traces to AWS docs, the Rekognition/Bedrock Price List APIs, and pricing pages accessed 2026-07-31. Nova per-token rates are third-party-corroborated where AWS's page is JS-gated; estimates are labeled.*
