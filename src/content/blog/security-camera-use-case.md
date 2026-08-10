---
title: "What Scene Understanding Looks Like in a Real Security Camera Pipeline"
slug: "scene-understanding-security-cameras"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-08-24"
readTime: "7 min read"
tags: ["Engineering", "Infrastructure"]
status: "published"
excerpt: "A concrete walkthrough of what changes — and what stays the same — when you add Primate Vision to a security camera CV pipeline."
---

The typical security camera CV pipeline is a patchwork. It works, mostly, but it's held together by custom glue code every team writes themselves — slightly differently, incompatibly, with undocumented assumptions baked in.

If you've built one, you know the stack: RTSP ingest, frame extraction, a YOLO v8 inference call, bounding box filtering to drop low-confidence detections, custom logic to classify what detected persons are doing, an alert threshold someone tuned empirically months ago that nobody wants to touch. Then an operator dashboard showing alerts that may or may not be actionable.

The problem isn't any individual component. YOLO is solid. RTSP ingestion is solved. The problem is everything in the middle — the custom action classification, the temporal state tracking, the alert deduplication — which is where most engineering hours get spent, for highly variable results.

## What adding Primate Vision looks like

The integration surface is deliberately minimal:

```python
# Before: YOLO v8 + custom action classification
from ultralytics import YOLO
model = YOLO("yolov8x.pt")
results = model(frame)
detections = results[0].boxes
# ... 35 more lines of custom action classification logic
# ... temporal state tracking
# ... loitering timer management
# ... alert threshold logic
```

```python
# After: Primate Vision API
import primate
client = primate.Client(api_key=os.environ["PRIMATE_API_KEY"])
result = client.analyze(clip_path="clip.mp4")
alerts = [e for e in result.entities if e.action in ALERT_ACTIONS]
```

The action classification, the temporal state tracking, the loitering timer — all of it moves into the API. What you write is the alert routing layer: given that Primate Vision told you "person loitering at entrance for 90 seconds," what do you do with that?

## The output difference

YOLO v8 output for a single detection:

```json
{
  "class": "person",
  "confidence": 0.94,
  "bbox": [142, 89, 234, 411]
}
```

Primate Vision output for the same scene:

```json
{
  "entity": "person",
  "action": "loitering",
  "location": {
    "zone": "entrance",
    "bbox": [142, 89, 234, 411],
    "relative_position": "door_adjacent"
  },
  "temporal": {
    "duration_seconds": 94,
    "first_seen": "T-00:01:34",
    "consistent_since": "T-00:01:34"
  },
  "confidence": 0.97,
  "deterministic": true
}
```

The `deterministic: true` flag isn't decoration. It means running the same clip through the API again gets you the same JSON, byte-identical. That's what makes regression testing possible — and it's not a claim, it's [measured against the live production API](/performance).

## Specific use cases

**Loitering detection.** Before: you track person bounding boxes across frames with DeepSORT or ByteTrack, maintain a per-entity timer, define "loitering" as "entity in zone X for more than N seconds with displacement less than M pixels." You write it, tune N and M, handle the edge cases where the tracker loses the entity and reassigns an ID. After: the `action: "loitering"` field, temporal context included. You write the alert routing.

**Tailgating.** Before: detect multiple persons, define spatial proximity thresholds, track whether a second person followed the first through a controlled access point within a time window — multi-entity tracking with relationship logic. After: `action: "tailgating"`, with entity references to both individuals.

**Abandoned objects.** Before: track objects stationary after a person leaves frame, cross-reference the object's appearance time with nearby person departure events, maintain state for how long objects have been unattended — a genuinely hard multi-entity temporal problem. After: `action: "abandoned_object"`, with the object's location and duration since placed.

**Fall detection.** Before: train a pose estimation model, define a fall as a specific pose transition, handle the false positives from sitting or bending. After: `action: "fall"` with a confidence score.

## Real numbers, not lab numbers

This isn't a roadmap pitch. Primate Vision is live in production today. Per-frame inference: 45ms p50, 316ms p95. Sustained analysis rate: 11.8 fps p50 across a real session. Session setup: 6.6s one-time. All of it [measured against `api.primateintelligence.ai`](/performance) on real traffic, not a synthetic benchmark — and every result payload carries its own timing block, so you can watch it self-report in your own integration.

## Edge deployment

Right now, Primate Vision runs as a cloud endpoint: you `POST` video clips or stream frames to the API. On-device inference — the same Darwin model running locally on Jetson, macOS, iOS, and Snapdragon, CPU or GPU — is coming through our SDK. If your fleet needs to eliminate network latency and data egress cost entirely, that's the deployment to wait for, and it's one of the reasons we built Darwin light enough to run on a commodity CPU in the first place. [Join the SDK waitlist](mailto:matt@primateintelligence.ai?subject=SDK%20waitlist) if that's your constraint.

For most fixed-camera security applications today, the cloud endpoint's 180-220ms latency for a 10-second clip (including network round-trip from US regions) is well within operational requirements.

## Try it

The API is live now. If you want to see what your existing VIRAT or live-camera footage looks like through Primate Vision, get a sandbox key with one call, no signup: `curl -s -X POST https://api.primateintelligence.ai/v1/sandbox`.

---

*Matt Miesnieks is CEO and co-founder of Primate Intelligence.*
