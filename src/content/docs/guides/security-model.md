---
title: Security model
description: API keys, client tokens, scopes, data handling, and the key-compromise procedure.
order: 18
section: Guides
---

# Security model

## API keys

- Two prefixes: `pv_live_` (real processing, metered) and `pv_test_` ([test mode](/docs/guides/test-mode)). 256-bit CSPRNG entropy.
- Shown **exactly once** at creation/rotation. We store only a SHA-256 digest.
- Send via `Authorization: Bearer …` header only. Keys never belong in URLs, logs, or browser code.
- Env-var contract: `PRIMATE_API_KEY` — both SDKs and the MCP server read it. The MCP server never accepts keys as tool arguments (keys must not land in agent transcripts).
- Revocation propagates in ≤ 5 seconds.

## Client tokens (browser auth)

Secret keys must never reach a browser. For client-side flows, your server mints an **ephemeral client token**:

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/client_tokens \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scopes": ["videos:write", "analyses:read"], "ttl_s": 300}'
```

- Prefix `pvct_`, TTL 60–900s (default 900), **never refreshable** — mint a new one when it expires (`401 token_expired`)
- Scopes (v1): `videos:write`, `analyses:read`, `analyses:write`, `streams:create`, `streams:signal` — a token's scopes must be a subset of the minting key's
- Optionally bind a token to one `video_id` or `stream_id` — the token then works only for that resource
- The streaming signaling WebSocket accepts **only** client tokens (or first-party session JWTs) — never secret keys

Pattern: a ≤ 20-line "token mint" route on your server, browser does the rest. Working example: the token-mint server sample in the [examples](https://github.com/Primate-Intelligence/primate-examples).

## Data handling

**Prompts and result metadata are retained to operate and improve the service; customer video content is never used to train models.**

The full contract:

| Data | Retention |
|---|---|
| Source videos | Deleted 30 days after upload; `DELETE /v1/videos/{id}` propagates from S3 + CDN within 72h (signed URLs expire ≤ 1h) |
| Result artifacts (annotated videos) | 30 days, same deletion path |
| Result JSON + analysis metadata | 13 months (billing/audit), then aggregated |
| Prompts | Retained per the sentence above; org-level opt-out available on request |
| Account deletion | Cascades videos/analyses/keys within 30 days; webhook endpoints immediately |

- Encryption: TLS ≥ 1.2 in transit; AES-256 at rest
- No customer video bytes in logs or analytics — enforced by a redaction test in CI
- Region: all processing/storage in us-west-2 (US)
- Audit log: key lifecycle + webhook changes retained 13 months

## URL ingest (SSRF policy)

`POST /v1/videos {url}` fetches are locked down: https only, port 443, public addresses only (RFC-1918/link-local/metadata ranges rejected), resolved IPs pinned (no TOCTOU), max 3 redirects each re-validated, 2 GiB streamed cap, content validated by magic bytes. Policy violations return `url_forbidden`; network failures `url_fetch_failed`.

## If a key is compromised

1. **Rotate immediately** — create a new key, revoke the old one in the [dashboard](https://primateintelligence.ai/dashboard/api-keys) (propagation ≤ 5s)
2. **Audit** — `GET /v1/analyses?created_after=…` for activity you don't recognize
3. **Contact support** with request ids for usage-forgiveness on abusive spend

We monitor per-key spend anomalies (> 5× 7-day baseline), page on them, and may auto-suspend a key pending confirmation — with an email + dashboard banner, never silently.

## Webhook signing

Deliveries are signed (Standard Webhooks, HMAC-SHA256, 5-minute replay window, 24h dual-secret rotation). Details: [webhooks guide](/docs/guides/webhooks).
