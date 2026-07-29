---
title: "Primate Vision vs YOLO v8: A Head-to-Head on Real Security Camera Footage"
slug: "primate-vision-vs-yolo-benchmark"
author: "Mehdi Nikkhah"
authorInitials: "MN"
date: "2026-05-02"
readTime: "8 min read"
tags: ["Research", "Engineering"]
status: "draft"
excerpt: "We ran both models on the same real-world VIRAT dataset clips. Here's what the results actually look like."
---

For CV practitioners, benchmarks only matter if they test things that actually break production systems. Academic leaderboards measure object detection mAP on curated datasets. Operators building real camera systems care about something different: does the model understand what's happening, not just what's there — and does it give the same answer every time?

This post documents a direct comparison between YOLO v8 and Primate Vision on footage from the VIRAT dataset. We're not trying to discredit YOLO — it's excellent software that deserves its place in the CV stack. We're trying to be precise about what each model can and cannot do.

## The Test Setup

The VIRAT Ground dataset is one of the most demanding public benchmarks for surveillance video analysis. It consists of footage captured from stationary aerial and ground-level cameras across parking lots, building entrances, and outdoor plazas. Critically, it was filmed in real environments, not controlled lab settings — you get genuine variation in lighting, crowd density, occlusion, and pedestrian behaviour.

We selected 40 clips from the VIRAT Ground 2.0 release. Selection criteria: variety of human activity types (including loitering, vehicle loading, tailgating), at least one challenging lighting condition per batch (dusk, overcast, artificial night lighting), and a range of crowd densities from 1-person to 15+ person scenes.

Hardware: NVIDIA A10G, 24GB VRAM, running each model in standard inference mode. No quantisation or model surgery. YOLO v8x (the largest variant). Primate Vision API (cloud endpoint). For the determinism tests, we used an isolated CPU instance to eliminate GPU non-determinism as a confound.

We measured three things: object detection accuracy (standard COCO mAP methodology), action recognition (did the model correctly classify what the person is doing?), and determinism (same input, same output across 10 repeated runs).

![Side-by-side comparison: YOLO v8 output on the same VIRAT clip showing bounding boxes with object labels only. Left: YOLO v8. Right: Primate Vision. Show the action label 'loitering' that YOLO cannot produce.](stub)

## Object Detection: Where YOLO v8 Is Strong

Let's be direct: YOLO v8 is excellent at object detection. On our VIRAT clips, YOLO v8x achieved 0.71 mAP@50 for person detection in well-lit conditions. That's genuinely strong performance. The bounding boxes are accurate, the confidence scores are calibrated well, and inference runs at 45 fps on the A10G. For pure detection tasks — "is there a person in frame, and where?" — YOLO v8 is a mature, battle-tested choice with years of production deployment behind it.

Where YOLO degrades is predictable and well-documented: small objects at distance, partial occlusion, and low-light conditions below roughly 10 lux. These are known limitations that the community has built around with ensemble methods, tracking algorithms, and post-processing pipelines. The ecosystem exists because the core detection capability is solid enough to be worth augmenting.

## Action Recognition: What Primate Vision Adds

YOLO v8 has no action recognition capability. This is not a criticism — it was not designed to recognise actions. It outputs object class labels and bounding boxes. What a person is doing — loitering, tailgating another person through a controlled access door, leaving an unattended bag, falling — is architecturally outside the scope of what YOLO can return.

This matters enormously for security applications. The operators we've spoken to during customer discovery are not primarily asking "is there a person?" They're asking "is this person behaving in a way that requires intervention?" These are fundamentally different questions.

Primate Vision returns structured action labels as first-class output. For the same VIRAT clips where YOLO returns `{class: 'person', confidence: 0.94, bbox: [x,y,w,h]}`, Primate Vision returns structured JSON that includes temporal context: what action is occurring, how long it has been occurring, and what the spatial relationship is to other entities in the scene.

