---
title: Rate limits & quotas
description: Limit classes, headers, 429 handling, and how quotas differ from rate limits.
order: 15
section: Guides
---

# Rate limits & quotas

## Rate limits

Applied per API key, sliding window:

| Class | Limit | Covers |
|---|---|---|
| `reads` | 600/min | All GETs |
| `writes` | 300/min | POST/DELETE except analysis creation |
| `analyses.create` | 60/min | `POST /v1/analyses` |

Plan multipliers can raise these. Every response — including 429s — carries:

```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 597
X-RateLimit-Reset: 1751980860
```

A 429 adds `Retry-After` (integer seconds, ≥ 1). **Honor it** — the SDKs do automatically.

```json
{ "error": { "code": "rate_limit_exceeded", "status": 429, "message": "Rate limit exceeded. Back off per Retry-After." } }
```

## Concurrency limits

Separate from request rates: your plan caps **simultaneous running analyses**. Exceeding it returns `429 concurrency_limit_exceeded` — wait for an active analysis to finish rather than backing off blindly.

## Quotas (metered limits)

Quotas are about *how much* you process, not how fast you call. Exceeding a metered limit returns `429 quota_exceeded` with `details.meter` naming the meter. Check consumption any time:

```bash doc-test id=rate-limits-usage
curl -s https://api.primateintelligence.ai/v1/usage \
  -H "Authorization: Bearer $PRIMATE_API_KEY"
```

```json
{
  "meters": [
    { "meter": "credit_seconds", "unit": "seconds", "balance": 5990 },
    { "meter": "seconds_processed.period", "unit": "seconds", "used": 10, "resets_at": "2026-08-01T00:00:00Z" }
  ]
}
```

Running out of credits is `402 insufficient_credits` (not 429) — see [billing & credits](/docs/guides/billing).

## Capacity

Under platform-wide pressure new creates may get `503 capacity_exhausted` with `Retry-After` while in-flight work drains. Test-mode traffic is never shed (it doesn't touch the GPU). See [service expectations](/docs/guides/versioning#service-expectations).

## Client checklist

1. Honor `Retry-After` on every 429/503 — never hammer
2. Watch `X-RateLimit-Remaining` and pre-throttle when it gets low
3. Treat `concurrency_limit_exceeded` as "wait for completion", not "back off"
4. Treat `quota_exceeded`/`insufficient_credits` as account states — alert a human, don't retry
5. Single region (us-west-2) in v1 — no cross-region limit ambiguity
