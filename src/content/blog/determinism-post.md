---
title: "Why 'Deterministic' Matters More Than Accuracy in Production CV"
slug: "deterministic-cv-matters"
author: "Mehdi Nikkhah"
authorInitials: "MN"
date: "2026-05-24"
readTime: "6 min read"
tags: ["Engineering", "Infrastructure"]
status: "draft"
excerpt: "Production CV systems don't just need models that are accurate. They need models that are predictable. Here's why that's a harder problem."
---

CV research is obsessed with accuracy. COCO mAP. Top-1 on ImageNet. Action recognition on Kinetics. These numbers get published, compared, cited. A paper gets rejected if the number isn't better than the prior state of the art.

Production systems don't care about that number the way you'd expect. Engineers who deploy real systems have told us, consistently, that accuracy is necessary but not sufficient. There's a second property they care about just as much, and almost no CV paper measures it: determinism.

## Benchmark accuracy and production accuracy are different numbers

A benchmark accuracy score measures performance on a held-out test set drawn from the same distribution as the training data. That's a reasonable thing to measure during research. It's a poor proxy for production, for three reasons.

**Distribution shift.** Your production data drifts from the training distribution — camera types change, lighting changes, the physical environment changes. A model that scores 94% mAP on a benchmark can silently drop to 71% on your specific deployment, with no error message telling you it happened. Benchmarks measure performance on *a* distribution. Production needs performance on *your* distribution.

**Silent failure.** Most CV models fail silently. When the model is wrong, it doesn't raise an exception — it returns a confident-looking output anyway. Nothing in that output distinguishes "I classified this correctly" from "I produced a plausible-sounding guess." The only way to catch that is comprehensive evaluation against ground truth, which most teams don't have for their specific deployment.

**The lab-to-field gap.** Benchmark conditions are controlled: someone hand-selected the test footage, checked the annotations, standardized the protocol. Production cameras are pointed by whoever installed them, at whatever the customer wanted monitored, in whatever light exists on-site. The benchmark tested one kind of performance. Production tests a different one.

## What determinism actually means

Determinism has a precise definition: the same input always produces the same output.

That sounds obvious. It's not trivially achievable.

Generative and VLM-based vision models are non-deterministic by construction. Autoregressive models sample from a probability distribution at each generation step. Set temperature to zero and you reduce the variance — you don't eliminate it, because numerical precision differences across hardware and driver versions still produce subtly different results. Above temperature zero, variance is guaranteed, not possible.

Why does this matter? Because you need to test your system, and tests need to reproduce. If your camera pipeline passes its test suite Monday and fails Tuesday on the same inputs, you're not debugging a bug. You're debugging noise.

## Why non-determinism is fatal for alerting

Security systems generate alerts. Alerts page humans. False positives cause alert fatigue, which causes operators to start ignoring alerts, which defeats the point of having a system.

Now run that with a non-deterministic model underneath. You tune your alert threshold Monday. Tuesday, the same footage produces a different output distribution — not because the scene changed, but because the model's sampling did. Your false-positive rate shifts under you. So does your operators' trust in the system.

A security integrator we spoke with during customer discovery described the exact failure mode: their VLM classified the same person on the same footage as "loitering" in one run and "standing" in the next. When they asked which classification was correct, there was no answer. Neither was more correct than the other — the model had no ground truth preference, just a different sample.

That's not an edge case. It's the design consequence of putting stochastic inference in an alerting pipeline. The fix isn't better tuning. It's a different architecture.

## How JEPA gets you determinism for free

JEPA-based models predict in latent representation space, not pixel space. The predictor maps an observed representation to a predicted representation — a deterministic function. Same input vector, same output vector, every run.

There's no sampling and no temperature parameter to set to zero and hope. The model's uncertainty about a scene lives in the confidence score attached to the output, not in variance across runs. Two passes over the same clip return the same JSON with the same confidence values, because the predictor is a feed-forward network on fixed vectors, not a distribution you draw from.

This is a structural property, not a post-processing patch.

## What we guarantee, precisely

We want to be exact about the boundary of this claim, because "deterministic" gets abused in marketing.

**We guarantee**: identical output for identical input video, on the same model version, on the live Darwin production API. Verified against `api.primateintelligence.ai` — every streaming response carries a timing block (`inference_ms`, `session_fps`) so you can watch this in production, not take our word for it.

**We don't guarantee** identical output across model version upgrades. When we ship a new Darwin version, outputs may change; we version the API and give notice ahead of breaking changes.

**We don't guarantee** bit-identical floating point across every GPU architecture. There are least-significant-bit differences between hardware generations that in practice sit below the threshold of operational significance — they don't flip a verdict.

Edge cases — degraded video, unusual scenes, camera configurations far outside the training distribution — produce lower confidence scores. Build your alert logic on the confidence threshold, not on the label alone. That's what the confidence field is for.

## The receipts

Full measured latency and accuracy numbers — not estimates — are on [/performance](/performance): 45ms p50 per-frame inference, 11.8 fps sustained analysis, measured against the live production API on 2026-07-30. Darwin's published benchmark scores (Something-Something V2, Kinetics-700, ImageNet-1K) are in the [benchmarks post](/blog/darwin-video-jepa-benchmarks).

Get a sandbox key with one `POST` — no signup — and run this test on your own footage: `curl -s -X POST https://api.primateintelligence.ai/v1/sandbox`.

---

*Mehdi Nikkhah is co-founder and CTO of Primate Intelligence.*
