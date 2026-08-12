import type { APIRoute } from 'astro';

const SITE = 'https://primateintelligence.ai';

export const GET: APIRoute = () => {
  const body = `---
title: "How JEPA works"
canonical: ${SITE}/technology/how-jepa-works
site: Primate Intelligence
author: Mehdi Nikkhah
---

# How JEPA works

## Do you need words to think?

Heidegger said no.

He used the concept of Dasein, or "being-there," to describe how humans first encounter
the world: through direct, pre-verbal engagement with it. You understand a hammer by using
it, not by reading its definition. Understanding comes from being embedded in a situation,
not from language describing that situation.

That idea maps surprisingly well onto two very different approaches to AI.

Large language models learn from words. They predict the next token in a sequence, and in
doing so they build remarkably powerful models of the world. Their only direct experience,
however, is language. They learn about a hammer through descriptions of hammers, not
through actually interacting with one.

Joint Embedding Predictive Architecture, or JEPA, takes a different approach. It learns
from sensory experience. Instead of predicting the next word or reconstructing every pixel,
it learns representations of the world and predicts how those representations change over
time.

A video is not treated as a sequence of descriptions. It is treated as an experience from
which the model can learn what is happening and what is likely to happen next.

In that sense, JEPA is much closer to the idea of Dasein. The model is trying to understand
the world through its structure and dynamics rather than through language about the world.

That distinction becomes important when we look at vision-language models.

## Vision-Language Models: Seeing the world through language

Vision-language models, or VLMs, connect visual inputs to language. Give a VLM a video and
it can describe what happened, answer questions about it, or reason about what it sees.

The problem is that the model ultimately has to express its understanding through language.
Its output is generated token by token, and the training objective rewards producing a
plausible linguistic answer.

That creates an important distinction between describing the world and modeling the world.

A VLM can say that a person is standing near a door without necessarily maintaining a
stable representation of the physical situation. It can produce a convincing answer even
when its underlying visual representation is incomplete or wrong.

This is one reason hallucination is such a persistent problem. The model is optimized to
produce a good answer, not necessarily to maintain a faithful internal model of what is
happening in the video.

If we want models that learn the dynamics of the physical world, we need to look at
approaches that learn directly from video.

## Generative Video World Models

Generative video models take a different approach. Instead of predicting words about the
world, they predict the visual world itself.

Given frames 1 through N, the model predicts what comes next. The training signal can be
based on how closely the generated video matches the actual future frames.

At first, this seems like exactly what we want. If a model can predict the future,
shouldn't it have to understand the world?

The problem is what it means to predict a video at the pixel level.

Real video contains enormous amounts of information that is difficult, or effectively
impossible, to predict exactly. The precise position of a shadow, the motion blur on a
moving object, small changes in lighting, reflections, and texture can all vary even when
the underlying event is the same.

When there are multiple plausible futures, a pixel-level objective still forces the model
to produce a specific visual outcome.

The result can be a visually plausible prediction that is semantically wrong.

The model also has to spend capacity modeling visual details that may have little to do
with the structure we actually care about. If the goal is to understand that a person is
approaching a door, the exact texture of their clothing or the precise shape of a shadow is
mostly irrelevant.

This raises a fundamental question:

*Should a world model predict exactly what the world will look like, or what is happening
in the world?*

## JEPA: Predicting representations instead of pixels

This is the key idea behind Joint Embedding Predictive Architecture.

Instead of predicting pixels, JEPA predicts representations.

An encoder turns the observed video into a latent representation. A predictor then uses the
visible context to predict the representation of what is missing or what comes next.

The important part is what the model is not asked to predict.

It does not have to reconstruct the exact pixels of a shadow. It does not have to reproduce
every texture or the precise motion blur of a moving arm. The loss is computed in
representation space, so the model is rewarded for capturing the structure that matters.

Consider a ball rolling toward the edge of a table.

A pixel-level model has to predict the exact appearance of the next frames: the ball's
precise position, lighting, texture, motion blur, and everything around it. If there are
multiple plausible ways the scene could evolve, the model has to resolve that uncertainty
at the pixel level.

A JEPA model can instead learn a representation that captures something much more useful:
the ball is moving toward the edge and is likely to fall.

The exact pixels of the future can remain uncertain without making the underlying
representation uncertain.

That is the important distinction. A world model does not necessarily need to predict every
detail of the future. It needs to capture the parts of the future that are predictable and
useful for reasoning.

The masking strategy reinforces this. Rather than removing individual random pixels, JEPA
can mask contiguous regions of space and time. The model has to predict what belongs in the
missing region using the surrounding context.

A person walking toward a door provides information about where that person should be
next. An object being pushed provides information about how it should move. The model is
forced to learn relationships between events rather than simply memorize local visual
patterns.

## Why this matters for physical understanding

The advantage of representation prediction is not that it magically gives a model physics.
It is that the learning objective focuses the model on structure that remains meaningful
across changes in appearance.

A useful representation should not change completely because the lighting changed, the
camera moved, or an object's texture looks different.

If a person has been standing near a door for 90 seconds, that fact should remain
represented in roughly the same way whether the room is bright or dark, whether the camera
moves, or whether the person's clothing looks slightly different.

The representation should capture what remains true across those changes.

This is also where data efficiency becomes interesting. If the model spends less of its
capacity explaining unpredictable visual detail, more of the learning signal can go toward
relationships that transfer across situations.

## What V-JEPA 2 suggests

V-JEPA 2 provides an interesting demonstration of what this kind of representation learning
can enable.

Meta showed that V-JEPA 2 could use video learned from large-scale datasets, together with
a relatively small amount of robot interaction data, to support zero-shot planning on
physical manipulation tasks.

The important point is not simply that the model can predict video.

The learned representation captures useful structure about how objects and actions relate
to one another: how objects move when they are contacted, how spatial relationships
change, and what is likely to happen after an action.

Those representations can then be used for tasks that were not explicitly present in the
training data.

That is the promise of a world model: not a system that generates a convincing video of the
future, but a system that learns a representation of the world that can be used to reason
about what happens next.

## Darwin: How far can the same idea go with 100x less data?

V-JEPA 2 shows what representation learning can achieve at scale. We wanted to ask a
different question: how far can the same idea go with much less data and compute?

We trained Darwin, our video JEPA model, on 8 H100 GPUs over three weeks, using roughly
100x less data than comparable V-JEPA 2 efforts.

Despite that smaller training budget, Darwin matches or exceeds V-JEPA-class models on
several standard downstream benchmarks. With a frozen backbone and linear probing, Darwin
reaches approximately 73% on Something-Something V2, 78% on Kinetics-700, and 88% on
ImageNet-1K.

The interesting part isn't just the benchmark numbers. It is what the representation can be
used for.

We aligned Darwin's embedding space with natural language, allowing the model to retrieve
visual concepts directly from its learned representations using text prompts. That means a
new visual concept does not necessarily require training a separate classification head.

Darwin also doesn't need to generate pixels. That makes the representation itself
lightweight enough for real-time inference on commodity hardware rather than requiring a
large datacenter GPU for every prediction.

Darwin is the encoder and predictor. Primate Vision is the system we built on top of it.

The API adds the pieces needed to turn those representations into something a computer
vision pipeline can actually use: structured action classifications, temporal context for
tracking entity identity and behavior duration across a clip, and calibrated confidence
scores derived from the model's uncertainty.

The result is an API that returns structured predictions directly, without requiring a
language model or natural-language parsing layer between the video model and the
application.

It is running in production today. Measured latency is 45 ms p50 per-frame inference, with
11.8 FPS sustained. These numbers are measured against the production API rather than
estimated from a lab benchmark.

## Limitations and open questions

JEPA is not a solved problem, and there are important limitations.

The encoder still needs substantial amounts of unlabeled video to learn useful
representations. For highly specialized environments such as underwater cameras, extreme
infrared, or satellite imagery, general-purpose pre-training data may not cover the target
distribution well. Adapting the representation without degrading what it already knows also
requires care.

Action recognition is another important distinction. The self-supervised JEPA objective
does not produce action labels by itself. Training an action recognition system still
requires supervised temporal annotations, and the resulting performance depends on the
quality and coverage of that data.

The benefits of spatiotemporal learning also do not automatically transfer to every vision
problem. For single-image tasks where there is no temporal context, the data-efficiency
advantage can be smaller.

Long-range temporal reasoning remains an open problem as well. A model can understand what
is happening over a short video clip, but tracking behavior that unfolds over minutes or
hours requires much longer temporal context and likely architectural changes beyond the
base JEPA approach.

So the question is no longer whether we can train a model to predict video.

The more interesting question is whether we can build a representation of the world that is
useful, efficient, and stable enough to support everything we want to do with that video.

## What's next

The [benchmarks page](${SITE}/technology/benchmarks) has the full head-to-head numbers
against V-JEPA 2 on both accuracy and throughput. If you want to test Darwin on your own
footage, get a sandbox key with one call, no signup:

\`\`\`
curl -s -X POST https://api.primateintelligence.ai/v1/sandbox
\`\`\`

---

Mehdi Nikkhah is co-founder and CTO of Primate Intelligence. Previously led all CV research
and engineering at Instacart and 6D.ai.
`;
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
