---
title: "Why We Stopped Trying to Make VLMs Smarter"
slug: "why-we-stopped-vlms"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-05-03"
readTime: "6 min read"
tags: ["Perspective", "Founding"]
status: "draft"
excerpt: "We spent six months trying to make vision language models work for real CV pipelines. Then we stopped."
---

It was a parking lot in San Jose. Fifteen seconds of footage. We ran it through GPT-4V three times in a row, same prompt, asking it to identify what the person near the loading dock was doing.

Run one: "A person appears to be waiting near a delivery entrance."

Run two: "The individual is standing near what appears to be a warehouse loading area, possibly waiting for a vehicle."

Run three: "A person is loitering near a restricted access point. This may warrant attention."

Three interpretations of the same fifteen seconds. One of them flagging a security concern. The other two describing the same behaviour as benign. This was the moment Mehdi and I looked at each other and said: we cannot build a product on this.

## What we tried

We spent roughly six months — mid-2025 into early 2026 — trying to make VLMs reliable enough for production CV pipelines. Not a casual evaluation. Fine-tuning on domain-specific data. Structured output schemas with JSON mode. Multi-shot prompting with worked examples. Ensemble approaches, running multiple VLMs and taking consensus. Temperature zero with top-p constraints.

Some of it helped. Fine-tuning on security camera footage improved action recognition meaningfully. Structured output schemas cut format variance. None of it solved the actual problem: the same input didn't reliably produce the same output.

The variance wasn't random noise. It was coherent, confident, and sometimes dangerous. The model would produce a plausible-sounding analysis that was simply wrong, with no reliable way to tell wrong from right. The confidence scores weren't calibrated to reality.

## What CV engineers actually want

During this period we talked to a lot of CV engineers building production surveillance and security systems, and the pattern in what they said was striking.

Nobody was asking for "more impressive." Nobody wanted a model that could write a poetic scene description. What they wanted, consistently, was reliability. Determinism. Predictable failure modes. The ability to write a test suite and have it actually pass.

One engineer at a large physical security integrator put it directly: "I can build around a model that gets 85% accuracy if I know exactly when it fails. I cannot build around a model that gets 95% accuracy but fails randomly."

Another had abandoned a VLM-based approach after three months of integration work, because they couldn't write a regression test. The model's outputs on the same test footage drifted between code releases.

That's the core CV engineering reliability problem: stochastic inference is incompatible with production alerting. You can tolerate imperfect accuracy. You cannot tolerate non-deterministic behaviour in a system that pages a human at 3am.

## The JEPA pivot

Yann LeCun's work on Joint-Embedding Predictive Architectures had been on my radar since 2022, but it read as research-stage — interesting theory, years from anything practical. What changed was Meta releasing V-JEPA 2 in early 2025 and demonstrating something that hadn't existed before: 62 hours of robot interaction data was sufficient for zero-shot planning on novel physical tasks. A data efficiency number that shouldn't have been possible.

The specific JEPA property that kills the hallucination problem: the model predicts in latent representation space, not pixel space. A generative model predicting what happens next in a video has to commit to specific pixel values — the exact position of a shadow, the precise motion blur on a moving hand. Those details are unpredictable in real environments, so the model has to hallucinate them, and the hallucinated pixels contaminate the semantic understanding.

JEPA sidesteps that entirely. The predictor never has to produce pixels. It predicts representations — abstract patterns of scene structure. It can say "the person's trajectory is consistent with loitering" without rendering what that looks like pixel by pixel. The pixel-level uncertainty never propagates into the semantic classification.

That's why JEPA-based models can be deterministic. Latent-space predictions don't involve temperature sampling. Same input, same representation, same output.

## What we built

Mehdi and I spent the past year building Darwin, our JEPA video model — trained on a cluster of just 8 H100 GPUs over three weeks, using roughly 100x less data than comparable V-JEPA 2 efforts. It matches or exceeds V-JEPA-class models on standard downstream benchmarks (~73% on Something-Something V2, ~78% on Kinetics-700, ~88% on ImageNet-1K, linear probe), and it's light enough to run in real time on a single commodity CPU. [Full numbers here.](/blog/darwin-video-jepa-benchmarks)

Primate Vision is the API built on top of Darwin. Point it at a video clip or a live stream, ask a question in plain language, get back a deterministic verdict with a calibrated confidence score and timestamped evidence — same input, same output, every time. It's live now, not a demo: measured p50 45ms per-frame inference, 11.8 fps sustained, against the production API — the numbers are on [/performance](/performance) and you can reproduce them yourself.

If you're already running a YOLO-based pipeline, adding it is one API call in your post-processing step. The output is structured JSON designed to slot straight into alerting logic, no natural-language parsing layer required.

## What we learned about timing

I spent a decade working on AR Cloud technology at 6D.ai — spatial computing infrastructure that required understanding the physical world in real time. That taught me something uncomfortable: being technically right too early is just being wrong. The ecosystem has to be ready, the hardware has to be capable, and the adjacent technology that makes your thing actually work has to exist.

With AR Cloud, we were building while the fundamental compute and connectivity infrastructure was still being laid. With JEPA-based CV, it feels different. The base models exist. The academic validation is solid. The hardware — Jetson Orin, the broader edge AI ecosystem — is mature enough to run it. Customer discovery confirms the pain is real and acute.

The question isn't whether JEPA-based scene understanding is technically feasible. It is. The question was whether we could build a reliable API on top of it that CV engineers could actually ship with. That's what Primate Vision is.

## What's next

If you're building a security camera application and you're tired of writing custom action-classification logic on top of YOLO, get a sandbox key with one call — no signup — and run it against your own footage: `curl -s -X POST https://api.primateintelligence.ai/v1/sandbox`.

---

*Matt Miesnieks is CEO and co-founder of Primate Intelligence. Previously co-founder of 6D.ai (acquired by Niantic) and Dekko.*
