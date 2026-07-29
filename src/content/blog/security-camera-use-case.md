---
title: "What Scene Understanding Looks Like in a Real Security Camera Pipeline"
slug: "scene-understanding-security-cameras"
author: "Matt Miesnieks"
authorInitials: "MM"
date: "2026-05-17"
readTime: "7 min read"
tags: ["Engineering", "Infrastructure"]
status: "draft"
excerpt: "A concrete walkthrough of what changes — and what stays the same — when you add Primate Vision to a security camera CV pipeline."
---

The typical security camera CV pipeline is a patchwork. It works, mostly, but it's held together by custom glue code that every team has written themselves — slightly differently, incompatibly, and with undocumented assumptions baked in.

If you've built one of these, you know the stack: RTSP ingest, frame extraction, a YOLO v8 inference call, some bounding box filtering to remove low-confidence detections, custom logic to classify what detected persons are doing, an alert threshold system that someone tuned empirically months ago and now nobody wants to touch. Then an operator dashboard that displays alerts that may or may not be actionable.

The problem isn't any individual component. YOLO is solid. RTSP ingestion is solved. The operator dashboard is whatever it is. The problem is everything in the middle — the custom action classification logic, the temporal state tracking, the alert deduplication — which is where most engineering hours get spent, for highly variable results.

![Diagram: typical security camera CV pipeline today. Boxes: RTSP stream → frame extraction → YOLO v8 → bounding box filter → alert logic → operator dashboard. Annotate the 'custom glue code' sections in red.](stub)

## What Adding Primate Vision Looks Like

The integration surface is deliberately minimal. Here's what the change looks like in practice:

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

The action classification logic, the temporal state tracking, the loitering timer — all of that moves into the API. What you write is the alert routing layer: given that Primate Vision has told you "person loitering at entrance for 90 seconds," what do you do with that information?

![Code screenshot: before (YOLO v8 call + custom action classification post-processing, ~40 lines) vs after (Primate Vision API call, ~5 lines).](stub)

## The Output Difference

The JSON output comparison makes the structural difference explicit.

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

The `deterministic: true` flag is not decoration. It means that if you run the same clip through the API again, you will get the same JSON, identical to the byte. This is what makes regression testing possible.

## Specific Use Cases

**Loitering detection.** Before Primate Vision: you track person bounding boxes across frames using DeepSORT or ByteTrack, maintain a per-entity timer, and define "loitering" as "entity in zone X for more than N seconds with displacement less than M pixels." You write this. You tune N and M. You handle the edge cases where the tracker loses the entity and reassigns an ID. After Primate Vision: the `action: "loitering"` field in the output JSON. The temporal context is in the response. You write the alert routing.

**Tailgating.** Before: you detect multiple persons, define spatial proximity thresholds, track whether a second person followed the first through a controlled access point within a time window. This requires multi-entity tracking with relationship logic. After: `action: "tailgating"` in the output, with entity references to both individuals involved.

**Abandoned objects.** Before: you track objects that are stationary after a person leaves frame, cross-reference the object's appearance time with nearby person departure events, maintain state for how long objects have been unattended. This is a genuinely hard multi-entity temporal tracking problem. After: `action: "abandoned_object"` with references to the object entity, its location, and the duration since it was placed.

**Fall detection.** Before: you train a pose estimation model, define fall as a specific pose transition pattern, handle the false positives from people sitting down, bending over, or moving quickly. After: `action: "fall"` with confidence score.

![Side-by-side video frames for loitering detection: Frame at T=0 shows person entering. Frame at T=60s shows Primate Vision JSON output flagging loitering with temporal context. YOLO output shows only 'person detected' at each frame independently.](stub)

## Edge Deployment

The Primate Vision API runs in two configurations: cloud endpoint and on-device. For cloud, you POST video clips or stream frames to the API endpoint. For edge, you run the same inference container on NVIDIA Jetson Orin hardware.

The API contract is identical in both cases. Same JSON schema, same confidence calibration, same action taxonomy. The only difference is the endpoint URL in your client configuration. Your application code doesn't change. Your alert logic doesn't change. Your operator dashboard doesn't change.

On Jetson Orin AGX (64GB), Primate Vision processes 1080p footage at approximately 12 fps with full scene understanding. For most fixed-camera security applications, this is well within operational requirements. Latency on the cloud endpoint is 180-220ms for a 10-second clip, including network round-trip from US regions.

The edge deployment eliminates both the network latency and the data egress costs associated with uploading video to cloud endpoints. For deployments with many cameras, the economics of on-device inference become compelling quickly.

## Try It

The API is in developer preview now. We're doing hands-on onboarding with the first cohort of teams. If you want to see what your existing VIRAT or live-camera footage looks like through Primate Vision, request access at the link below and we'll walk through the integration together.

---

*Matt Miesnieks is CEO and co-founder of Primate Intelligence.*
