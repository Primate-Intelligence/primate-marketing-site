---
title: "Why Video Understanding Is the Foundation of Physical AGI"
slug: "video-understanding-foundation-physical-agi"
author: "Mehdi Nikkhah"
authorInitials: "MN"
date: "2026-09-04"
readTime: "7 min read"
tags: ["Research", "JEPA"]
status: "draft"
excerpt: "Every physical AGI roadmap eventually has to answer one question: how does the model know what's happening right now? Text can't answer that. Static images can't either. Only video — continuous, causal, temporal — carries the signal a physical agent actually needs."
---

Ask a physical AGI roadmap how the agent perceives the world, and most of them quietly skip the question. They assume perception is solved, or good enough, and spend the roadmap on planning, reasoning, action. That assumption is the mistake.

**An agent can't reason well about a world it doesn't perceive correctly.** And single frames — the unit most vision systems still train and reason on — don't carry the information physical understanding requires.

## What a single frame can't tell you

A photograph tells you what's true at one instant. It can't tell you whether the person in it is sitting down or standing up. Whether the ball is rising or falling. Whether the door is opening or closing. These aren't edge cases — they're the majority of what matters about a physical scene, and they're all defined by change over time, not by any single instant.

This is why frame-by-frame CV systems, and VLMs that reason about video by sampling and captioning individual frames, hit a ceiling that no amount of better image understanding fixes. You can have a perfect classifier for "person" and "door" and still have no idea whether someone is entering or leaving, because that information was never in the frame — it's in the relationship between frames.

Physical AGI needs to act in a world that unfolds causally through time. An agent that can't perceive motion, sequence, and causation isn't perceiving the physical world. It's perceiving a slideshow of it.

## Why language models inherit the same gap

VLMs are usually built by bolting a vision encoder onto a language model, and the vision encoder was almost always trained on static images. Video gets handled by sampling frames and treating them as a sequence of separately-captioned images, then asking the language model to stitch a narrative across the captions. That's a workaround, not a solution — it reconstructs temporal understanding out of independent snapshots, after the fact, in language, which is exactly the lossy compression step that drops the causal signal in the first place.

The result is what you'd expect: models that can describe what's in a frame reasonably well and are unreliable about what's happening across frames. Ask a VLM whether an object was picked up or put down and you're asking it to infer motion from a stack of captions — a much harder and noisier problem than perceiving the motion directly would have been.

## What direct video training gives you

A model trained end-to-end on video — predicting future state directly from a sequence of observations, rather than reasoning about a sequence of independently-captioned stills — learns something categorically different. It learns dynamics: how objects move, how actions unfold, what physically plausible continuations look like, because the training signal itself is temporal. Trajectory, not snapshot.

This is the argument for treating video as the primary modality for physical understanding rather than an awkward extension of image understanding. The physical world isn't a stream of independent moments loosely correlated by captions. It's a continuous causal process, and the model that's going to reason well about it needs a training objective that respects that structure from the start.

## Why this has to be the foundation, not a feature

You can't retrofit temporal reasoning onto a system built for static perception any more than you can retrofit real-time reasoning onto a batch-processing pipeline. The architecture has to be built around the fact that state changes and causes propagate forward, from the first design decision. That's a foundation-level choice, not a feature you add in a later version.

This is why Darwin — our JEPA video model — is trained directly on video sequences, predicting future representations from past observations, rather than treating video as a sequence of images with captions layered on top. It's the same reason we think video understanding, done correctly at the architecture level, isn't one capability among many for physical AGI. It's the capability everything else gets built on. An agent that can't perceive causally can't plan causally, and an agent that can't plan causally isn't going to operate reliably in the physical world, no matter how good its language model is.
