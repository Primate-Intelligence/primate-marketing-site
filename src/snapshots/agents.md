# Primate Intelligence Public API — Agent Guide

Machine-consumable reference for AI agents integrating with the Primate Intelligence Public API (`/v1`).

---

## Quick Start

### 1. Get a sandbox key (zero-human, instant)

```http
POST /v1/sandbox
```

Returns a `pv_test_` key, a `fixture_video_id`, and a `fixture_prompt`. No auth required.

**Response includes:**
- `livemode: false` — all sandbox responses are always test-mode
- `upgrade` — instructions for upgrading to a live key (see below)

### 2. Upgrade to a free live key (no account required)

Call `POST /v1/keys/upgrade` with your `pv_test_` key. Receives a real `pv_live_` key with a **6,000-second free credit grant**. No email, no card, no human-in-the-loop.

```http
POST /v1/keys/upgrade
Authorization: Bearer pv_test_<your-sandbox-key>
```

Response includes a `pv_live_` key and `tier: "free_grant"`. Free-grant keys:
- Run real GPU inference (`livemode: true`)
- Have no overage — when the grant is exhausted, analyses return `402 grant_exhausted` with a link to the claim flow for billed keys

### 3. Get a billed live key (device-code flow)

```http
POST /v1/keys/request
```

Returns `{device_code, claim_url, poll_interval}`. Direct the user to `claim_url`. Poll:

```http
GET /v1/keys/request/{device_code}
```

Returns `{status: "pending"}` until the user approves in the browser. On approval returns the billed `pv_live_` key ONCE (subsequent polls return `410 Gone`).

---

## The `livemode` Field

**Every public API resource includes a top-level `"livemode": boolean` field** (Stripe-style).

| Value | Meaning |
|-------|---------|
| `true` | Request used a `pv_live_` key — results are real GPU inference |
| `false` | Request used a `pv_test_` key or sandbox — results are deterministic canned fixtures |

**Agents SHOULD verify `livemode` matches their expectation before relaying results to users or downstream systems.** A result with `livemode: false` is a fixture/test result and must never be treated as evidence about real video content.

Example analysis response:
```json
{
  "object": "analysis",
  "livemode": true,
  "status": "completed",
  "result": { "answer": "yes", "confidence": 0.97, ... }
}
```

---

## Test Key Restrictions

Test (`pv_test_`) keys **only analyze the fixture video** seeded by `/v1/sandbox`. Attempting to analyze any other video returns:

```json
{
  "error": {
    "code": "test_key_fixture_only",
    "message": "Test keys can only analyze the provided fixture video. Create a live key to analyze your own uploads.",
    "status": 403
  }
}
```

This prevents fabricated results on real video content.

---

## Video Metadata

After `POST /v1/videos/{id}/complete`, the API probes the uploaded S3 object and populates:

| Field | Type | Description |
|-------|------|-------------|
| `duration_s` | number \| null | Duration in seconds |
| `width` | integer \| null | Frame width in pixels |
| `height` | integer \| null | Frame height in pixels |
| `fps` | number \| null | Frames per second |

Agents can use these fields to verify the right file arrived before submitting an analysis. Probe failures are non-fatal — fields remain `null` if probing fails.

---

## Error Codes

| Code | HTTP | Retryable | Description |
|------|------|-----------|-------------|
| `test_key_fixture_only` | 403 | no | Test key tried to analyze a non-fixture video. Use a live key. |
| `grant_exhausted` | 402 | no | Free-grant credits depleted. Use the claim flow to get a billed key. |
| `insufficient_credits` | 402 | no | Live key ran out of credits. Add credits or upgrade. |
| `sandbox_limit_exceeded` | 429 | yes | Too many sandbox provisions from this IP. Retry after the window. |
| `upgrade_limit_exceeded` | 429 | yes | Too many free-grant upgrades from this IP today. |
| `invalid_api_key` | 401 | no | Key not found or malformed. |
| `key_expired` | 401 | no | Key has passed its `expires_at`. |

