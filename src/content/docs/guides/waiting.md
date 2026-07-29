---
title: Waiting for results
description: "Poll vs Prefer: wait vs webhooks — pick the right completion strategy."
order: 12
section: Guides
---

# Waiting for results

Analyses run asynchronously. There are three ways to learn when one finishes; pick by context.

| Strategy | Use when |
|---|---|
| **`Prefer: wait`** | Interactive flows, scripts, first success experience — simplest |
| **Polling** | You want progress bars / queue position, or waits longer than 120s |
| **Webhooks** | Production pipelines, high volume, serverless — no held connections |

## `Prefer: wait` (sync sugar)

Add one header to the create and the API holds the connection until the analysis reaches a terminal state (or the wait cap):

```bash doc-test id=waiting-prefer env=VIDEO_ID
curl -s -X POST https://api.primateintelligence.ai/v1/analyses \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: wait=60" \
  -d '{"video_id": "'"$VIDEO_ID"'", "prompt": "Is there a person in this video?"}'
```

- Cap: **120 seconds**. If the analysis isn't terminal by then you get the current (running) resource back — fall through to polling.
- Test-mode analyses complete in seconds, so `Prefer: wait` virtually always returns the finished result.
- Under capacity brownouts `Prefer: wait` may be temporarily disabled (you get an immediate 202-style response with the running resource) — code must handle a non-terminal response either way.

The SDK helpers `createAndWait()` (TS) / `create_and_wait()` (Python) use this header, then fall back to polling automatically.

## Polling

```bash
curl -s https://api.primateintelligence.ai/v1/analyses/$ANALYSIS_ID \
  -H "Authorization: Bearer $PRIMATE_API_KEY"
```

While running, the resource carries honest progress signals:

```json
{
  "status": "queued",
  "queue_position": 3,
  "progress": null
}
```

`queue_position` and `estimated_start_s` are accurate to within ±50% — we publish transparency rather than an analysis-latency SLO.

**Backoff:** poll at 1–2s intervals for interactive flows; add jitter for fleets. Terminal states are `completed`, `failed`, `canceled` — anything else keeps polling.

## Webhooks

Register once, get an HTTPS POST on every terminal transition:

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/webhook_endpoints \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourapp.com/webhooks/primate", "events": ["analysis.completed", "analysis.failed"]}'
```

See the [webhooks guide](/docs/guides/webhooks) for verification, retries, and the #1 integration rule (the webhook is a notification, not the source of truth).

## Cancellation

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/analyses/$ANALYSIS_ID/cancel \
  -H "Authorization: Bearer $PRIMATE_API_KEY"
```

Best-effort once the analysis is `analyzing`; a 409 `analysis_not_cancelable` means it already reached a terminal state. You are not billed for canceled work that never ran.
