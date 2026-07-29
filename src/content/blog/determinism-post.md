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

CV research is obsessed with accuracy. COCO mAP. Top-1 on ImageNet. Action recognition accuracy on Kinetics. These numbers are published, compared, cited. Papers are rejected if the numbers aren't better than the prior state of the art.

Production CV systems don't care about these numbers in the way you might expect. Engineers deploying real systems have told us, consistently, that accuracy is necessary but not sufficient — and that there's a second property they care about just as much, which almost no CV research paper measures: determinism.

## What Accuracy Means in a Benchmark vs Production

A benchmark accuracy number measures performance on a held-out test set that was drawn from the same distribution as the training data. This is a reasonable thing to measure during research. It's a poor proxy for production performance for three reasons.

The distribution shift problem: your production data will drift from the training distribution. Camera types change. Lighting conditions change. The physical environment changes. A model that achieves 94% mAP on a benchmark can silently drop to 71% on your specific deployment without any error messages. Accuracy benchmarks measure performance on a distribution. Production requires performance on your distribution.

The silent failure problem: most CV models fail silently. When the model is wrong, it doesn't raise an exception. It returns a confident-looking output. There's no signal in the output that distinguishes "I correctly classified this" from "I hallucinated a plausible-sounding classification." The only way to catch silent failures is comprehensive evaluation against ground truth — which requires labelled ground truth that most production teams don't have for their specific deployment.

The "it worked in the lab" problem: benchmark conditions are controlled. Someone carefully selected the test footage, made sure the annotations were correct, ensured the evaluation protocol was standardised. Production cameras are pointed by whoever installed them, at whatever the customer wanted to monitor, in whatever lighting conditions exist at that site. The benchmark tested for a specific kind of performance. Production tests for a different kind.

## What Determinism Actually Means

Determinism has a precise definition: the same input always produces the same output.

This sounds obvious. It's not trivially achievable.

For generative and VLM-based vision models, non-determinism comes from temperature sampling during inference. Autoregressive models generate output token by token, sampling from a probability distribution at each step. Even with temperature set to 0, numerical precision issues across different hardware configurations and driver versions can produce subtly different results. With any temperature above 0, variance is guaranteed.

For CV models that use stochastic inference techniques — MC Dropout, certain data augmentation approaches applied at inference time — the outputs are inherently probabilistic. Running the same input through twice produces different results.

Why does this matter in practice? Because you need to test your system, and tests need to be reproducible. If your security camera system passes its test suite on Monday and fails on Tuesday on the same test inputs, debugging is very hard.

![Table: 3 columns. Model | Run 1 output | Run 2 output (same input). Row 1: GPT-4V — different scene descriptions. Row 2: Gemini Vision — different scene descriptions. Row 3: Primate Vision — identical JSON output.](stub)

## Why Non-Determinism Is Fatal for Alerting Systems

Security camera systems generate alerts. Alerts page human operators. False positives cause alert fatigue, which causes operators to ignore alerts, which defeats the purpose of having a system.

Now consider what happens when your underlying model is non-deterministic. You tune your alert threshold on Monday. On Tuesday, the model produces a different distribution of outputs for the same camera footage — not because anything in the environment changed, but because the model's stochastic inference produced different results. Your false positive rate shifts. Your alert fatigue profile changes. Your operators' trust in the system degrades.

The specific failure mode that breaks production systems is this: the same 60 seconds of footage, run through your alerting system twice, produces different alert outcomes. A security integration customer we spoke to during development described exactly this problem — their VLM-based system "loitering" and "standing" for the same person on the same footage, depending on which run they were in. When the customer asked which classification was correct, there was no answer.

This is not an edge case. It's a design consequence of using non-deterministic inference in an alerting pipeline. The fix isn't better tuning. It's deterministic inference.

## How JEPA Achieves Determinism

JEPA-based models make predictions in latent representation space, not in pixel space. The predictor maps from observed latent representations to predicted latent representations. This is a deterministic function: the same input vector produces the same output vector, every time.

There's no sampling. There's no temperature. The model's uncertainty about a scene is expressed in the confidence score associated with the output, not by producing different outputs on different runs. Two runs of the same clip produce the same JSON with the same confidence values.

This is a design property of the architecture, not something achieved through post-processing. The JEPA predictor is a feed-forward network operating on fixed vector representations. Determinism is a consequence of the model's structure.

The technical deep-dive on how JEPA works, and why the latent-space objective enables this, is in the architecture explainer post linked below.

## The Reliability Floor

We want to be precise about what we guarantee and what we don't.

We guarantee: identical JSON output for identical input video, across runs on the same hardware configuration and model version. This means your regression tests will pass consistently.

We don't guarantee identical output across model version upgrades. When we update the model, outputs may change — we version the API and give advance notice of breaking changes.

We don't guarantee identical output across hardware configurations. There are floating-point differences between GPU architectures that can affect the least significant bits of confidence scores, though in practice these differences are below the threshold of operational significance.

Edge cases — highly unusual scenes, degraded video quality, camera configurations far outside the training distribution — will produce lower confidence scores. We recommend building alert logic that filters on confidence threshold, not just on action label.

## Try It

The benchmark post covers the determinism test results in detail — 10 runs of the same clip, side by side. If you want to run the test yourself on your own footage, request API access at the link below.

---

*Mehdi Nikkhah is co-founder and CTO of Primate Intelligence.*
