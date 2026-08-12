---
title: "Why LLMs (VLMs, VLAs, Video World Models) Can't Win Physical AGI"
slug: "why-llms-cant-win-physical-agi"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-08-31"
readTime: "7 min read"
tags: ["Perspective", "JEPA"]
status: "draft"
excerpt: "VLMs, VLAs, video world models — dress the transformer up however you like, it's still predicting tokens. Physical AGI needs a model that predicts state, not the next plausible symbol. That's not a scaling problem. It's an architecture problem."
---

Every physical-AI pitch deck I've seen in the last year has the same slide: a language model, wearing a costume. Give it images and call it a VLM. Give it actions and call it a VLA. Give it video frames and call it a world model. Same core mechanism underneath every costume — predict the next token — and a growing pile of evidence that the costume doesn't fix what's broken.

**A model that's fluent about the physical world is not the same as a model that understands it.**

## What "understanding" actually requires

Physical AGI — an agent that can act reliably in the real world — needs one thing above everything else: a model of state that stays consistent as the world changes. Where is the object. What just happened to it. What will happen next if nothing intervenes. That's not a language problem. Language is how humans compress and communicate understanding after the fact. It was never the substrate understanding runs on.

LLMs, and everything built on the same next-token objective, learn a very good approximation of what people say about the world. VLMs learn what people say about images. VLAs learn what people say about actions, then map that onto motor commands. Video world models generate what a frame plausibly looks like next. All four are optimizing the same thing from different angles: produce the most statistically likely next symbol, whether that symbol is a word, a pixel, or a joint angle.

That objective is good at fluency. It is not good at truth. A model trained to be plausible will, under pressure, produce something plausible instead of something correct — every time, because that's literally what it was trained to do. We've all seen a VLM describe the same ten seconds of security footage two different ways on two different runs. That's not a bug that better prompting fixes. It's the architecture doing exactly its job.

## The tell: hallucination gets worse, not better, at the edges

Every generation of these models ships with a hallucination-reduction benchmark and a slide showing the number went down. It has been going down for years. It has never gone to zero, and it never will, because hallucination isn't a training-data gap — it's what a generative model does whenever it's asked a question its training distribution doesn't cleanly answer. Physical AGI lives entirely at those edges. The interesting cases in the real world — the ones that matter for safety, for autonomy, for anything you'd trust to run without a human reviewing every output — are exactly the low-probability, out-of-distribution cases where a next-token predictor is least reliable and most confident it's right.

That's the disqualifying property. Not "these models are still improving." They are. It's that the axis they're improving on — better token prediction — doesn't converge toward the thing physical AGI actually needs, which is a deterministic, verifiable model of what's happening in the world right now.

## What JEPA does differently

Joint Embedding Predictive Architecture doesn't predict tokens, pixels, or words about the scene. It predicts the next state directly, in a learned representation space, with no generative sampling step in between. There's nothing to hallucinate, because there's nothing being generated — the model isn't producing a plausible guess about what it's uncertain of, it's making a deterministic prediction from what it's observed. Not a metaphorical difference. A different loss function, a different training signal, a different failure mode entirely.

This is the argument Yann LeCun has been making since before it was fashionable, and it's the reason we built Primate around JEPA instead of another VLM wrapper. It's not that JEPA is a "better" language model for physical tasks. It's that physical AGI was never a language problem, and every architecture that treats it as one inherits the failure mode that comes with predicting symbols instead of state.

## Where this leaves the LLM ecosystem

To be clear about what I'm not saying: LLMs are extraordinary at what they do, and VLAs will keep getting more useful for narrow, well-specified robotic tasks where the training distribution covers the deployment distribution closely enough. That's a real and valuable category. It's not physical AGI, and calling it that is a category error the entire industry has quietly agreed not to correct, because the funding round is easier to close with the bigger word.

Physical AGI needs a model that gets more certain and more correct as it sees more of the world, not one that gets more fluent at describing it. That's the bet behind JEPA, and it's the bet behind Primate.
