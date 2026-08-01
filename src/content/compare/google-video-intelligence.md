---
title: "Primate Vision vs. Google Video Intelligence (2026): Any Question You Can Type vs. a Label Menu Frozen in 2021"
slug: "google-video-intelligence"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-07-31"
readTime: "7 min read"
tags: ["Comparisons", "Cloud Vision"]
status: "published"
excerpt: "Google Video Intelligence is the cheapest serious way to bulk-annotate stored video — with a real SLA and a generous free tier. It's also a pre-LLM product whose release notes end in 2021, with no prompt parameter anywhere in the API. Here's the honest head-to-head."
---

Google Cloud Video Intelligence has not shipped a feature since November 1, 2021. That's not my characterization — it's Google's own [release notes page](https://docs.cloud.google.com/video-intelligence/docs/release-notes), where the entries simply stop. The only product event since is a shutdown: Celebrity Recognition, deprecated 2024, switched off September 2025 — and the [pricing page](https://cloud.google.com/products/video-intelligence/pricing) still lists a price for it.

Here's the thing though: a stable legacy annotator kept running under a real SLA is a legitimate thing to be. GVI is still the cheapest serious way to bulk-annotate stored video with commodity metadata — labels, shots, OCR, transcripts, explicit-content flags — with a formal 99.9% SLA and a genuinely generous free tier. If your question maps onto Google's fixed feature list, it's ~5–6× cheaper per raw hour than us and you should use it.

But it is a pre-LLM product. There is no prompt parameter anywhere in the API. If your question is your own — *"did the forklift enter the loading bay?"* — GVI has no way to hear it. Primate Vision answers exactly that: plain English in, a deterministic verdict out (`yes` / `no` / `indeterminate`), with calibrated confidence, timestamped evidence clips, and an annotated evidence video, live or on demand.

*A note on keeping Google straight: this post is about Google Video Intelligence, the 2017-era annotation API. Gemini — Google's modern, promptable video surface — is a different product with different criticisms, covered in [its own comparison](/compare/gemini). Don't conflate them; we don't.*

---

## A menu of nine features vs. any question you can type

