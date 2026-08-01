---
title: Errors & retries
description: The error envelope, the closed registry, and exactly what to retry.
order: 14
section: Guides
---

# Errors & retries

Every non-2xx response uses one envelope:

```json
{
  "error": {
    "code": "insufficient_credits",
    "message": "Insufficient credits. Add credits or enable auto-refill.",
    "status": 402,
    "param": null,
    "docs_url": "https://primateintelligence.ai/docs/errors#insufficient_credits",
    "request_id": "req_01H…"
  }
}
```

- **`code`** — stable, machine-readable, from a closed registry. Codes are append-only; meanings never change.
- **`docs_url`** — deep link to the [error registry page](/docs/errors) anchor for that code.
- **`request_id`** — include it in support requests; it indexes our logs.
- **`error.errors[]`** — on `validation_failed`, every violation is listed (param + message), not just the first.
- **`details`** — structured extras (e.g. `details.meter` on `quota_exceeded`).

## The registry is machine-readable

```bash doc-test id=errors-registry
curl -s https://api.primateintelligence.ai/v1/errors
```

Each entry carries two retry flags:

- **`retryable`** — safe to retry the same request unchanged (with backoff)
- **`idem`** — idempotent to retry with the same `Idempotency-Key`

The SDKs generate their retry policy from this table — if you build your own client, do the same and your retry logic can never drift from the API.

## What to retry

| Situation | Codes | Strategy |
|---|---|---|
| Rate limited | `rate_limit_exceeded`, `concurrency_limit_exceeded` | Wait `Retry-After` seconds, retry |
| Platform transient | `inference_unavailable`, `db_unavailable`, `internal_error`, `capacity_exhausted`, `idempotency_unavailable` | Exponential backoff + jitter, same `Idempotency-Key` |
| URL fetch flake | `url_fetch_failed` | Retry the create; check the source URL is reachable |
| Prompt didn't compile | `parse_failed` (422) | Rephrase the prompt or send a structured `query` |
| Everything else | `validation_failed`, `invalid_api_key`, `insufficient_credits`, … | **Do not retry unchanged** — fix the cause |

## Idempotency (never double-create)

Send `Idempotency-Key` (any string, 1–255 chars; UUIDv4 recommended) on `POST /v1/videos`, `/v1/analyses`, `/v1/webhook_endpoints`:

- Same key + same body within 24h → the stored response replays with `Idempotency-Replayed: true`
- Same key + **different** body → `409 idempotency_key_reused`
- Body comparison is canonical (JCS) — key order / whitespace / number formatting never false-positive

The SDKs auto-generate keys on create calls, which makes network-level retries safe by default.

## Resource-level errors

Two codes never appear as HTTP errors — only inside a failed resource's `error` field:

- **`inference_error`** — the model failed on this input; safe to create a new analysis
- **`stuck_timeout`** — the platform lost the job; not billed; resubmit

Check `analysis.error` / `video.error` when `status` is `failed`.

### Free re-runs after platform incidents

Failed analyses carry **`rerun_eligible: boolean`** (present only on `failed` status) — `true` when the failure occurred during a declared platform incident or was flagged by ops. When eligible, **`POST /v1/analyses/{id}/rerun`** creates a **fresh analysis at no charge** — same video, prompt, model, and options; new id; `usage` stays `null` (never billed). One free re-run per failed analysis; calling on an ineligible analysis returns `409 rerun_not_eligible`. Check `rerun_eligible` before writing your own retry — a free re-run beats paying for a resubmit.

## A worked retry loop (Python, no SDK)

```python
import time, requests

def create_analysis(body, key, attempts=4):
    idem = str(uuid.uuid4())
    for attempt in range(attempts):
        r = requests.post(
            "https://api.primateintelligence.ai/v1/analyses",
            json=body,
            headers={"Authorization": f"Bearer {key}", "Idempotency-Key": idem},
        )
        if r.ok:
            return r.json()
        err = r.json()["error"]
        registry = requests.get("https://api.primateintelligence.ai/v1/errors").json()
        flags = next(e for e in registry["data"] if e["code"] == err["code"])
        if not flags["retryable"] or attempt == attempts - 1:
            raise RuntimeError(f"{err['code']}: {err['message']} ({err['request_id']})")
        time.sleep(int(r.headers.get("Retry-After", 2 ** attempt)))
```

(Or just use the SDK — this is exactly what it does, with the registry vendored at build time.)

## See also

- [Error registry](/docs/errors) — every code, one anchor each (the `docs_url` targets)
- [Rate limits & quotas](/docs/guides/rate-limits)
- [Billing & credits](/docs/guides/billing) — handling `insufficient_credits` gracefully
