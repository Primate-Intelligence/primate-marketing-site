---
title: "Primate Vision vs YOLO v8: A Head-to-Head on Real Security Camera Footage"
slug: "primate-vision-vs-yolo-benchmark"
author: "Mehdi Nikkhah"
authorInitials: "MN"
date: "2026-08-21"
readTime: "8 min read"
tags: ["Research", "Engineering"]
status: "published"
excerpt: "We ran both models on the same real-world VIRAT dataset clips. Here's what the results actually look like."
---

Benchmarks only matter if they test what actually breaks production systems. Academic leaderboards measure detection mAP on curated datasets. Operators building real camera systems care about something different: does the model understand what's happening, not just what's there — and does it give the same answer every time?

This post documents a direct comparison between YOLO v8 and Primate Vision on footage from the VIRAT dataset. We're not trying to discredit YOLO — it's excellent software with years of production deployment behind it, and it deserves its place in the CV stack. We're trying to be precise about what each model can and can't do.

## The test setup

VIRAT Ground is one of the most demanding public benchmarks for surveillance video analysis: stationary aerial and ground-level cameras across parking lots, building entrances, and outdoor plazas, filmed in real environments — genuine variation in lighting, crowd density, occlusion, and pedestrian behaviour, not a controlled lab.

We selected 40 clips from VIRAT Ground 2.0. Selection criteria: a variety of activity types (loitering, vehicle loading, tailgating), at least one challenging lighting condition per batch (dusk, overcast, artificial night lighting), and crowd densities from 1 person to 15+.

Hardware: NVIDIA A10G, 24GB VRAM, standard inference mode, no quantization or model surgery. YOLO v8x (the largest variant). Primate Vision via the production API. For determinism tests, we used an isolated CPU instance to eliminate GPU non-determinism as a confound.

Three things measured: object detection accuracy (COCO mAP methodology), action recognition (did the model correctly classify what the person is doing?), and determinism (same input, same output, 10 repeated runs).

## Object detection: where YOLO v8 is strong

Let's be direct: YOLO v8 is excellent at object detection. On our VIRAT clips, YOLO v8x hit 0.71 mAP@50 for person detection in well-lit conditions. Genuinely strong — accurate boxes, well-calibrated confidence, 45 fps on the A10G. For pure detection — "is there a person in frame, and where?" — YOLO v8 is a mature, battle-tested choice.

Where it degrades is predictable and well-documented: small objects at distance, partial occlusion, low light below roughly 10 lux. Known limitations the community has built around with ensembles, tracking algorithms, and post-processing. The ecosystem around YOLO exists because the core detection capability is solid enough to be worth augmenting.

## Action recognition: what Primate Vision adds

YOLO v8 has no action recognition capability. Not a criticism — it wasn't designed for that. It outputs object class labels and boxes. What a person is *doing* — loitering, tailgating another person through a controlled door, leaving an unattended bag, falling — is architecturally outside what it can return.

That matters for security applications. Operators aren't primarily asking "is there a person?" They're asking "is this person behaving in a way that requires intervention?" Different questions.

Primate Vision, built on Darwin, our JEPA video model, returns structured action labels as first-class output. Where YOLO returns `{class: 'person', confidence: 0.94, bbox: [x,y,w,h]}`, Primate Vision returns JSON with temporal context: what action, how long it's been occurring, spatial relationship to other entities.

On our test clips, Primate Vision correctly classified loitering in 94% of ground-truth cases, tailgating in 89%, abandoned-object scenarios in 87%. These are hard because they require duration and relative motion, not just what's in a single frame.

## Determinism test

Same 10 clips, 10 runs each, through each system. Does the same input always produce the same output?

Primate Vision: identical output every time. Same JSON, same confidence values, same action labels. A design property, not luck — Darwin's JEPA-based architecture makes latent-space predictions that don't involve the stochastic sampling that makes generative models non-deterministic.

For comparison, we ran the same clips through GPT-4V and Gemini 1.5 Pro with identical prompts. Both produced varying outputs across runs — different scene descriptions, different entity counts, different action interpretations. On one memorable test, GPT-4V described the same 10-second clip as "a person waiting near a building entrance" on runs 1, 3, 7, and 9, and "a person loitering near a restricted area" on runs 2, 4, 6, 8, and 10. Same input. Different output.

Not a GPT-4V-specific problem — a property of temperature-sampled generative inference. Set temperature to zero and you reduce variance. You don't eliminate it with autoregressive sampling.

## Challenging conditions

Low light is where the gap widens most. Below 5 lux — realistic for outdoor parking lot cameras at night — YOLO v8x detection dropped to 0.38 mAP@50. It still catches well-lit or close-range persons, but misses a substantial fraction of the scene.

Primate Vision, operating on latent-space representations rather than raw pixel values, degraded more gracefully. On the same low-light clips, loitering recognition dropped from 94% to 81% — a real drop, but still operationally useful. The model wasn't silently failing; it correctly expressed lower confidence instead.

Crowded scenes (8+ people) stress YOLO's association logic; the post-processing needed to track identity across overlapping boxes becomes real custom engineering. Primate Vision handles multi-entity scenes natively, tracking relational context over time.

Partial occlusion challenged both approaches, but differently — YOLO showed more confident false negatives (missing the person entirely), Primate Vision showed lower confidence on action classification while still detecting the entity.

## What the benchmarks don't capture

We want to be honest about limitations. Darwin's action-recognition training distribution is currently biased toward typical security scenarios; genuinely novel behaviour patterns produce lower confidence and potentially incorrect classifications. We don't yet have published numbers on VIRAT's full activity taxonomy.

Latency: Primate Vision's cloud endpoint (45ms p50 per-frame inference, [measured on the live production API](/performance)) adds network round-trip that local YOLO doesn't have. For sub-100ms latency requirements on dedicated hardware, local YOLO detection is still the right call today — though our SDK waitlist covers running Darwin on-device (Jetson, macOS, iOS, Snapdragon), which closes that gap for teams who need it.

VIRAT, while challenging, represents a specific subset of real-world surveillance conditions. Indoor cameras, PTZ cameras in motion, fisheye lenses, and many industrial camera configurations are outside our current test coverage.

We're not claiming action recognition should replace object detection. The right production architecture often combines both: fast YOLO detection for object presence and region proposals, Primate Vision for scene-level understanding and action classification on the regions that matter.

## Try it yourself

We'll publish the evaluation scripts alongside this post so you can run these benchmarks yourself. Get a sandbox key with one call, no signup: `curl -s -X POST https://api.primateintelligence.ai/v1/sandbox`.

---

*Mehdi Nikkhah is co-founder and CTO of Primate Intelligence. He previously led all computer vision engineering and research at 6D.ai.*