Full registry: `GET /v1/errors`

---

## Key Lifecycle

```
POST /v1/sandbox
  → pv_test_ key (livemode: false, fixture-only, 7-day TTL)
      │
      ▼
POST /v1/keys/upgrade   (auth: pv_test_ key)
  → pv_live_ key (livemode: true, tier: free_grant, 6,000s grant, 30-day idle expiry)
      │  (grant exhausted → 402 grant_exhausted)
      ▼
POST /v1/keys/request  →  GET /v1/keys/request/{code}  →  billed pv_live_ key
  (device-code claim flow — user approves in browser)
```

---

## What the Model Supports

Design prompts as targeted visual questions. The model natively handles:

| Type | Example | `answer` | `detected_count` | `clips` | Accuracy |
|------|---------|----------|-----------------|--------|---------|
| **Presence** | "Is there a person?" | yes/no/indeterminate | — | ✅ when yes | Stable |
| **Absence** | "Are there no dogs?" | yes/no | — | — | Stable |
| **Action** | "Is someone walking?" | yes/no/indeterminate | — | ✅ when yes | Beta |
| **Count — bare** | "How many people walking?" | — | ✅ integer | — | Stable |
| **Count — threshold** | "More than 2 people?" | yes/no | ✅ integer | — | Stable |
| **Compound** | "Person AND dog?" | yes/no | — | ✅ when yes | Stable |
| **Attribute** | "Is anyone in a red jacket?" | description | — | — | Stable |
| **Location** | "Where is the dog?" | description | — | — | Stable |
| **State** | "Is the door open?" | description | — | — | Stable |
| **Segment** | "Show me where the person is" | — | — | ✅ with masks | Stable |

> **Accuracy note:** Action queries (motion/activity detection) are **beta accuracy** — results may be less reliable than presence/counting queries on short or fast-moving clips.

**Not supported:** audio/sound, identity (who, not what), OCR/text in frame, subjective judgment, exhaustive count over long multi-hour footage.

Open-ended prompts ("Tell me what you see") return a description but have lower accuracy — prefer a targeted question.