Video Intelligence answers: *"What does Google's taxonomy see in this video?"* You pick from a feature enum — `LABEL_DETECTION`, `OBJECT_TRACKING`, `SHOT_CHANGE_DETECTION`, text, logos, faces, people, explicit content, speech — and get back an annotation document: entities, timestamps, confidences, bounding boxes. For catalog indexing or content moderation, the fixed classifier is exactly the job. ([Google VI docs](https://cloud.google.com/video-intelligence/docs))

What it cannot do is take a question. If "forklift entering a loading bay" isn't in the taxonomy, your options are to reason over raw label JSON yourself, or to train your own AutoML model on Vertex first — a path that only exists for streaming, has been Beta since 2019, and now points into a Vertex platform Google is actively reshuffling into its Gemini agent stack ([action recognition docs](https://docs.cloud.google.com/video-intelligence/docs/streaming/action-recognition)).

Primate Vision answers: *"Is X happening — and can you prove it?"* Point it at a live stream (managed WebRTC) or a file (upload or URL ingest, up to 2 GiB), ask in plain English, and get a verdict from a closed vocabulary — never free-form generation — with a calibrated confidence score, timestamped segments, and an annotated overlay evidence video, at 45ms p50 per-frame inference published on a public [/performance](https://www.primateintelligence.ai/performance) page.

## The head-to-head

| Capability | Primate Vision | Google Video Intelligence |
|---|---|---|
| Open-vocabulary questions | ✅ core product — plain English in, verdict out | ❌ feature enums only; no prompt parameter anywhere ([docs](https://cloud.google.com/video-intelligence/docs)) |
| Verdict contract | ✅ yes/no/indeterminate + calibrated 0–1 confidence, model pinning (`darwin-1.3`) | ❌ annotation documents with per-entity confidence — never an answer to a question |
| Live stream input | ✅ managed WebRTC, native frame rate | ⚠️ Beta gRPC; live protocols require compiling Google's AIStreamer C++/GStreamer proxy yourself ([live streaming docs](https://docs.cloud.google.com/video-intelligence/docs/streaming/live-streaming)) |
| Published latency | ✅ 45ms p50 / 316ms p95, 11.8 fps sustained | ❌ none published; streaming granularity "about 1 second of video" (sample-code comment) |
| Custom action/event detection | ✅ open-vocab, live + stored | ⚠️ BYO AutoML model, streaming Beta only ([action recognition](https://docs.cloud.google.com/video-intelligence/docs/streaming/action-recognition)) |
| Timestamped segments | ✅ | ✅ segment/shot/frame offsets — solid |
| Evidence artifacts | ✅ annotated overlay evidence video + clips | ❌ JSON annotations only |
| Bounding boxes in JSON | ❌ overlay only, no coordinates | ✅ normalized boxes, GA — a real GVI win |
| Transcript / OCR | ❌ visual only | ✅ GA speech transcription with diarization + text detection |
| Webhooks | ✅ Standard Webhooks signing, retries, redelivery + `Prefer: wait` | ❌ long-running Operations, polling only |
| SLA | ⚠️ published targets (99.9% control plane), not contractual in v1; Enterprise SLA available | ✅ formal 99.9% with financial credits — but streaming/Beta excluded ([SLA](https://cloud.google.com/video-intelligence/sla)) |
| Product momentum | ✅ shipping (webhooks, URL ingest, SDKs, MCP — all 2026) | ❌ release notes end 2021-11-01; only recent change is a feature shutdown |

## Maintenance mode, by Google's own record

This isn't spin; it's Google's own documentation trail:

- **The release notes have no entries after November 1, 2021.** Four-plus years without a shipped feature.
- **The only recent product event is a shutdown.** Celebrity Recognition was switched off September 16, 2025 — the [pricing page](https://cloud.google.com/products/video-intelligence/pricing) still lists a price for it while the [quota page](https://docs.cloud.google.com/video-intelligence/quotas) shows its quota forced to zero ([deprecations](https://docs.cloud.google.com/video-intelligence/docs/deprecations)).
- **The customization escape hatch is wobbling.** GVI's action-recognition docs still point at Vertex AI for AutoML training, while Google reorganizes Vertex into its Gemini agent platform and has already deprecated the adjacent Vertex AI Vision (EOL September 30, 2026) ([Vision AI overview](https://docs.cloud.google.com/vision-ai/docs/overview)). Whether you can still train a *new* AutoML video action model today is unverified — which is itself the tell.

Google's video-understanding future is Gemini — promptable, multimodal, actively developed. GVI is the legacy annotator kept running under SLA. Nobody should start a new build in 2026 expecting this API to grow toward their use case. The roadmap visibly points elsewhere.

## Live video: Beta since 2019, bring your own C++ proxy

GVI does have a streaming surface — a gRPC bidirectional API — but the fine print matters. It has carried a Beta label since 2019, it's explicitly excluded from the SLA under Pre-GA terms, and it accepts file-format chunks, not camera protocols: to connect RTSP, HLS, or RTMP you compile and operate Google's AIStreamer proxy yourself — a C++/GStreamer binary you build with Bazel or Docker and wire up with named pipes ([live streaming docs](https://docs.cloud.google.com/video-intelligence/docs/streaming/live-streaming)). No published latency numbers exist for it, stored or streaming.

Primate Vision's live path is a managed WebRTC handshake at native frame rates, with mid-stream prompt changes over one WebSocket message and per-session limits the API surfaces up front.

## Annotations vs. answers

Here's the deepest difference. GVI's output is an *input to your system*: a JSON document of everything its models saw, which your code must then reason over to decide whether the thing you care about happened. That reasoning layer — mapping "labels: forklift (0.87), warehouse (0.91)" onto "did the forklift enter the loading bay between 2 and 3 AM?" — is left entirely to you.

Primate Vision's output is a *decision*: a verdict from a closed vocabulary with a calibrated 0–1 confidence, computed by similarity scoring against the video rather than sampled from a language model, with model version pinning and a fully deterministic test mode for CI. And every yes ships with proof a human can watch: timestamped clips plus an annotated overlay evidence video. GVI returns coordinates. We return a case file.

## Pricing: two very different meters

**GVI stacks features.** Billing is per-feature × per-minute: label detection $0.10/min stored ($0.12 streaming), object tracking $0.15/min, shot detection $0.05/min, and so on — each feature you request re-meters the same footage, so four features on one video bills four times the minutes. Two gotchas from Google's own pricing page: partial minutes round *up* per request (1,000 five-second clips bill as 1,000 minutes, not 84), and the first 1,000 minutes per feature per month are free — genuinely generous for evaluation and hobby workloads ([GVI pricing](https://cloud.google.com/products/video-intelligence/pricing)).

**Primate Vision has two lanes**, stated plainly:

1. **Metered — $0.01 per second of source video** ($0.60/min), flat and fps-independent. Queued time free; failed jobs free; `validate_only` dry-runs estimate cost without touching GPU or credits. A 30-second clip → verdict + confidence + timestamps + evidence video = $0.30.
2. **[Enterprise — contact us](https://primateintelligence.ai/pricing#enterprise)** for 24/7 continuous monitoring and camera fleets: dedicated capacity or on-site deployment at a small fraction of the metered rate, under highly discounted enterprise plans.

The honest normalization: single-feature label detection on GVI works out to **$6.00/camera-hour stored, $7.20 streaming** (post-free-tier), versus $36/camera-hour† at Primate's metered rate — roughly 5–6× cheaper per raw hour. If a fixed label taxonomy actually answers your question, take that gap. But the meters buy different things: GVI's dollar buys an annotation document you still have to reason over (and stacking the features you'd need narrows the gap fast — labels + object tracking is already $17.40/streaming-hour); ours buys the answered question, with evidence, live or on demand. You don't buy camera-hours on our metered lane. You buy verdicts.

† *Metered rate normalized for comparison. Primate does not sell 24/7 continuous monitoring at the metered rate — continuous and fleet workloads use enterprise plans; [contact us](https://primateintelligence.ai/pricing#enterprise).*

## Choose Google Video Intelligence instead when…

We'd rather you pick the right tool than the wrong one of ours:

- **You need commodity metadata over a large stored archive on GCP.** Labels, shots, OCR, transcripts at ~$0.05–$0.15/min per feature — with 1,000 free minutes per feature every month. For catalog indexing at scale, GVI's economics beat any promptable model, ours included.
- **Content moderation is the whole job.** The explicit-content classifier is exactly the fixed task GVI was built for, GA, under a real SLA.
- **You need bounding-box coordinates in JSON.** GVI's object tracking and person/face detection emit normalized boxes per frame for downstream analytics. Primate Vision renders overlays but does not emit box coordinates.
- **You need speech transcription or on-screen text.** Both GA, with speaker diarization. Primate Vision is visual-only: no transcription, no OCR, no audio path.
- **Your pipeline lives in GCP IAM/Audit-Log land** and a 99.9% SLA with financial credits (on the stored path) is a procurement requirement. We publish availability targets; we don't yet offer a self-serve contractual SLA.
- **Your files are huge.** GVI takes 50GB videos up to 3 hours; our cap is 2 GiB.

## Choose Primate Vision when…

- **Your question isn't on Google's menu.** Nine fixed features vs. anything you can type. No AutoML training project, no Vertex dependency, no reasoning layer to build — one API call.
- **You need an answer, not an annotation document.** A yes/no/indeterminate verdict with calibrated confidence feeds an alert, a workflow, or a compliance record directly. GVI's JSON still needs your own decision logic on top.
- **The camera is live.** Managed WebRTC at native frame rates vs. a 2019 Beta gRPC surface that requires self-compiling a C++/GStreamer proxy and sits outside the SLA.
- **You need proof.** Timestamped evidence clips plus an annotated overlay video a human can watch and forward — versus raw JSON.
- **You want to be told when it's done.** Webhooks with Standard-Webhooks signing, retries, and redelivery — or `Prefer: wait` — versus polling a long-running Operation.
- **You're betting on a roadmap.** We shipped URL ingest, webhooks, SDKs, and an MCP server this year. GVI's last release note is from 2021.

## Try it

**[Try it for free](https://primateintelligence.ai/signup)** — real processing, no card required to start.

**Your AI agent can do it for you — right from Claude.** Primate Vision ships an MCP server, llms.txt, markdown docs twins, and a sandbox key available in a single POST — your agent can get a key, upload a clip, and read back a verdict without a human touching a dashboard.

For 24/7 monitoring and camera fleets: [see our enterprise plans](https://primateintelligence.ai/pricing#enterprise).

---

*Method note: every Google Video Intelligence claim traces to Google's live docs, pricing page, quotas, deprecations, and SLA pages accessed 2026-07-31. Estimates are labeled.*
