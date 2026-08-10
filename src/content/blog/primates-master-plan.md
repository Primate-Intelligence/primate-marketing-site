---
title: "Primate's Master Plan, or How We See the World Evolving"
slug: "primates-master-plan"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-09-08"
readTime: "8 min read"
tags: ["Perspective", "Founding"]
status: "draft"
excerpt: "I wrote a master plan once before, for 6D.ai, back when AR needed a spatial computing layer nobody had built yet. This is the same exercise for physical AI — where I think this decade actually goes, and why we built Primate to sit at a specific point on that path."
---

I've done this before. In 2018 I wrote a master plan for 6D.ai, laying out where I thought spatial computing had to go and where we were placing our bet on that path. Some of it was right. Some of it took a lot longer than I thought. Niantic acquired the company for the mapping and understanding layer, which was the part of the plan that mattered most — but the AR glasses that were supposed to make all of it obvious took years longer to show up than anyone expected in 2018.

I learned something from being early that time: being technically right too early is just being wrong, commercially, until the rest of the stack catches up around you. So this time I want to write the plan down again, in public, and be specific about which parts I'm confident in and which parts are a bet.

**Here's how I think the next decade of physical AI actually plays out.**

## Where we are

Language models won the last five years by being fluent about a huge amount of the world's compressed, written knowledge. That was the correct thing to build first — text is abundant, well-labeled by humans already, and the reward signal (does the next word look right) is cheap to compute at scale. It got us extraordinarily capable systems that can reason, write, and converse.

But fluency about text isn't the same as understanding the physical world, and the industry has spent the last two years discovering that the hard way. Every attempt to bolt physical perception onto a language model — VLMs, VLAs, video captioning pipelines — inherits the same core mechanism: predict the next plausible token. That's a mechanism built for language, applied to a domain, physical reality, where the right answer isn't the most plausible-sounding one. It's the one that's actually true, whether or not it's the one you'd expect to hear described in words.

That's the gap. Not a data gap, not a scale gap — an architectural one.

## Where this goes

I think physical AI goes through three phases, and we're at the very start of the second.

**Phase one — text-native AI (largely done).** LLMs mature, get cheap, get embedded everywhere text-shaped tasks exist. This phase isn't over, but the returns are diminishing and everyone building in this phase now is optimizing an already-optimized curve.

**Phase two — perception-native AI (starting now).** Systems that understand the physical world directly — from video, not from captions of video — start replacing the generation-then-caption pipelines everyone's currently duct-taping together. This is where JEPA lives, and it's where Primate is placing the entire company. The winning property in this phase isn't "can it describe a scene impressively." It's "can you set a threshold on its output and trust it without a human checking every alert." Deterministic, verifiable perception is the unlock, and almost nobody is building for it yet because it's less flashy than a model that writes you a paragraph about what it sees.

**Phase three — embodied, causal AI.** Systems that don't just perceive state but act on it, with a causal model of consequences, closing the loop between perception and action reliably enough to run autonomously in safety-relevant settings. This is the phase most of the "physical AGI" marketing budget in Silicon Valley is currently being spent on, and it's the phase that depends entirely on phase two actually working first. You cannot build a trustworthy actor on top of an untrustworthy perceiver. Every VLA demo I've seen quietly assumes perception is solved and spends its complexity budget on the action side. That's building the roof before the foundation is poured.

## Why we're building phase two, not phase three

Everyone wants to skip straight to the humanoid-robot demo. I understand why — it's the more exciting slide. But we made a deliberate choice to build the foundation instead of the roof: a JEPA-based video understanding model, Darwin, that's deterministic, fast enough to run in production, and narrow enough in scope that we can actually ship it as an API a CV engineer can build a real business on top of today, not in three years.

This is the same instinct that shaped 6D.ai — build the unglamorous infrastructure layer that the exciting thing eventually needs, and be there when the market catches up to needing it, rather than trying to demo the exciting thing before its foundation exists. The difference this time is I'm not waiting for a hardware category to mature around us. Video understanding has a market today: security, industrial monitoring, retail analytics, anywhere a human is currently watching a camera feed and making a judgment call a deterministic model could make faster and more consistently.

## Why now, and why us

The timing argument: JEPA went from LeCun's research thesis to something with real benchmarked results in the last eighteen months. That's the technology unlock. The market unlock is separate and, I'd argue, more important — five years of VLM disappointment in production CV pipelines has created a customer base that's actively looking for the alternative, not one that needs to be educated that a problem exists. We're not selling a solution to a problem nobody's noticed. We're selling the fix to a problem every serious CV team has already lived through.

The "why us" argument is the one I'll let the product answer instead of the essay. Darwin runs today, in production, at measured latency, against real footage — not a research demo, not a fundraising deck number. That's the bet: that the company willing to do the unglamorous work of shipping a reliable API, instead of chasing the more fundable robot demo, is the one that ends up owning the foundation everything in phase three eventually has to build on.

I don't know exactly how long phase two takes to play out — I got that timing wrong once already with AR glasses, and I'm not going to pretend I have more certainty than I do. What I'm confident in is the sequencing: perception before action, deterministic before embodied, shipped before demoed. That's the plan. We're building it now.