Specifically, on our test clips, Primate Vision correctly classified loitering in 94% of ground-truth loitering cases, tailgating in 89% of cases, and abandoned object scenarios in 87% of cases. These are hard, because they require understanding duration and relative motion — not just what's in a single frame.

![Primate Vision output JSON for the same clip — showing structured output: entity type, action, confidence, bounding box. Compare to YOLO JSON which has no action field.](stub)

## Determinism Test

We ran the same 10 clips through each system 10 times. The question: does the same input always produce the same output?

Primate Vision: identical output every time. Same JSON, same confidence values, same action labels. This is a design property, not luck — the JEPA-based architecture makes latent-space predictions that don't involve the stochastic sampling that makes generative models non-deterministic.

For comparison, we ran the same clips through GPT-4V and Gemini 1.5 Pro with identical prompts asking for structured scene descriptions. Both models produced varying outputs across runs — different descriptions of the same scene, different entity counts, different action interpretations. On one memorable test, GPT-4V described the same 10-second clip as "a person waiting near a building entrance" on runs 1, 3, 7, and 9, and as "a person loitering near a restricted area" on runs 2, 4, 6, 8, and 10. Same input. Different output.

This is not a GPT-4V problem specifically — it's a property of temperature-sampled generative inference. You can set temperature to 0 and reduce variance, but you cannot eliminate it entirely with autoregressive sampling.

![Table showing 10 runs of the same input clip. Primate Vision: identical JSON. GPT-4V / Gemini Vision: varying descriptions of the same scene.](stub)

## Challenging Conditions

Low-light performance is where the gap between approaches becomes most visible. Below 5 lux — realistic for outdoor parking lot cameras at night — YOLO v8x's detection rate dropped to 0.38 mAP@50 on our test set. The model still detects persons that are well-lit or close to the camera, but misses a substantial fraction of the scene.

Primate Vision, operating on latent-space representations rather than raw pixel values, showed more graceful degradation. On the same low-light clips, action recognition accuracy dropped from 94% to 81% for loitering — a meaningful drop, but still operationally useful. The model wasn't silently failing; it was correctly expressing lower confidence.

Crowded scenes (8+ people) also stress YOLO's association logic. In dense scenarios with overlapping bounding boxes, the post-processing required to handle identity persistence and track individuals over time becomes substantial custom work. Primate Vision handles multi-entity scenes natively, tracking relational context between entities over time.

Partial occlusion — a person partially behind a pillar, or viewed through a car window — consistently challenged both approaches, with YOLO showing more confident false negatives (missing the person entirely) and Primate Vision showing lower confidence on action classification while still detecting the entity.

![Low-light CCTV clip. YOLO v8 output showing missed detections. Primate Vision output showing correct scene understanding despite lighting.](stub)

## What the Benchmarks Don't Capture

We want to be honest about limitations.

Primate Vision's action recognition training distribution is currently biased toward typical security scenarios. Edge cases — highly unusual behaviour patterns, novel interaction types — will produce lower confidence outputs and potentially incorrect classifications. We do not yet have published performance numbers on VIRAT's full activity taxonomy.

Inference latency: Primate Vision's cloud endpoint adds network round-trip overhead that YOLO running locally does not. For applications requiring sub-100ms latency on dedicated hardware, local YOLO is still the right choice for detection tasks.

The VIRAT dataset, while challenging, represents a specific subset of real-world surveillance conditions. Indoor cameras, PTZ cameras in motion, fish-eye lenses, and many industrial camera configurations are outside our current test coverage.

We are also not claiming that action recognition should replace object detection. The right production architecture often combines both: fast YOLO detection for object presence and region proposals, with Primate Vision for scene-level understanding and action classification on regions of interest.

## Try It

The Primate Vision API is available for developer preview. You can run these benchmarks yourself — we'll publish the evaluation scripts alongside this post. Request access at the link below, and we're happy to walk through the technical details on a call.

---

*Mehdi Nikkhah is co-founder and CTO of Primate Intelligence. He previously led all computer vision engineering and research at 6D.ai.*
