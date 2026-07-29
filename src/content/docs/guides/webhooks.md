---
title: Webhooks
description: Standard Webhooks signing, verification, retries, redelivery, and the integration rules that matter.
order: 13
section: Guides
---

# Webhooks

Webhook endpoints receive an HTTPS POST whenever a subscribed event fires. Event vocabulary (closed, v1): `video.ready`, `video.failed`, `analysis.completed`, `analysis.failed`, `analysis.canceled`, `stream.ended`.

## Rule #1: the webhook is a notification, not the source of truth

Payloads over 256 KiB are truncated (`data.truncated: true`). Delivery is **at-least-once with no ordering guarantee**. The reliable pattern is always:

1. Receive the event → verify the signature → dedupe on the `webhook-id` header
2. `GET` the resource by id for the authoritative state
3. Act on that

Never assume `analysis.completed` arrives before (or after) your poll sees `completed`.

## Register an endpoint

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/webhook_endpoints \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourapp.com/webhooks/primate", "events": ["analysis.completed", "analysis.failed"]}'
```

The response contains the signing secret (`whsec_…`) **exactly once**. Store it. Max 10 endpoints per account.

## Delivery contract

- Body: `{"id": "evt_…", "type": "analysis.completed", "created_at": "…", "data": {…full resource DTO…}}`
- Timeout **10s**; only 2xx counts as delivered (3xx = failure)
- Retry schedule: `1m, 5m, 30m, 2h, 8h, 24h` with jitter; then the event dead-letters (visible in the deliveries API for 30 days)
- 72h of 100% failure → the endpoint auto-disables + you get an email. Re-enable with `POST /v1/webhook_endpoints/{id}/enable`

## Verify signatures

Deliveries are signed per [Standard Webhooks](https://www.standardwebhooks.com). Three headers: `webhook-id`, `webhook-timestamp`, `webhook-signature` (`v1,<base64 HMAC-SHA256>`; multiple space-separated during rotation). Signed content is `` `${id}.${timestamp}.${rawBody}` ``; the HMAC key is the base64-decoded part of your `whsec_` secret. Reject skew > 5 minutes; compare constant-time.

Both SDKs ship verifiers:

```typescript
import { verifyWebhookRequest } from '@primate-intelligence/sdk';

app.post('/webhooks/primate', (req, reply) => {
  verifyWebhookRequest({
    secret: process.env.PRIMATE_WEBHOOK_SECRET!,
    headers: req.headers,
    rawBody: req.rawBody,          // MUST be the raw bytes, not re-serialized JSON
  });                              // throws on failure
  const event = JSON.parse(req.rawBody);
  if (alreadyProcessed(event.id)) return reply.code(204).send(); // dedupe on evt_ id
  // … fetch the resource, act …
  reply.code(204).send();
});
```

```python
from primate_intelligence import verify_webhook_request

@app.post("/webhooks/primate")
async def receive(request: Request):
    raw = await request.body()
    verify_webhook_request(
        secret=os.environ["PRIMATE_WEBHOOK_SECRET"],
        headers=dict(request.headers),
        raw_body=raw,              # raw bytes, not re-serialized JSON
    )                              # raises ValueError on failure
    event = json.loads(raw)
    ...
    return Response(status_code=204)
```

> Per-request `webhook` overrides on `POST /v1/analyses` / `POST /v1/streams` have no secret exchange and are delivered **unsigned** — register an endpoint when you need verification.

## Rotate secrets

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/webhook_endpoints/$ID/rotate_secret \
  -H "Authorization: Bearer $PRIMATE_API_KEY"
```

Both old and new secrets sign deliveries for **24h** (the signature header carries two entries); verification passes when any signature matches *your* secret. Full key-compromise procedure: [security model](/docs/guides/security-model).

## Debug deliveries

```bash
# last 100 deliveries with response codes
curl -s https://api.primateintelligence.ai/v1/webhook_endpoints/$ID/deliveries \
  -H "Authorization: Bearer $PRIMATE_API_KEY"

# redeliver a failed/dead one now
curl -s -X POST https://api.primateintelligence.ai/v1/webhook_endpoints/$ID/deliveries/$DELIVERY_ID/redeliver \
  -H "Authorization: Bearer $PRIMATE_API_KEY"
```

## Local development

Use a tunnel (ngrok, cloudflared) so the API can reach your dev machine, or skip webhooks locally and use `Prefer: wait` — the two strategies are drop-in replacements for the completion signal.
