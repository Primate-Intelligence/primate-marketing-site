---
title: "How JEPA Learns to Predict Scenes Without Reconstructing Pixels"
slug: "jepa-architecture-explainer"
author: "Mehdi Nikkhah"
authorInitials: "MN"
date: "2026-05-10"
readTime: "10 min read"
tags: ["Research", "JEPA"]
status: "draft"
excerpt: "A technical explainer of Joint-Embedding Predictive Architectures and why they're fundamentally different from generative video models."
---

Ask any vision-language model to describe the same video clip twice and you'll hit the hallucination problem firsthand. It's not a bug in the implementation. It's a consequence of the training objective. To see why — and why JEPA is architecturally different — you need to understand what generative video models are actually optimized to do.

## Why pixel-space prediction leads to hallucination

Generative video models learn by predicting what comes next. Given frames 1 through N, predict frame N+1. The training signal is pixel reconstruction loss: how close is the predicted frame to the actual frame?

That sounds clean. It has a fundamental pathology. Real video contains enormous amounts of information that's genuinely unpredictable at the pixel level — the exact position of a shadow moving across a wall, the precise motion blur on a swinging arm, the way light refracts through a window. The model can't predict these correctly, because they're determined by physical processes below the semantic level it's actually trying to learn.

So it learns to hallucinate. When it doesn't know the exact pixel values, it produces something plausible-looking — something that satisfies the reconstruction loss to an acceptable degree. A rational response to an impossible objective.

The problem: hallucinated pixel-level detail contaminates semantic representations. If the model's latent representation of "a person loitering near a door" is entangled with pixel-level specifics — exact values, lighting, camera angle — the representation is brittle. Change the lighting, change the camera position, and it produces a different semantic interpretation.

## The JEPA insight: predict in representation space

Joint Embedding Predictive Architecture, proposed by Yann LeCun's team at Meta AI, changes the objective at the root. Instead of predicting pixels, the model learns to predict representations.

Two key components: an encoder and a predictor. The encoder transforms video frames into a latent representation — a compact, abstract description of the scene. The predictor operates in that space: given the representations of observed regions, predict the representation of masked regions.

Critically, the model never produces pixels. The training loss is computed in representation space — does the predicted representation match the actual one? The model is scored on whether it captured the right abstract structure, not on whether it reproduced exact pixel values.

That sidesteps hallucination at the root. The model doesn't decide what colour the shadow is. It only learns the abstract structure: a shadow in this region at time T implies consistent motion at time T+1, given the light source. Pixel-level uncertainty is never forced into the representation.

The masking strategy matters here. During training, contiguous spatiotemporal blocks are masked — not random pixels, but coherent regions. That forces the model to predict using context, which requires learning causal structure: what's likely to be in this region, given everything else visible.

## Why this matters for physical understanding

The representation-space objective does something pixel-space objectives can't: it lets the model be uncertain at the pixel level while staying confident at the semantic level.

Take a ball rolling toward the edge of a table. A pixel-space model has to predict exactly where the ball will be — exact coordinates, lighting, motion blur — in each subsequent frame. If the trajectory is slightly uncertain, the model produces blurred or averaged pixel predictions, which destroys semantic clarity.

A JEPA model can represent "the ball is on a trajectory to fall off the table" as a confident semantic claim without committing to the exact pixel-level rendering of that fall. The uncertainty lives where it belongs — in the pixel-level detail — while the semantic understanding stays crisp.

That's why JEPA-based models show better-calibrated uncertainty on physical prediction tasks. They're not uncertain about whether something will happen. They're appropriately uncertain about exactly how it'll look when it does.

For CV pipeline engineers this translates directly: the model can be confident that "this person has been stationary near this door for 90 seconds" without needing to be confident about the exact lighting or the person's clothing colour. The semantic claim is separable from the pixel-level rendering.

## The V-JEPA 2 data efficiency result

Meta's V-JEPA 2 paper demonstrated something that deserves careful attention: training on 62 hours of robot interaction data enabled zero-shot planning on novel physical manipulation tasks the model had never seen during training.

A typical pixel-reconstruction video model trained on 62 hours of robot footage would learn to replicate the visual appearance of robot movements — and generalize poorly to novel tasks, because it learned pixels, not physics.

V-JEPA 2 learned representations that captured the causal structure of physical interaction — how objects move when contacted, how spatial relationships evolve, what stable configurations look like. The representation is compact and abstract enough to transfer to tasks that were never in the training data. That's what data efficiency looks like with the right objective.

## Darwin: how far the same idea goes with 100x less data

We took this same JEPA objective and asked a different question than the frontier labs: how far can careful engineering, better training methodology, and better data take us, without assuming we need virtually unlimited compute?

We trained Darwin, our video JEPA model, on a cluster of 8 H100 GPUs over three weeks — roughly 100x less data than comparable V-JEPA 2 efforts. Despite that budget, Darwin matches or exceeds V-JEPA-class models on the standard downstream benchmarks: ~73% on Something-Something V2, ~78% on Kinetics-700, ~88% on ImageNet-1K, all linear probe on a frozen backbone. [Full numbers and methodology.](/blog/darwin-video-jepa-benchmarks)

We also aligned Darwin's embedding space with natural language, so the model can be prompted directly with text to retrieve visual concepts from its learned representations — without training a separate classification head for every task. And because it never needs to produce pixels, it's light enough to run in real time on a single commodity CPU, not just a datacenter GPU.

Darwin is the encoder and predictor. Primate Vision is the API built on top of it: a structured output layer that maps representation-space predictions to action classifications, a temporal context module tracking entity identity and behaviour duration across a clip, and a calibration layer that turns latent-space uncertainty into a calibrated confidence score in the output JSON — designed to be used directly by a CV pipeline without a natural-language parsing layer in between.

It's live in production now. Measured latency (45ms p50 per-frame inference, 11.8 fps sustained) is on [/performance](/performance), reproducible against the real API, not a lab number.

## Limitations and open questions

JEPA is not a solved problem, and we want to be straight about that.

The encoder requires large amounts of unlabelled video to learn useful representations. For highly domain-specific environments — underwater cameras, extreme infrared, satellite imagery — pre-training data may not cover the distribution well, and fine-tuning requires care to avoid collapsing the representation.

Action recognition requires supervised training with temporal annotations on top of the JEPA encoder — the self-supervised objective doesn't hand you action labels for free. Recognition quality is bounded by the coverage and quality of that annotation data.

The spatiotemporal masking that works well for video doesn't transfer trivially to single-image understanding; for applications needing single-frame analysis without temporal context, the data efficiency advantage is smaller.

Long-range temporal dependencies — behaviour playing out over minutes or hours — remain hard. Current JEPA models have limited context windows; tracking patterns over very long horizons needs architectural work beyond the base approach.

## What's next

The [benchmarks post](/blog/darwin-video-jepa-benchmarks) has the full head-to-head numbers against V-JEPA 2 on both accuracy and throughput. If you want to test Darwin on your own footage, get a sandbox key with one call, no signup: `curl -s -X POST https://api.primateintelligence.ai/v1/sandbox`.

---

*Mehdi Nikkhah is co-founder and CTO of Primate Intelligence. Previously led all CV engineering and research at 6D.ai.*
