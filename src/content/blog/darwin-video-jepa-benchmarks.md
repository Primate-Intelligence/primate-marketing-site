---
title: "Darwin: Video JEPA model that outperforms SOTA models while running on edge CPU"
slug: "darwin-video-jepa-benchmarks"
author: "Mehdi Nikkhah"
authorInitials: "MN"
date: "2026-07-29"
readTime: "5 min read"
tags: ["Research", "Benchmarks", "JEPA"]
status: "published"
excerpt: "Language models had their GPT moment. Vision, especially video, hasn’t yet!"
---

Language models had their GPT moment. Vision, especially video, hasn’t yet!

Despite remarkable progress over the past few years, we still don't have a foundation model for the physical world that has become the default starting point in the way GPT models transformed language. Video remains expensive to train on, difficult to represent efficiently, and surprisingly hard to generalize across tasks. This is the problem many researchers are trying to solve through **world models**.

Different groups have taken different approaches. Generative Video World Models learn by predicting future frames or reconstructing videos. Contrastive methods learn representations by distinguishing positive and negative examples. Both have produced impressive results, but each comes with fundamental compromises in scalability, efficiency, and the quality of the representations they learn.

More recently, **Joint Embedding Predictive Architectures (JEPA)** introduced a different idea. Instead of reconstructing pixels or comparing every possible pair of examples, JEPA predicts high-level representations of unseen regions from visible context. The objective is to model meaning rather than appearance—to learn the underlying structure of the world instead of memorizing visual details. We think this is the direction to bet on, based on our 10+ years of researching and building real-time video models for computer vision.

Over the past several months, we've been building **Darwin**, our implementation of a video JEPA model. At first glance, the obvious question is:

**Why build another JEPA?**

Because we believe world models need to become dramatically more accessible.

Today, training state-of-the-art video models often requires enormous datasets, massive GPU clusters, and budgets that place them beyond the reach of nearly every startup and research lab, let alone customer deployments on the edge hardware that needs to run them. That reality slows progress by limiting meaningful experimentation to only a handful of organizations.

We're a small team, who have previously built the world’s best edge computer vision models, at [6D.ai](http://6D.ai) (acquired by Niantic Spatial, now mapping the world from within Pokemon Go). Rather than assuming world models require virtually unlimited compute, we asked a different question:

**How far can careful engineering, better training methodology, and better data take us?**

The answer surprised even us. Using techniques we developed in the past, combined with the latest cutting edge research, we trained Darwin on a cluster of just **8 H100 GPUs over three weeks**, using roughly **100× less data** than comparable efforts such as VJEPA 2/VJEPA 2.1. For context, recent funding has gone into developing Generative World Models that require 100x more data and compute even compared to VJEPA2.1. Despite that dramatically smaller training budget, Darwin matches, or exceeds, existing VJEPA models of comparable size across standard downstream benchmarks.

**Video understanding (linear probe on frozen backbone):**

- Something-Something V2: **~73%**
- Kinetics-700: **~78%**

**Image understanding:**

- ImageNet-1K: **~88%**

Figure 1 compares Darwin against V-JEPA 2 across all three benchmarks.

![Bar chart comparing Darwin and VJEPA2 probe accuracy on Something-Something-v2, Kinetics-700, and ImageNet1k](/images/darwin-benchmarks/figure-1-probe-accuracy.png)

*Figure 1. Probe accuracy with a frozen backbone on benchmark datasets*

Benchmark accuracy by itself is important but ultimately an academic pursuit. Customers need to be able to run these models on their edge devices for any real business use case. If world models are going to power robots, autonomous systems, and edge devices, they can't require datacenter-scale hardware just to run inference. Efficiency matters just as much as capability. So we designed Darwin to be lightweight enough to run **in real time on a single commodity CPU**.

Figures 2 and 3 compare Darwin's throughput against V-JEPA 2 on both CPU and GPU, demonstrating that strong world representations don't have to come at the cost of enormous inference requirements.

![Bar chart comparing Darwin and VJEPA2 throughput in frames per second on an Intel Xeon CPU](/images/darwin-benchmarks/figure-2-throughput-intel-xeon.png)

*Figure 2. Throughput on an Intel Xeon Processor*

![Bar chart comparing Darwin and VJEPA2 throughput in frames per second on an Nvidia H200 GPU](/images/darwin-benchmarks/figure-3-throughput-nvidia-h200.png)

*Figure 3. Throughput on Nvidia H200 GPU*

We also wanted the learned representations themselves to be immediately useful. Most self-supervised vision models still require task-specific classification heads before they can solve downstream problems. Instead, we aligned Darwin's embedding space with natural language using text alignment. The result is a model that can be prompted directly with text to retrieve relevant visual concepts from its learned representations, without training separate classifiers for every task.

## Darwin: the first commercially available Video JEPA model

Customers can use Darwin today with open vocabulary prompts on a live video stream in real-time.

For us, this is just the beginning. We don't believe the future of physical-world intelligence should belong exclusively to organizations with tens of thousands of GPUs. Our experience in building models that run on tens for millions of phones to understand messy physical reality taught us that a different type of research approach is needed. Applying principles of customer focus, deep engineering, and innovative training methodologies, alongside pushing the limits of published academic research, is what gives the breakthroughs that enable models to be useful on billions of devices.

At **Primate Intelligence**, our mission is to make world models efficient enough to run anywhere, adaptable enough to solve real problems, and accessible enough that innovation isn't limited by compute budgets.
