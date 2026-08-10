---
title: "Introducing Primate Vision"
slug: "introducing-primate-vision"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-08-12"
readTime: "5 min read"
tags: ["Announcement"]
status: "published"
excerpt: "Today we're launching Primate Vision — the first JEPA-based scene understanding API for CV developers."
---

Today we're launching Primate Vision — a real-time video intelligence API built on Darwin, our JEPA video model.

If you build computer vision systems for a living, you already know the choice we've all been stuck with. YOLO-class detectors are reliable and fast, but they only see objects — never what those objects are doing. VLMs can describe a scene in natural language, but ask the same question twice and you'll get two different answers, because generative models sample from a distribution instead of computing a function. You've been picking your poison: rigid and trustworthy, or flexible and unreliable. Never both.

We don't think that's a law of nature. We think it's an artefact of the wrong architecture — pixel-space prediction — and we've spent the last year building the alternative.

## What Primate Vision actually does

Primate Vision takes video — a clip or a live stream — and returns structured, deterministic output: what entities are present, what they're doing, how long they've been doing it, and how confident the model is. Not bounding boxes you have to interpret. Not a paragraph of prose you have to parse. JSON your alerting logic can act on directly.

```json
{
  "entity": "person",
  "action": "loitering",
  "location": { "zone": "entrance", "relative_position": "door_adjacent" },
  "temporal": { "duration_seconds": 94, "first_seen": "T-00:01:34" },
  "confidence": 0.97,
  "deterministic": true
}
```

That `deterministic: true` isn't a marketing flourish. Run the same clip through the API twice and you get the same JSON, byte-identical, because Darwin predicts in representation space, not pixel space — there's no sampling step to introduce variance in the first place. [Why that matters more than raw accuracy.](/blog/deterministic-cv-matters)

## Why JEPA, and why now

Joint Embedding Predictive Architecture — the approach Yann LeCun's team pioneered at Meta — has spent the last two years attracting the kind of investment usually reserved for entire new categories: AMI at a $3.5B valuation, World Labs closing $1B, NVIDIA backing Cosmos. [We wrote about what that means for CV developers specifically](/blog/world-models-market-context), but the short version is: the research community has converged on JEPA-style representation learning as the right path to models that understand physical scenes rather than pattern-match on pixels. We agree, and we built Darwin to prove it works in production, not just in a paper.

Darwin is our video JEPA model — trained on 8 H100 GPUs over three weeks, roughly 100x less data than comparable V-JEPA 2 efforts, and it still matches or exceeds those benchmarks: ~73% on Something-Something V2, ~78% on Kinetics-700, ~88% on ImageNet-1K. [Full numbers.](/blog/darwin-video-jepa-benchmarks) Because it never generates pixels, it's light enough to run in real time on a commodity CPU — not just a datacenter GPU, which matters a great deal once you start thinking about edge deployment on the camera itself instead of a cloud round-trip.

## Built for the pipeline you already have

Primate Vision isn't asking you to rip out your stack. If you're running YOLO for detection today, that's still a reasonable choice for pure "is there a person in frame" questions. Primate Vision slots in for the part that's currently held together with custom glue code: action classification, temporal state tracking, loitering timers, alert deduplication. [Here's what that integration actually looks like](/blog/scene-understanding-security-cameras) — the short version is it collapses dozens of lines of bespoke tracking logic into one API call.

Measured, not estimated: 45ms p50 per-frame inference, 11.8 fps sustained analysis, [live on /performance](/performance) against the real production API, refreshed against real traffic — not a slide from a pitch deck.

## Try it now

No signup, no sales call, no waitlist. Get a sandbox key with one request and run it against your own footage right now:

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/sandbox
```

We built Primate Vision because we were tired of watching good CV teams choose between trustworthy and capable. You shouldn't have to. Go try it, and tell us what breaks.

---

*Matt Miesnieks is CEO and co-founder of Primate Intelligence. Previously co-founder of 6D.ai (acquired by Niantic).*
