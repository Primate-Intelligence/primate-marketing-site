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

Three different interpretations. One of them flagging a security concern. The other two describing the same behaviour as benign. This was the moment Mehdi and I looked at each other and said: we cannot build a product on this.

## What We Tried

We spent roughly six months — from mid-2025 into early 2026 — exploring whether VLMs could be made reliable enough for production CV pipelines. This wasn't a casual evaluation. We tried fine-tuning on domain-specific data. We tried structured output schemas with JSON mode. We tried multi-shot prompting with worked examples. We tried ensemble approaches — running multiple VLMs and taking consensus outputs. We tried temperature zero with top-p constraints.

Some of these approaches helped. Fine-tuning on security camera footage improved action recognition accuracy meaningfully. Structured output schemas reduced format variance. But none of them solved the fundamental problem: the same input didn't reliably produce the same output.

The variance wasn't random noise. It was coherent, confident, and sometimes dangerous. The model would produce a plausible-sounding analysis that was just wrong — and there was no reliable way to detect when it was wrong versus when it was right. The confidence scores weren't calibrated to reality.

## What CV Engineers Actually Need

During this period, we talked to a lot of CV engineers building production surveillance and security systems. The pattern in what they said was striking.

Nobody was asking for "more impressive." Nobody wanted the model that could write a poetic description of a scene. What they wanted, consistently, was: reliability. Determinism. Predictable failure modes. The ability to write a test suite and have it pass.

One engineer at a large physical security integrator put it directly: "I can build around a model that gets 85% accuracy if I know exactly when it fails. I cannot build around a model that gets 95% accuracy but fails randomly."

Another told us they had abandoned a VLM-based approach after three months of integration work, because they couldn't write a regression test. The model's outputs on the same test footage drifted between code releases.

This is the core CV engineering reliability problem: stochastic inference is incompatible with production alerting systems. You can tolerate imperfect accuracy. You cannot tolerate non-deterministic behaviour in a system that pages humans at 3am.

![Screenshot of a VLM API response for the same security camera query sent 3 times — showing three different descriptions of the same scene. Captions: Run 1, Run 2, Run 3.](stub)

## The JEPA Pivot

Yann LeCun's work on Joint-Embedding Predictive Architectures had been on my radar since 2022, but it read as research-stage — interesting theory, years from practical application. What changed was Meta releasing V-JEPA 2 in early 2025 and demonstrating something that hadn't existed before: 62 hours of robot interaction data was sufficient for zero-shot planning on novel physical tasks. That's a data efficiency number that should have been impossible.

The specific property of JEPA that addresses the hallucination problem is this: the model learns to predict in latent representation space, not in pixel space. When a generative model predicts what happens next in a video, it has to commit to specific pixel values — the exact position of a shadow, the precise motion blur on a moving hand. These details are inherently unpredictable in stochastic environments, so the model has to hallucinate them. And those hallucinated details contaminate the semantic understanding.

JEPA sidesteps this entirely. The predictor never has to produce pixels. It predicts representations — abstract patterns of scene structure. The model can say "the person's trajectory is consistent with loitering" without having to render what that looks like pixel-by-pixel. The uncertainty in low-level pixel details doesn't propagate into the semantic classification.

This is why JEPA-based models can be deterministic. The latent-space predictions don't involve temperature sampling. Same input, same representation, same output.

![Diagram: JEPA architecture vs pixel-reconstruction architecture. Left: 'predict pixels → hallucinate'. Right: 'predict in latent space → no pixel commitment'. Simple, clean, labeled.](stub)

## What We Built

Primate Vision is a scene understanding API built on a JEPA foundation. You give it a video clip or live RTSP stream. It returns structured JSON describing what is happening — entity types, actions, confidence, temporal context, spatial relationships. Same input, same output, every time.

The integration surface is deliberately minimal. If you're already running a YOLO-based pipeline, adding Primate Vision is a single API call in your post-processing step. The output schema is designed to slot directly into alerting logic without requiring a natural language parsing layer.

## What We Learned About Timing

I spent a decade working on AR Cloud technology at 6D.ai — spatial computing infrastructure that required understanding the physical world in real-time. That experience taught me something uncomfortable: being technically right too early is just being wrong. The ecosystem has to be ready, the hardware has to be capable, and the adjacent technology that makes your thing actually work has to exist.

With AR Cloud, we were building while the fundamental compute and connectivity infrastructure was still being laid. With JEPA-based CV, the situation feels different. The base models exist. The academic validation is solid. The hardware — Jetson Orin, the edge AI ecosystem — is mature enough to run it. The customer discovery confirms the pain is real and acute.

The question isn't whether JEPA-based scene understanding is technically feasible. It is. The question is whether we can build a reliable API on top of it that CV engineers can actually ship with. That's what we're working on.

## What's Next

We're in developer preview now. If you're building a security camera application and you're tired of writing custom action classification logic on top of YOLO, we'd like to talk. Request access at the link below — we're doing hands-on onboarding with the first cohort of teams.

---

*Matt Miesnieks is CEO and co-founder of Primate Intelligence. Previously co-founder of 6D.ai (acquired by Niantic) and Dekko.*