Full guide: [Prompts & queries](https://primateintelligence.ai/docs/guides/prompts)

---

## Remote MCP Endpoint

Primate Intelligence exposes a hosted [Model Context Protocol](https://modelcontextprotocol.io) server at:

```
https://api.primateintelligence.ai/mcp
```

Transport: **Streamable HTTP** (MCP spec 2025-03-26+, stateless mode). No npx or local install required — any remote agent can connect directly.

### Authentication

Pass your Primate Vision API key as a Bearer token in every request:

```
Authorization: Bearer pv_live_<your-key>
```

Test keys (`pv_test_…`) also work and return deterministic fixture results. Get a free key:

```bash
# Instant sandbox key (no auth required)
curl -X POST https://api.primateintelligence.ai/v1/sandbox

# Upgrade to a live key with a 6,000-second free credit grant
curl -X POST https://api.primateintelligence.ai/v1/keys/upgrade \
  -H "Authorization: Bearer pv_test_<your-sandbox-key>"
```

Requests without a valid key receive a 401 JSON-RPC error with provisioning guidance.

### Available Tools

The remote endpoint exposes the same 10 tools as the npx package:
`create_video_from_url`, `create_analysis`, `validate_analysis`, `create_analysis_batch`, `get_analysis`, `wait_for_analysis`, `list_models`, `get_usage`, `get_credits`, `get_test_fixture`.

- `validate_analysis` — free dry-run (`validate_only: true`): compiled query, assessability, and cost estimate before you spend credits.
- `create_analysis_batch` — 2–10 prompts on one video; the first is full price, each additional is billed at 50%.
- `get_credits` — balance plus the per-analysis transaction ledger (`GET /v1/credits`); prefer it over `get_usage` for auditing what each analysis cost.

Every tool declares an `outputSchema` (visible in `tools/list` and on the static server card at
`/.well-known/mcp/server-card.json`), generated from the same schemas that validate the public /v1
responses — and every result carries `structuredContent` conforming to it, alongside the
human-readable JSON text content.

**`wait_for_analysis` response envelope:** the tool returns `{ analysis, retry }` — the
[Analysis resource](https://primateintelligence.ai/docs/api#analyses) unmodified under `analysis`,
plus `retry: null` when the analysis reached a terminal state, or
`retry: { reason: "timeout", note }` when the wait expired (call `wait_for_analysis` or
`get_analysis` again). Earlier versions merged an `_mcp_note` field into the analysis object on
timeout; that field is gone.

### Client Configuration Examples

**Claude Desktop / MCP config JSON:**
```json
{
  "mcpServers": {
    "primate-intelligence": {
      "type": "streamable-http",
      "url": "https://api.primateintelligence.ai/mcp",
      "headers": {
        "Authorization": "Bearer pv_live_<your-key>"
      }
    }
  }
}
```

**ChatGPT app directory / custom GPT:**
```
URL: https://api.primateintelligence.ai/mcp
Auth: Bearer token → your pv_live_ or pv_test_ key
```

**OpenAI Agents SDK (Python):**
```python
from agents.mcp import MCPServerStreamableHttp
server = MCPServerStreamableHttp(
    url="https://api.primateintelligence.ai/mcp",
    headers={"Authorization": "Bearer pv_live_<your-key>"},
)
```

### MCP Registry

The server is also listed in the MCP registry at `ai.primateintelligence/mcp` with both the npx stdio package and this remote entry. See `mcp/server.json` in the repository.

---

## Result Contract

```json
{
  "object": "analysis",
  "livemode": true,
  "status": "completed",
  "result": {
    "answer": "yes",
    "confidence": 0.97,
    "detected_count": 3,
    "clips": [{"start_s": 1.2, "end_s": 3.4, "confidence": 0.94}]
  },
  "usage": {
    "billed_seconds": 6,
    "credit_balance_after": 5994
  }
}
```

- `result.answer` ∈ `yes | no | indeterminate`. `indeterminate` = model couldn't commit; don't ship a decision.
- `result.detected_count` — populated for count-intent queries. Integer ≥ 0.
- `result.confidence` ∈ [0, 1]. Zero confidence with no positive detections returns `indeterminate`, not `no`. For count queries, `confidence` applies to the detected count itself — it is the model's confidence that `detected_count` is the correct number, not merely that something was detected. See the [Count queries](#count-queries--the-contract) section for full semantics.
- `result.clips[]` — present for presence/action/compound/segment when `answer: "yes"`. Null otherwise.
- `query.unassessable_components[]` — lists what couldn't be evaluated (e.g. audio). API answers what it can.
- `usage.billed_seconds` — seconds charged for this analysis.
- `usage.credit_balance_after` — the balance immediately after **this** analysis settled. Immutable point-in-time snapshot — it never changes as later analyses run. A `null` value (`snapshot_unavailable`) means the analysis settled before the snapshot feature shipped (migration 075) and the original balance is unknowable; treat it as missing data rather than zero.
- `livemode: true` = real GPU inference. Never relay `livemode: false` results as evidence about real content.
- `origin` ∈ `api | console | system` — how the analysis was created (public API, dashboard upload, or internal). **System-initiated analyses are never billed** — only `api`/`console` analyses reserve and settle credits.

---

## Count queries — the contract

A count query ("how many X…", "more than N X?") succeeds like this:

```json doc-test id=count-contract-success
{
  "answer": "yes",
  "confidence": 0.94,
  "detected_count": 3,
  "clips": [{ "start_s": 1.2, "end_s": 3.4, "confidence": 0.94, "terms": { "person": 0.94 } }],
  "term_confidences": { "person": 0.94 },
  "query_type": "object",
  "video_duration_s": 6.0,
  "indeterminate_reason": null
}
```

And fails like this:

```json doc-test id=count-contract-failure
{
  "answer": "indeterminate",
  "confidence": 0,
  "detected_count": 0,
  "clips": [],
  "term_confidences": {},
  "query_type": "object",
  "video_duration_s": 6.0,
  "indeterminate_reason": "nothing_detected"
}
```

**Rules:**

- `detected_count` is only meaningful when `answer` is determinate (`yes` or `no`).
- `detected_count: 0` with `answer: "indeterminate"` means the pipeline found **nothing assessable** — NOT "zero occurrences".
- A true "zero occurrences" result is `answer: "no"`, `detected_count: 0`.
- **Never branch on `detected_count` without checking `answer` first.**

**Confidence semantics for count queries:** for count queries, `confidence` applies to the detected count itself — it is the model's confidence that `detected_count` is the correct number, not merely that something was detected. `{"confidence": 0.94, "detected_count": 3}` asserts "there are 3" at 94% confidence, not "there is at least one". Numerically it is derived from the per-term detection confidences underlying the count (max across detected clips, clamped to [0, 1]). When `answer` is `indeterminate`, `confidence` is always 0 (enforced by the API regardless of what inference returned); `indeterminate_reason: "nothing_detected"` additionally forces `detected_count` to 0 because no objects were seen at any confidence level. Treat `confidence ≥ 0.7` as reliable for production decisions, `0.4–0.69` as marginal (verify with a second query or tighter prompt), and `< 0.4` as unreliable. Example: `{"answer": "yes", "confidence": 0.94, "detected_count": 3}` means the model is 94% confident the count is exactly 3 — act on it; `{"answer": "indeterminate", "confidence": 0, "detected_count": 0, "indeterminate_reason": "nothing_detected"}` means no objects were detected at any confidence — do not infer "zero occurrences".

---

## Query-Type Maturity

| Query type | Maturity | Notes |
|---|---|---|
| **presence** (`object`) | GA | "Is there X in this video?" — most reliable query form. |
| **counting** (`object` + count intent) | GA | "How many X?" — returns `result.detected_count`. |
| **action** / **temporal** | Beta | "Does X happen during the first N seconds?" — duration-sensitive; result reliability depends on accurate video duration metadata. High `duration_mismatch` rate if source duration is missing. |
| **open-ended** | Rejected | Freeform prompts that don't resolve to a closed yes/no or count question are rejected immediately with `answer: "indeterminate"`, `indeterminate_reason: "unsupported_query_form"`, at **zero cost** — no credits billed. Rephrase as a presence or count query. |

**Agent guidance:**
- Prefer presence and counting queries for production pipelines.
- Action/temporal queries require the source video to have accurate `duration_s` metadata (populated after `POST /v1/videos/:id/complete`).
- If you receive `indeterminate_reason: "unsupported_query_form"`, rewrite the prompt before retrying — retrying the same open-ended form will always fail.

---

## Action pipeline verification

A ground-truth walking fixture is available for integration testing. Use it to verify the full pipeline (upload → analyze → result) against a known answer before deploying to production.

### Walking fixture

| Field | Value |
|-------|-------|
| **URL** | *(URL pending — clip `IMG_3281.MOV` not yet uploaded to CDN; see Slack thread for ETA)* |
| **CDN key** | `fixtures/walking-ground-truth.mov` on `d3silto12vjvss.cloudfront.net` (pending upload) |
| **Scene** | Outdoor walkway; several people walking. Clip is ~6–10 seconds. |
| **Ground truth** | At least 2 people visibly walking during the clip. |
| **Expected ideal API answer** | `POST /v1/analyses` with prompt `"Is someone walking?"` → `answer: "yes"`, `confidence ≥ 0.8`; with prompt `"How many people are walking?"` → `detected_count ≥ 2`, `confidence ≥ 0.7`. |

> **Note:** this fixture is for action-query validation. For basic presence testing, use the sandbox fixture (`POST /v1/sandbox` → `fixture_video_id`).

---

## Batch analyses & discounts

Run 2–10 prompts against the same video in a single request:

```http
POST /v1/analyses/batch
Authorization: Bearer pv_live_<key>

{
  "video_id": "video_01J...",
  "prompts": ["Is there a person?", "How many people are walking?"]
}
```

**Pricing rule:** the first prompt bills at full price; each additional prompt bills at **50%**. Credits are reserved at the discounted rate, so the discount is observable directly in the ledger (`GET /v1/credits` will show a smaller `seconds_delta` for analysis 2+).

**Worked example:** 6-second video at 1¢/s:
- Prompt 1 (full price): 6s × 1¢ = **6¢**
- Prompt 2 (50% off): 3s × 1¢ = **3¢**
- Prompt 3 (50% off): 3s × 1¢ = **3¢**
- Total for 3 prompts: **12¢** (vs 18¢ if billed separately)

**Response shape:**
```json
{
  "object": "analysis_batch",
  "id": "batch_...",
  "video_id": "video_01J...",
  "analyses": [
    { "id": "analysis_01J...", "status": "queued", ... },
    { "id": "analysis_01J...", "status": "queued", ... }
  ],
  "pricing": {
    "full_price_prompts": 1,
    "discounted_prompts": 1,
    "discount_pct": 50
  }
}
```

Each analysis in `analyses[]` can be polled individually via `GET /v1/analyses/{id}`.

**Listing / filtering analyses:** `GET /v1/analyses` supports `status`, `video_id`, `model`, `created_after`, `created_before` plus cursor pagination (`limit`, `starting_after`). The `status` filter takes the public vocabulary: `queued | preparing | analyzing | rendering | completed | failed | canceled` (use `status=analyzing` for currently-running analyses; unknown values → 400 `validation_failed`).

**Dry-run (`validate_only`):** pass `"validate_only": true` to parse all prompts and get per-prompt cost estimates without reserving credits or creating jobs (HTTP 200):

```json
{
  "object": "analysis_batch_preview",
  "video_id": "video_01J...",
  "prompts": [
    { "index": 0, "query": {...}, "parse_mode": "heuristic", "assessable": true,
      "estimated_seconds": 10, "estimated_cost_usd": 0.10, "discount_pct": 0 },
    { "index": 1, "query": {...}, "parse_mode": "heuristic", "assessable": true,
      "estimated_seconds": 5,  "estimated_cost_usd": 0.05, "discount_pct": 50 }
  ],
  "pricing": {
    "full_price_prompts": 1, "discounted_prompts": 1, "discount_pct": 50,
    "estimated_total_seconds": 15, "estimated_total_cost_usd": 0.15
  }
}
```

Estimates are `null` when the video has no known duration (still processing or URL-sourced before probe completes).

> **Note:** sending a `prompts` array to `POST /v1/analyses` returns a validation error with a pointer to this endpoint.

---

## Streaming (real-time video over WebRTC)

Streams analyze live video in real time — same prompt semantics and same result contract as file analyses, delivered per-frame over a signaling WebSocket.

### Lifecycle

```
POST /v1/streams → queued|ready → (WS join → offer/answer/ICE) → live → ended
```

1. `POST /v1/streams {prompt}` (secret key) → returns `signaling.url`, `ice_servers` (STUN + TURN with credentials), `limits`.
2. `POST /v1/client_tokens {scopes: ["streams:signal"], stream_id, ttl_s}` → `pvct_` token for the device. The signaling WS **never** accepts secret keys.
3. Connect `signaling.url?token=pvct_…`, send `join`, receive `ready` (or `queued {position}`), then standard WebRTC offer/answer + **bidirectional trickle ICE** (`ice {candidate}` messages flow both ways — the server trickles late-gathered srflx/relay candidates after its answer; keep consuming them).
4. `live` → `result {frame_num, detections}` per analyzed frame, `metering {elapsed_s, billed_s, session_remaining_s}` every 5s, `warning {remaining_s}` before credit exhaustion, `end {reason}`.

### Metering tick fields

Every 5s while live: `{type: "metering", elapsed_s, billed_s, session_remaining_s, balance_s}`.

- `session_remaining_s` — seconds remaining in **this session's** credit reservation (session cap), NOT your account credit balance. Account balance lives at `GET /v1/billing/credits` (`balance_seconds`).
- `balance_s` — **deprecated** alias of `session_remaining_s` (identical value). Removed **~2026-08-28**; migrate reads to `session_remaining_s`.
- `elapsed_s` / `billed_s` — live-clock seconds elapsed = billed (identical by construction; join/negotiation free).

### Result sampling (results are sampled, not per-frame)

Results are **sampled**, not emitted for every source frame — inference cadence is adaptive (roughly every 8th source frame under load). `frame_num` is the **source-frame index** the result was computed on (so gaps between consecutive `frame_num` values are normal), and `results_summary.result_frames` on the terminal resource counts the number of **result events emitted** — the two are different axes. Expect results at roughly 8–15/s depending on load; do not assume a fixed cadence.

### No-media warning (the server tells you when YOUR media is the problem)

If the WebRTC transport connects but **no decodable video frame arrives within 5 seconds**, the server pushes a `warning` event on the signaling WS (re-warned once at 15s, then quiet):

```json
{"type": "warning", "code": "no_media_frames", "transport_connected": true,
 "elapsed_s": 5, "packets_received": 312, "frames_decoded": 0, "hint": "…"}
```

Read `packets_received` to self-diagnose:
- `packets_received: 0` — your client is **not sending media** (track not attached, muted, or the capture source is dead).
- `packets_received > 0` with `frames_decoded: 0` — media is arriving but is **not decodable** (wrong codec — must be VP8 or H.264 — or the source produces no real frames, e.g. a canvas capture without an active draw loop).

If the session then ends without ever going live, the terminal resource records `end_reason: "media_timeout"` with the same counters in `failure_diagnostic`, and bills 0.

### Terminal results_summary

The ended stream resource carries `results_summary: {result_frames, frames, last_detections}`:

- `result_frames` — number of result events emitted over the session (sampled — see “Result sampling” above; this is NOT a source-frame count).
- `frames` — **deprecated** alias of `result_frames` (identical value). Removed **~2026-08-28**; migrate reads to `result_frames`.
- `last_detections` — the final `result.detections[]` rows, same contract as live results.

### Streaming result contract (identical to file analyses — transport never changes enums)

Each `result.detections[]` row:

- `answer`: `"yes" | "no" | "indeterminate"` — lowercase, same enum as file-API results
- `confidence`: 0..1; `term_confidences`: per-term map
- `prompt`: echoed **exactly as you submitted it** (byte-identical)
- `query_type`, `search_terms`, `prompt_intent`: same vocabulary as `POST /v1/parse`
- `frame_num`, `elapsed_s`, `session_id`, `session_fps`
- `timing`: server-side latency telemetry (per-stage breakdowns: inference, encode, per-hop p50s). Rich, production-grade, safe to log — field names may grow, existing names are stable.

### end_reason vocabulary (honest by construction)

| Reason | Meaning | Billed? |
|---|---|---|
| `completed` | Normal end after the session was live | live seconds |
| `canceled` | Ended before ever going live (client action) | 0 |
| `ice_failed` | WebRTC ICE never connected — see `failure_diagnostic` | 0 |
| `media_timeout` | Transport connected but no media/results flowed | 0 |
| `insufficient_credits` | Balance exhausted mid-stream | live seconds |
| `timeout` | `limits.max_session_s` cutoff reached | live seconds |
| `error` | Server-side failure | live seconds (0 if never live) |

**A stream that never went live is never `completed`** — the API enforces this. On `ice_failed`, the terminal resource carries `failure_diagnostic` (`{local_candidates, hint}`) — the server-side ICE candidate summary. If `local_candidates` shows only private addresses (`172.x`, `10.x`), the fault is server-side config; if it shows srflx/relay candidates, check your client's network path to the TURN servers in `ice_servers`.

### Client profiles that MUST work (and are CI-tested)

- Browser on home/office NAT (webcam) — the easy case
- **Datacenter/CI/edge-fleet clients: UDP-blocked, TURN-over-TCP:443 relay-only** — the demanding case. The server advertises a public host candidate and srflx/relay candidates (trickled when gathering outlasts the answer). Regression-tested every deploy with a relay-only aiortc client.

### Stream a file (regression harness recipe)

Re-running a known file through the live path is the natural streaming regression test. The examples repo ships `stream_file.py` (aiortc): loops a video file as the WebRTC source, applies your prompt, and audits the full session (candidates, states, results, billing) to JSON. See `python/streaming/` in the examples repo:

**https://github.com/Primate-Intelligence/primate-examples** (public — no auth needed)

### Billing

Billed per second of **live clock time** (join/queue/negotiation free), from the same credit ledger as uploads. Sessions that never go live bill exactly 0. Metering ticks arrive every 5s; `usage.billed_seconds` on the terminal resource is the reconciled charge.

---

## Pricing

Billing is metered in **source-clock video-seconds** — the duration of video analyzed, independent of resolution or fps. Current rates are discoverable (public, no auth):

```http
GET /v1/credit-pricing
```

Key fields:

| Field | Meaning |
|-------|---------|
| `price_per_second_cents` | Price per billed video-second, in cents |
| `signup_grant_seconds` | Free credit-seconds on signup / free-grant upgrade |
| `allowed_purchase_cents` | Preset top-up amounts |

**Cost of an analysis** = `usage.billed_seconds × price_per_second_cents`.

Worked example: a 6-second analysis at 1¢/second → `6 × 1 = 6` cents = **$0.06**.

Always read rates from the endpoint rather than hardcoding — pricing is config-driven and can change without an API version bump.

---

## API versioning

Every response — success, error, even 404 — carries an `X-Api-Version` header:

```
X-Api-Version: <package-version>+<git-sha7>
```

Example: `X-Api-Version: 0.1.0+a7c1993`. The value is computed once at boot and is stable for the lifetime of a deploy.

**Agent guidance:** if the value changes between two requests in the same session, a deploy happened mid-session. Re-check the [changelog](https://api.primateintelligence.ai/docs/changelog.md) before attributing new behaviour to a bug in your integration.

---

## Rate Limits

All public endpoints respond with `X-RateLimit-*` headers. Retry after `Retry-After` on `429`/`503`.

Sandbox/upgrade provisioning is additionally IP-rate-limited (3 sandbox provisions / IP / 24h; configurable global daily cap on free-grant upgrades).

---

## Changelog

All API behaviour changes are recorded in [`/docs/changelog.md`](https://api.primateintelligence.ai/docs/changelog.md), sorted newest-first. Subscribe via RSS: [`/docs/changelog.xml`](https://api.primateintelligence.ai/docs/changelog.xml).

This file and the changelog ship inside the API deploy artifact itself — `https://api.primateintelligence.ai/docs/agents.md` is the canonical copy, and `https://primateintelligence.ai/docs/agents.md` serves the same bytes (the website proxies the API). Spec, quickstart, and changelog therefore update atomically with the code they describe.

**Agent guidance:** check the changelog when `X-Api-Version` changes between requests in the same session — a deploy happened mid-session and a new feature or fix may affect your integration.
