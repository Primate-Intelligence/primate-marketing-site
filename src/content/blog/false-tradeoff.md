---
title: "The False Tradeoff in Computer Vision"
slug: "false-tradeoff-computer-vision"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-05-08"
readTime: "5 min read"
tags: ["Perspective", "JEPA"]
status: "draft"
excerpt: "For five years, CV teams have been forced to choose between reliable (but rigid) detection and flexible (but unreliable) VLMs. That tradeoff is an artefact of architecture, not an inherent property of the problem."
---

For the last five years, every computer vision team I've talked to has been stuck in the same impossible choice.

You can have a model that's **reliable** — same input, same output, every time. That's YOLO. It'll detect your person or your car with rock-solid consistency. But it can't tell you what that person is doing, and it never will. You've hit its ceiling.

Or you can have a model that's **flexible** — capable of answering open-ended questions about what's happening in a scene, handling novel scenarios it wasn't explicitly trained for. That's a VLM. And it's impressive until the same footage queried on Tuesday returns different results than it did on Monday, and you realise you can't build an alerting system on a model that argues with itself.

Most engineers I know have tried both. They end up with YOLO for anything that needs to be trusted, and a VLM for demos and search interfaces where a human reviews the output anyway.

The assumption underneath both choices is that these two properties — reliability and flexibility — are in fundamental tension. That architecture forces you to trade one for the other.

**That assumption is wrong.**

---

## Why the tradeoff exists

VLMs are generative models. They produce output by sampling from probability distributions — that's not a bug, it's the architecture. When you ask the same question twice and get two different answers, that's the model doing exactly what it was built to do. You can set temperature to zero, add structured output constraints, run guardrails — and you'll reduce variance. But you can't make a generative model behave like a deterministic function without removing the thing that makes it generative.

The reliability ceiling of VLMs isn't an engineering problem waiting to be solved. It's an architectural property. Every model release benchmarks against hallucination reduction and every year the numbers improve — but the underlying mechanism remains the same. The market has been mistaking an architectural ceiling for an engineering backlog.

YOLO-class models have the opposite problem. They're deterministic by design — same input always produces the same output. But they're detectors, not understanders. They see objects. They don't see actions, relationships, or sequences. "Person detected" and "person has been stationary in a restricted zone for 90 seconds" are different statements, and YOLO can only make the first one.

So the market split. VLMs for understanding (with human review). YOLO for alerting (with rigid, pre-trained classes). And a growing pile of custom post-processing glue connecting the two.

---

## The JEPA insight

The reason this tradeoff exists is specific: pixel-space prediction forces generative behaviour. To predict what a frame will look like, you have to generate pixels — and pixel generation is inherently probabilistic.

Joint Embedding Predictive Architecture (JEPA) takes a different approach. Rather than predicting what the next frame looks like, it predicts what the next state *means* — in a learned representation space, not pixel space. The model builds an internal understanding of what's happening and uses that understanding to predict forward. There's no pixel generation. No sampling from a distribution of possible futures. Just a deterministic prediction in representation space.

This is why Yann LeCun has spent years arguing that JEPA is the right path to physical world understanding. It's not that JEPA is better at generating images — it's that JEPA isn't generating images at all. It's reasoning about what happens.

The practical consequence: a JEPA-based model produces the same output for the same input, every time. Not because we constrained it to — because it's making a prediction, not drawing from a distribution.

And because JEPA reasons about representations rather than classes, it generalises. You can ask it an open-ended question in natural language and get a structured, deterministic answer back. The flexibility and the reliability come from the same architectural property, not despite each other.

---

## What this means for production CV

If you're building a CV system that needs to alert on events, you need a model you can set a threshold on. If your confidence score for the same event varies between 0.72 and 0.94 depending on when you run the query, you cannot set a reliable threshold. You will either miss events or flood your operators with false positives. The human stays in the loop not because you want them there — but because the model can't be trusted to act alone.

The engineers I've spoken to don't say "I need better AI." They say "I need to set a threshold once and trust it forever." They're describing the precondition for autonomous operation, and they've concluded it's not achievable with current architectures.

JEPA changes that calculus. Not because it's a better detector, and not because it's smarter — but because it doesn't confuse generation with understanding.

The false tradeoff between reliability and flexibility was always an artefact of pixel-space prediction. We built Primate Vision on the bet that the right architecture resolves it entirely.

I'll have benchmark numbers to back this up at launch. Until then: this is the argument from first principles.

*Primate Vision is a JEPA-based video inference API. It accepts open-ended natural language queries and returns deterministic, structured results. Early access launching May 2026.*
