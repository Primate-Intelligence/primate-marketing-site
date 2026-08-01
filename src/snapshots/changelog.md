# Primate Intelligence API — Changelog

Sorted newest-first. Agent-readable summary of shipped changes, broken by date.
Full field contracts: [openapi.json](./openapi.json) · [agents.md](./agents.md)

---

## 2026-07-31 — docs/SDK/MCP — DX artifact chain for the PRI-496 public capabilities (PRI-530)

- **Docs**: the mid-stream `update_prompt` → `prompt_updated` protocol is now fully documented (agents.md streaming lifecycle step 5 + openapi POST /v1/streams description), alongside the `status` event vocabulary (`prompt_context | combined_prompt | recalculating`) and the narrative opt-ins. `/llms.txt` gains a Live-narrative section and the client-token (pvct_) line.
- **TypeScript SDK `@primate-intelligence/sdk@0.3.0`**: real `Narrative` type (was a `{text?}` stub), `StreamCreateParams.options.narrative` + `recording`, `Stream.recording`, `streams.recording()`, `videos.listAnalyses()`, `analyses.rerun()`, `Analysis.rerun_eligible`, `Video.media`, `StreamDetection.narrative_update`, `connectStream` `onNarrative`/`onStatus` callbacks + `StreamStatusMessage`.
- **Python SDK `primate-intelligence==0.3.0`**: `streams.recording()`, `videos.list_analyses()`, `analyses.rerun()`; docstrings for the narrative opt-ins and the update_prompt protocol.
- **MCP server 0.3.0** (hosted `/mcp` + `@primate-intelligence/mcp`): 13 tools — adds `get_video` (status + media playback URL), `list_video_analyses`, `rerun_analysis`; `create_analysis` gains `narrative: true`. Output schemas corrected (`narrative {status, entries}`, `Video.media`).
- **Samples**: S6 (TS) and S7 (Python/aiortc) now exercise narrative, status events, mid-stream `update_prompt`, and (S6) session-recording retrieval.
- All shapes verified against the live dev API (recorded narrative stream with status events + update_prompt, 2026-07-31). No API behavior change — documentation/tooling parity only.

---

## 2026-07-31 — internal — web-app library routes accept public ids (PRI-496 Lane B)

- Internal-only (first-party web app; NOT part of the published contract): `GET /v1/user-videos` list rows now carry `public_id` (`video_…`) + `status`; the `/v1/user-videos/:id…` routes accept either the internal UUID or the public `video_` id; `PUT …/results` resolves public `an_` analysis ids to the internal job FK. Enables the web app's cutover to public `POST /v1/analyses` re-runs. Public OpenAPI document unchanged.

---

## 2026-07-31 — fix — narrative-opted-in public streams now activate the engine's narrative path (PRI-510/PRI-496)

- Public streams created with `options: {narrative: true}` now send the engine-config serialization (`narrative_enabled: true`) to the inference engine — previously the engine's narrative path never activated for public streams, so `narrative_update` objects (and the new `status` events) could never appear even with the feature enabled. Non-opted-in streams are unchanged. Public prompt echo now strips ALL internal serializations (byte-identical up to the first `|||`).

---

## 2026-07-31 — fix — stream recording key stored verbatim from the sidecar (PRI-496)

- The public recording linkage now stores the sidecar-reported S3 key **verbatim** (`{env}/recordings/…`) instead of stripping the env prefix. The sidecar's env label is the authoritative namespace of the object it wrote; the API's `NODE_ENV`-derived prefix disagrees on dev (Railway builds run `NODE_ENV=production`), which made dev recording URLs point at `prod/`. Caught in dev verification; prod behavior unchanged (labels agree there).

---

## 2026-07-31 — additive — free re-runs for platform-incident failures (PRI-493) + demo videos documented (PRI-496)

- **Failed analyses now carry `rerun_eligible: boolean`** — `true` when the failure occurred during a declared platform incident (or ops flagged it). Field is present only on `failed` analyses; absent elsewhere. Additive.
- **New `POST /v1/analyses/{id}/rerun`** — creates a **fresh analysis at no charge** from an eligible failed one (same video, prompt/query, model, options; new id; `usage` stays null — never billed). One free re-run per failed analysis; ineligible → `409 rerun_not_eligible` (new registry code). If the re-run's dispatch fails (503) the free re-run is NOT consumed. Normal capacity/brownout gates still apply.
- **`GET /v1/demo-videos` is now documented** in openapi.json/agents.md as a public (unauthenticated) onboarding surface: curated sample videos with precomputed results per example prompt. Documented subset is the stable contract.
- Decisions recorded for the remaining small gaps: stream limits already ship in the `POST /v1/streams` response (`limits`); `/v1/feedback` and `/v1/prompts` remain console-internal.

---

## 2026-07-31 — additive — stream session recordings + public status events (PRI-496)

- **`POST /v1/streams` accepts `recording: true`** (optional boolean, default false): opt into retrieval of the server-side session recording. The stream then carries a new nullable `recording: {status}` object (`recording` · `available` · `failed` · `none`); streams that don't opt in keep `recording: null` — no existing field changed.
- **New `GET /v1/streams/{id}/recording`** — returns `{object: "stream_recording", stream_id, url, expires_at, content_type, container}` with a **signed playback URL, fresh on every GET, 1-hour TTL** (sign-on-read, same semantics as `Analysis.artifacts`). The recording is a raw H.264 Annex-B elementary stream — lossless remux to MP4 with `ffmpeg -i in.h264 -c copy out.mp4`. 404 when recording wasn't enabled; 409 while the stream is active, when capture failed, or when nothing was stored.
- **New additive `status` server→client event on the `/v1/streams/{id}/signal` WS**: `{type: "status", status: "prompt_context"|"combined_prompt"|"recalculating", message?}` — the narrative-ordering vocabulary, forwarded ONLY for streams that opted into `options: {narrative: true}` (and only while the narrative feature flag is enabled). Closed set at the edge; internal serializations are stripped from `message`. Existing vocabulary (`ready/queued/answer/ice/live/result/prompt_updated/metering/warning/end/error/pong`) is untouched; non-opted-in streams see zero change.

---

## 2026-07-31 — additive — video library parity: source playback URL + per-video analysis history (PRI-496)

- Fixture videos (the sandbox plane's canned sample) return `media: null` — they are pseudo-objects with no real S3 source; a signed URL would 404.
- **`Video.media` is now populated** on `ready` videos: `{url, expires_at}` — a signed playback URL for the original source video, generated **fresh on every read** with a 1-hour TTL (sign-on-read, same semantics as `Analysis.artifacts`). Re-fetch the video for a new URL after expiry; old videos always stay playable. `media` is `null` for non-ready videos and rows without a stored source object. New nullable field — additive, no existing field changed.
- **New `GET /v1/videos/{id}/analyses`** — lists every analysis run against a video (newest first), same list envelope + filters (`status`, `limit`, `starting_after`) as `GET /v1/analyses`. Resource-nested spelling of `GET /v1/analyses?video_id={id}`; both work. This plus `media` plus `artifacts` gives the public plane full video-library semantics (list, replay, per-video result history).

---

## 2026-07-30 — breaking (gated) — GitHub OAuth gate on the free grant upgrade (PRI-479)

- **`POST /v1/keys/upgrade` now requires a verified GitHub account** when the gate is enabled (it is, on dev + prod). Calling without a `github_token` returns **`403 github_verification_required`** whose `details` carry the full device-flow bootstrap: `client_id`, `device_code_url`, `access_token_url`. Complete GitHub's standard device flow (no scopes requested — identity only) and retry with `{"github_token": "gho_..."}`.
- **One free grant per GitHub account, ever.** The numeric GitHub account id is stamped on the user row (DB unique index); a GitHub account that already claimed its grant gets **`409 github_account_already_used`**. The OAuth token itself is verified with GitHub and discarded — never stored.
- New error codes in the §15 registry: `github_verification_required` (403), `github_token_invalid` (401), `github_account_already_used` (409).
- Why: the upgrade was IP-rate-limited only — a key-churning agent rotating IPs could harvest unlimited 6,000s GPU grants. GitHub's own abuse controls now bound free grants at one per real account; IP caps remain as secondary defense.
- Sandbox provisioning (`POST /v1/sandbox`) and the billed device-code claim flow (`POST /v1/keys/request`) are unchanged.

---

## 2026-07-30 — fix — internal/fixture accounts excluded from product metrics (PRI-472)

- **New `users.is_internal` flag** (migration 036: `boolean NOT NULL DEFAULT false` + partial index + pre-filtered `analytics_users` view). Backfilled for the Anthropic directory-review fixture, all loadtest accounts, and E2E fixtures.
- **All admin analytics endpoints now exclude internal accounts**: `/v1/admin/analytics/growth` (totals, signups, activation, W1 retention, MRR/ARR/paying users, North-Star minutes), `/v1/admin/pmf` (signups_total, activation funnel, repeat-user retention), `/v1/admin/analytics/credits` (card attach rate, refill conversion, API activation), `/v1/admin/analytics/verticals` (user vertical/replacing breakdowns).
- **Clerk `user.created` webhook** now propagates `public_metadata.internal_fixture: true` → `users.is_internal`, so future fixture accounts are excluded at creation.
- Historical note: metric values step down slightly vs. previous reports (fixture activity was previously counted — e.g. 105 loadtest users on prod). This is a correction, not a regression.
- Admin response fields only — no public API schema change.

---

## 2026-07-30 — additive — API host agent onramp: GET / index + GET /robots.txt (PRI-492)

- **`GET /` now returns a JSON index** instead of a 404 error envelope: `{name, description, openapi, docs, llms, agents, changelog, mcp, sandbox, health}` — an agent probing the API host root gets pointers to every machine-readable surface (OpenAPI spec, llms.txt, agents.md, MCP endpoint, one-POST sandbox key).
- **`GET /robots.txt` now returns 200 text/plain** (allow all) instead of the 404 JSON envelope, and points crawlers at `/llms.txt`, `/v1/openapi.json`, and `/docs/agents.md`.
- Both endpoints are unauthenticated. No existing route changed; no schema change.

---

## 2026-07-30 — fix — GET /v1/models: darwin-1.3 capabilities.streaming corrected to true (PRI-496)

- The model catalog still said `capabilities: {streaming: false}` from before real-time streams shipped. Streaming has been live for weeks (`POST /v1/streams`); the flag now says so. Data correction only — no schema change.

---

## 2026-07-30 — additive — Analysis.artifacts now populated: annotated result video URL (PRI-496)

- **`GET /v1/analyses/{id}` (and list) now populates `artifacts`** for completed analyses that produced an annotated result video: `{annotated_video_url, expires_at}` per the existing `ArtifactsSchema`. The URL is a **fresh 1-hour signed CDN link generated on every read** — when it expires, re-fetch the analysis for a new one (old results always stay retrievable). Analyses without an annotated video (and all non-completed statuses) continue to return `artifacts: null`.
- The schema stub has been in the contract since P3 — this makes it live. Zero breaking changes; agents that treated `artifacts` as always-null should start reading it.

---

## 2026-07-30 — additive — narrative over the public API: options.narrative on analyses + streams (PRI-510)

- **`POST /v1/analyses` (and `/batch`) `options.narrative: true` is now honored.** The completed analysis carries a populated `narrative` object per the existing `NarrativeSchema`: `{status: "generating"|"ready"|"failed", entries: [{t_s, text}]}` — timestamped event sentences generated after completion (poll `GET /v1/analyses/{id}`; the `analysis.completed` webhook may still show `status: "generating"`). Omitted/false preserves the previous behavior exactly (`options: {narrative: false}`, `narrative: null`). Narrative is **included in the analysis price** — no surcharge, no usage-shape change.
- **`POST /v1/streams` accepts `options: {narrative: boolean}`** (previously rejected as an unknown field). Opted-in streams receive a `narrative_update` object (`{t_s, text}`) on result-frame detections whenever the engine produces a new sentence — event-driven, not per frame; the key is absent on frames without one. Disabled/omitted streams never see it. Terminal `results_summary.last_detections` continues to strip it (frozen shape).
- **Test mode (`pv_test_`)**: opted-in canned analyses return a deterministic canned narrative (`status: "ready"`) — fixture plane, zero quota.
- The schema fields (`options.narrative`, nullable `narrative`, `NarrativeSchema`) were already in the contract as forward-compatible stubs — this release makes them live. Zero breaking changes (oasdiff clean).

---

## 2026-07-30 — internal — inference-WS replacement-storm alerts now reach Sentry (PRI-418); load-test metric renamed to metadata_ratio (PRI-360)

- **Replacement-storm detector alerts to Sentry** (PRI-418): when inference-WS replacements exceed the threshold (default 10/60s), the existing error-level structured log is now also sent via `Sentry.captureMessage` at error level, so storms like the 2026-07-02 duplicate-sidecar incident page instead of only landing in stdout. Cooldown unchanged (max one alert per 5 min). No public API contract change.
- **Load-test harness: `metadata_ratio` metric added** (PRI-360): the k6 shared metrics library gains a `metadata_ratio` Rate (fraction of incoming sidecar WS messages that are `metadata` frames), wired into `09-stream-baseline.js`. Replaces the informal "ack ratio" name — the counted frames are metadata, not acks. Tooling-only; no runtime behaviour change.

---

## 2026-07-29 — additive — batch discount is config-driven and served by GET /v1/credit-pricing (PRI-508)

- **`GET /v1/credit-pricing` now returns `batch_discount_pct`, `batch_min_prompts`, and `batch_max_prompts`.** The `POST /v1/analyses/batch` discount (each prompt after the first) was a hardcoded constant that could drift from the documented "50%"; it now lives in the same `credit_price_config` row as every other price knob and is served publicly here. **Read the discount from this endpoint instead of hardcoding it** — a pricing change is a config update, not an API version bump. Current values match shipped behaviour exactly: `batch_discount_pct: 50`, `batch_min_prompts: 2`, `batch_max_prompts: 10`.
- **`discount_pct` in batch responses** (`analysis_batch.pricing`, `analysis_batch_preview.prompts[].discount_pct`) now reflects the configured value (still `50` today). The preview per-prompt field is documented as an integer rather than the literal set `0 | 50` — `0` still means the full-price first prompt.
- No behaviour change at current config: batch pricing, bounds, and copy are byte-identical until the config row changes.

---

## 2026-07-29 — fix — /v1/test-fixture video URL follows the app.* replatform; anonymous sandbox IP cap now per-client

- **`GET /v1/test-fixture` `test_video_url` updated** to `https://app.primateintelligence.ai/empty-state/forklift-demo.mp4`. The web replatform moved the product SPA (which serves the fixture file) to `app.primateintelligence.ai`; the old apex path stopped resolving when the apex became the marketing site. If you pinned the old URL in CI, update it — the file bytes are unchanged. The canonical pinned demo asset `https://primateintelligence.ai/demos/empty-state/forklift-demo.mp4` is unaffected.
- **`POST /v1/sandbox` IP cap fixed to key on the real client IP.** Previously the daily provision cap could key on a shared proxy hop, which made the limit far stricter than documented for users behind the same edge. No contract change — same `sandbox_limit_exceeded` error, same documented 3/day per-IP semantics, now enforced per actual client.

---

## 2026-07-29 — docs-only — POST /v1/parse documented in openapi.json; GET /v1/analyses status-filter vocabulary documented

- **`POST /v1/parse` is now in the OpenAPI document** (PRI-496 P0). The endpoint has been live for months (stateless prompt compiler: `{prompt}` → `{compiled_query, parse_mode: "haiku"|"heuristic"}`; auth optional; 30 req/min per IP; errors `empty_prompt` 400 / `parse_failed` 422 / `parse_unavailable` 503) but was undocumented — for agents, undocumented is nonexistent. No behavior change. Also added to the `/llms.txt` key-endpoints list.
- **`GET /v1/analyses` `status` filter vocabulary documented**: `queued | preparing | analyzing | rendering | completed | failed | canceled` (§13.2). The filter has always worked (unknown values → 400 `validation_failed`); its accepted values were just not written down. Documented in the parameter description — the machine schema stays `type: string`, so nothing tightens contractually. Use `status=analyzing` for currently-running analyses.
- Zero contract changes — the public surface is frozen; this is documentation of already-shipped behavior.

---

## 2026-07-28 — additive — SDK 0.2.0 (TS + Python) and MCP 0.2.0: full parity with the July API rounds

- **TypeScript SDK `@primate-intelligence/sdk@0.2.0`** (breaking — type corrections): `AnalysisUsage` fixed to the real contract `{billed_seconds, credit_balance_after}`; `StreamEndReason` fixed (adds `canceled`/`ice_failed`/`media_timeout`, drops never-returned `client_disconnect`); `video_duration_s` nullable; `Analysis` gains `livemode` + `origin`. New: `client.credits.retrieve()` (`GET /v1/credits`), `client.creditPricing.retrieve()`, `analyses.validateOnly()`, `analyses.createBatch()`/`validateBatch()`, `detected_count` + `indeterminate_reason` on results, typed streaming contract in `/browser` (`session_remaining_s` metering, `no_media_frames` warning union, typed detections, `failure_diagnostic`, typed `results_summary`). Migrate off the `balance_s`/`results_summary.frames` aliases before their ~2026-08-28 removal.
- **Python SDK `primate-intelligence==0.2.0`** (additive): `client.credits` + `client.credit_pricing` resources, `analyses.validate_only()`, `analyses.create_batch()`/`validate_batch()`, docstrings updated to the real result/streaming contracts.
- **MCP 0.2.0 (hosted `/mcp` + npm `@primate-intelligence/mcp`)**: three new tools — `validate_analysis` (free dry-run with cost estimate), `create_analysis_batch` (batch discount), `get_credits` (transaction ledger). `get_analysis`/`wait_for_analysis` descriptions now document `detected_count`, `indeterminate_reason`, nullable duration, and the usage snapshot. The npm package catches up with the hosted server: every tool declares `outputSchema` and returns `structuredContent`; `wait_for_analysis` returns the `{analysis, retry}` envelope (the legacy `_mcp_note` field merged into the analysis resource is gone from the npm package too).

---

## 2026-07-28 — failure_diagnostic hint wording: customer-appropriate, no internal references

- **`failure_diagnostic.hint` (on `end_reason: "ice_failed"`) reworded.** The hint previously referenced an internal server environment variable — meaningless (and confusing) to API consumers. It now states plainly which side the fault is likely on and what to do: when the server did not advertise a publicly reachable network candidate → *“server-side configuration issue — nothing to change on your end; retry, and contact support if it persists”*; when the server did advertise public candidates → *“check your network allows UDP or TCP/443 outbound and that your client uses the TURN servers in `ice_servers`”*. Field shape unchanged (`{local_candidates, hint}`); only the hint text changed. Same sweep reworded the transient status messages sent on the signaling WS (`inference_unavailable`, capacity/restart rejections) to remove internal jargon.

---

## 2026-07-28 — Metering tick + results_summary field renames (deprecation aliases until ~2026-08-28)

- **Metering tick: `balance_s` renamed to `session_remaining_s`** (Streaming DX Finding 2). The value was always the seconds remaining in **this session's** credit reservation (the session cap) — the old name read like account credit balance, which lives at `GET /v1/billing/credits` (`balance_seconds`). Every tick now carries BOTH `session_remaining_s` (canonical) and `balance_s` (deprecated alias, identical value). **`balance_s` will be removed ~2026-08-28** — migrate reads to `session_remaining_s`.
- **Terminal `results_summary`: `frames` renamed to `result_frames`** (Streaming DX Finding 3). Results are **sampled**, not per-source-frame (adaptive inference cadence, roughly every 8th source frame under load), so the count is the number of result **events emitted** — `result_frames` says that; `frames` implied a source-frame count. Both fields present (identical value); **`frames` will be removed ~2026-08-28** — migrate reads to `result_frames`.
- **Docs: result-sampling semantics now documented** in agents.md — `frame_num` on live results is the *source-frame index* (gaps between consecutive values are normal); `results_summary.result_frames` counts result events; expect roughly 8–15 results/s depending on load.
- No behavior changes — both renames are additive aliases for 30 days, then the deprecated names drop.

---

## 2026-07-28 — No-media warning: the server now tells you when your media is the problem

- **New signaling-WS event: `warning {code: "no_media_frames"}`** — when the WebRTC transport connects but no decodable video frame arrives within 5 seconds, the server pushes `{type:"warning", code:"no_media_frames", transport_connected:true, elapsed_s, packets_received, frames_decoded, hint}` (re-warned once at 15s, then quiet; canceled by the first decoded frame). Previously the server stayed silent for the full media-timeout window (~50s) with zero client-visible signal. `packets_received` distinguishes the two failure classes: `0` = your client is not sending media (track dead/muted); `>0` with `frames_decoded: 0` = media arrives but is not decodable (wrong codec, or a source producing no real frames — e.g. canvas capture without a draw loop).
- **`end_reason: "media_timeout"` now carries the media counters in `failure_diagnostic`** when a connected-but-no-media session ends without ever going live. Billed 0, as before.
- Existing `warning {remaining_s}` credit-exhaustion event is unchanged (distinguish by the `code` field — credit warnings have no `code`).

---

## 2026-07-28 — TURN-over-TLS (`turns:`) relay advertised for TLS-only egress networks

- **ICE server list now always includes a `turns:<host>:443?transport=tcp` relay** in session credentials. Twilio's NTS token response carries `turn:` relays (UDP/TCP 3478, TCP 443) but no `turns:` URL, so clients behind TLS-only firewalls (datacenter/corporate egress allowing only TLS on 443) could never reach a relay and sessions failed with `ice_failed`. The API now synthesizes the `turns:` entry from the existing relay host, reusing its ephemeral credentials. No-op when the provider already returns a `turns:` URL or in STUN-only fallback. No request/response field changes — the `ice_servers` array simply gains one entry.

---

## 2026-07-28 — MCP tools declare outputSchema + structuredContent; wait_for_analysis timeout shape cleanup

- **All 7 hosted MCP tools now declare an `outputSchema`** (in `tools/list` on `POST /mcp` and on the static server card at `/.well-known/mcp/server-card.json`). Schemas are generated from the same Zod DTOs that validate the public /v1 responses (`src/dto/schemas.ts`), so they cannot drift from the real contract. Per the MCP spec, every tool result now also carries `structuredContent` conforming to its declared schema (the SDK validates each result at runtime); the human-readable JSON text content is unchanged.
- **`wait_for_analysis` response shape changed** (privacy-audit finding F-1): the tool now returns `{ analysis, retry }` — the analysis resource unmodified under `analysis`, and `retry: null` on terminal states or `retry: { reason: "timeout", note }` when the wait expired. The old behavior merged an undocumented `_mcp_note` field into the analysis object on timeout, mutating a documented resource shape. Agents reading the analysis should use `result.analysis` (or `structuredContent.analysis`).
- **`query` field description** on analysis outputs now states explicitly that it is the compiled, deterministic interpretation of the caller's own prompt — a transparency feature (privacy-audit finding F-2, documentation only; no data change).
- REST API surface unchanged — this release only affects the MCP endpoint metadata and the MCP-layer `wait_for_analysis` envelope.

---

## 2026-07-28 — OpenAI apps domain verification + explicit destructiveHint on read-only MCP tools

- **New public endpoint: `GET /.well-known/openai-apps-challenge`** — returns the OpenAI apps domain-verification challenge token (`OPENAI_APPS_CHALLENGE_TOKEN` env var) as raw `text/plain`; 404 when unset. Unauthenticated by design — OpenAI's plugin/apps portal fetches it to verify domain ownership (PRI-475). Not part of the product API surface.
- **MCP tool annotations: explicit `destructiveHint: false`** added to all five read-only tools (`get_analysis`, `wait_for_analysis`, `list_models`, `get_usage`, `get_test_fixture`) in both the live `tools/list` response and the static server card at `/.well-known/mcp/server-card.json`. Previously the hint was omitted (spec default is `true`), which OpenAI's tool scanner flagged. No changes to tool names, descriptions, or input schemas.

---

## 2026-07-28 — Streaming DX: server ICE fix + trickle, honest end reasons, unified result contract, public examples repo

### Transport (the critical fix)
- **Server-side ICE candidates are now reachable from anywhere** — the streaming server advertises its public address as a host candidate and **trickles late-gathered srflx/relay candidates** to the client as `ice` messages after the answer SDP (previously candidates that outlasted the bounded gathering window were silently dropped, so relay-only clients — datacenters, CI, UDP-blocked networks, strict NATs — stalled in `ice: checking` until timeout while browser clients survived via peer-reflexive discovery). Keep consuming `ice {candidate}` messages after `answer`.
- **Relay-only regression client in CI** — every deploy is tested with an aiortc client that offers only TURN relay candidates (TURN-over-TCP:443), the datacenter/edge-fleet profile.

### Honest `end_reason` (breaking-adjacent: two new enum values)
- **New values: `ice_failed`, `media_timeout`** on `stream.end_reason` (WS `end {reason}` and the terminal Stream resource). A session that never went live is **never** `completed` — enforced server-side.
- **New nullable field: `failure_diagnostic`** on the Stream resource — on `ice_failed`, carries `{local_candidates, hint}` (the server-side candidate summary) so transport failures are debuggable from the API alone.
- Billing unchanged: never-live sessions bill exactly 0 (join/negotiation/queue free).

### Streaming result contract unified with file analyses (breaking for undocumented internals)
- `result.detections[].answer` is now **lowercase `yes|no|indeterminate`** — the same enum as file-API results (was `"Yes"/"No"`, an internal casing leak; enums never vary by transport).
- `result.detections[].prompt` now echoes **exactly what you submitted** — the internal `|||COMPILED_QUERY:<base64>` serialization no longer leaks into the public field.
- Latency telemetry (`inference_ms`, `server_elapsed_ms`, per-hop p50s, per-stage `latency` breakdown) is grouped under a documented **`timing`** object. Internal scheduling fields (`queue_fill`, `queue_length`, `is_warm`, `video_enabled`) are no longer emitted.
- Same normalization applies to `results_summary.last_detections` on the terminal resource.

### Docs & examples
- **Public examples repo**: https://github.com/Primate-Intelligence/primate-examples — Python streaming client (aiortc, the "stream a file" recipe), browser webcam example, relay-only CI harness. The old private-repo examples link in the streaming guide is gone.
- **agents.md gains a full Streaming section** — lifecycle, signaling protocol incl. server trickle, the streaming result contract, the honest end_reason vocabulary, the datacenter client profile, and billing semantics.

---

## 2026-07-27 — PRI-482 round 8: one-clock docs — canonical docs served by the API, website proxies them, hardened doc-sync CI gate, count-confidence semantics clarified

### Documentation architecture (the "separate clocks" fix)
- **Single source of truth** — `docs/agents.md` and `docs/changelog.md` ship inside the API deploy artifact and are served at `https://api.primateintelligence.ai/docs/agents.md` / `/docs/changelog.md`. The website (`https://primateintelligence.ai/docs/agents.md` and `/docs/changelog.md`) now **proxies these API routes** instead of serving a hand-copied duplicate. Spec, quickstart, and changelog update atomically with the code they describe — there is no copy step left to go stale.
- **RSS moves to the API** — `GET /docs/changelog.xml` is generated from `docs/changelog.md` at request time, so the feed can never drift from the changelog it is derived from.
- **Hardened doc-sync CI gate** — a diff touching `src/routes/**`, `src/dto/paths.ts`, or billing/pricing services (`credit-ledger-service`, `billing-service`, `usage-meter-service`, `quota-service`) now fails CI unless **both** a docs surface (`docs/agents.md` or `docs/openapi.json`) **and** `docs/changelog.md` move in the same diff. Previously route changes required only one doc surface and billing changes required none.
- **Nightly drift monitor** — an external probe diffs the website-served docs against the API canonical and alerts on any byte mismatch (belt-and-suspenders against pipeline-level failures CI can't see).

### Contract clarification
- **Count-query confidence** — agents.md (Result Contract + Count queries sections) and `llms.txt` now state explicitly: for count queries, `confidence` applies to the detected count itself — it is the model's confidence that `detected_count` is the correct number, not merely that something was detected.

---

## 2026-07-27 — PRI-482 round 7: batch validate_only, enriched batch pricing, llms.txt batch listing, docs-atomicity CI gate, result-contract confidence cross-reference

### New capabilities
- **`POST /v1/analyses/batch` with `validate_only: true`** — dry-run for batch: parses all prompts, returns `analysis_batch_preview` (HTTP 200) with per-prompt `query`, `parse_mode`, `assessable`, `estimated_seconds`, `estimated_cost_usd`, and `discount_pct`; plus batch-level totals `estimated_total_seconds` and `estimated_total_cost_usd`. No credits reserved, no jobs created. Estimates are `null` when the video has no known duration.
- **Enriched batch pricing on real create** — `POST /v1/analyses/batch` response `pricing` block now includes `estimated_total_seconds` and `estimated_total_cost_usd` (null when duration unknown), so callers can see the expected cost without a separate `validate_only` round-trip.

### Docs & CI
- **`llms.txt` batch endpoint** — `POST /v1/analyses/batch` added to the `## Key endpoints` section.
- **Docs-atomicity CI gate** — `scripts/changelog-gate.ts` now enforces a second rule: any diff touching `src/routes/**` or `src/dto/paths.ts` must also update `docs/agents.md` or `docs/openapi.json`. Bypass with `[skip-docs-gate]` in a commit message.
- **Result Contract confidence cross-reference** — `result.confidence` bullet in agents.md "Result Contract" section now notes that for count queries confidence reflects detection certainty (not count certainty), with a link to the Count queries section.
- **agents.md batch section** — added `validate_only` documentation with worked JSON example.
- **OpenAPI** — `validate_only` added to `CreateAnalysisBatchRequest`; `AnalysisBatchPreview` response schema added; `AnalysisBatch.pricing` updated with estimated fields.

---

## 2026-07-27 — PRI-482 round 6: batch discounts real, confidence semantics, key lifecycle in OpenAPI, 404 envelope, ledger source_type, historical balance freeze

### New endpoints
- **`POST /v1/analyses/batch`** — submit 2–10 prompts against the same video in one request. First prompt billed at full price; each additional prompt billed at **50%**. Credits reserved per-prompt at the discounted rate (observable directly in `GET /v1/credits` ledger). Response includes `analyses[]` array + `pricing: {full_price_prompts, discounted_prompts, discount_pct: 50}`. Registered in OpenAPI spec and documented in agents.md "Batch analyses & discounts" section.
- **`POST /v1/keys/upgrade`** and **`POST /v1/keys/request` / `GET /v1/keys/request/{code}`** now registered in `docs/openapi.json`. These routes existed but were absent from the spec — they are the first two calls any agent makes.

### Error handling
- **404 catch-all** — unknown routes previously returned the framework-default `{"message":"Route ... not found"}`. They now return the standard typed error envelope (`code: "resource_not_found"`, same shape as all other errors).
- **`POST /v1/analyses` with `prompts` array** now returns a helpful validation error pointing to `POST /v1/analyses/batch` instead of a generic "Unknown field".

### Billing fixes
- **`source_type: "analysis"` for analysis debits** — credit ledger rows for public-API analyses were labelled `source_type: "upload"`. They are now labelled `source_type: "analysis"` (new DB constraint value). Migration 077 backfills existing reservation and transaction rows in dev. Agents reading `GET /v1/credits` will see `source_type: "analysis"` on analysis debits going forward.
- **Historical `credit_balance_after` frozen** — analysis rows settled before migration 075 had a null `balance_after_seconds` snapshot, causing `credit_balance_after` to drift as later analyses ran. Migration 078 stamps those rows with the current account balance, freezing the value. `credit_balance_after: null` (`snapshot_unavailable`) now only appears when the account balance itself is unavailable.

### Docs & contract
- **Confidence semantics for count queries** — added a paragraph to agents.md "Count queries — the contract" section: `confidence` is the aggregate detection confidence (max of per-term values, [0,1]); forced to 0 when `answer: "indeterminate"`; `≥0.7` reliable, `0.4–0.69` marginal, `<0.4` unreliable.
- **Changelog link in agents.md** — added a dedicated "Changelog" section linking `/docs/changelog.md`.
- **`snapshot_unavailable` semantics** — `usage.credit_balance_after: null` documented in agents.md Result Contract.
- **Walking fixture section** added to agents.md "Action pipeline verification" (clip URL pending upload).

### Migrations applied to DEV
- `077_analysis_source_type.sql` — adds `'analysis'` to `credit_reservations.source_type` constraint; backfills existing rows.
- `078_freeze_historical_balance_after.sql` — stamps null `balance_after_seconds` on settled reservations with current account balance.

---

## 2026-07-27 — PRI-480 round 5: agent DX — versioned responses, immutable billing snapshot, truthful origin, pricing discovery

### Breaking changes
- **`analysis.origin` enum changed: `user` → `api`, new value `console`.** The round-2 entry below introduced `origin: "user" | "system"` derived at read time from `source_type` — that heuristic misclassified console (dashboard) uploads as `system` and recorded nothing. `origin` is now stamped truthfully at job creation: `api` (public API), `console` (dashboard upload), `system` (internal — auto-probe, fixture seeding, run_prompt). Legacy rows without the column fall back to the heuristic (`public_api*` → `api`, `upload` → `console`, else `system`). The field shipped yesterday with near-zero consumers.

### New fields & headers
- **`X-Api-Version` response header** — every response (including errors) carries `<package-version>+<git-sha>`. If the value changes mid-session, a deploy happened — re-check this changelog before assuming a bug.
- **`usage.credit_balance_after` is now immutable.** Previously it re-read the live account balance at GET time, so an old analysis's value mutated as later analyses ran. It is now a point-in-time snapshot stamped at settlement (`credit_reservations.balance_after_seconds`). Analyses settled before this deploy fall back to the live balance (previous behaviour).

### Billing invariant
- **System-initiated analyses are never billed.** `origin: "system"` jobs (e.g. internal run_prompt) never reserve or settle credits — enforced by a CI test auditing every `reserveCredits` call site.

### Docs & discoverability
- **`GET /v1/credit-pricing`** (public, no auth) is now in the OpenAPI spec, the [agents.md](./agents.md) Pricing section, and `/llms.txt`. Returns `price_per_second_cents`, `signup_grant_seconds`, `card_grant_seconds` — cost of an analysis = `usage.billed_seconds × price_per_second_cents`.
- **Count-query contract** section added to [agents.md](./agents.md): `detected_count` is only meaningful when `answer` is determinate; success/failure examples are schema-validated in CI.
- **Changelog is now CI-enforced** — any push/PR diff touching `src/**` must also update this file with a well-formed topmost `## YYYY-MM-DD — <title>` entry (`scripts/changelog-gate.ts` + `changelog-gate.yml`).
- **Late note (shipped earlier today in commit df7f0ce without an entry):** `GET /docs/agents.md` and `GET /docs/changelog.md` are now served publicly — `/llms.txt` referenced both but they 404'd.
- Changelog re-sorted newest-first (the 2026-07-24/22/18 entries were filed below 2026-07-09).

---

## 2026-07-27 — PRI-480 round 2: result invariants, synchronous metadata, billed_seconds, origin

### New fields
- **`analysis.origin`** — `"user"` (submitted via the public API) or `"system"` (generated internally, e.g. auto-probe or fixture seeding). Agents should normally only act on `origin: "user"` analyses.

### Behaviour fixes
- **Result consistency invariants.** A completed analysis returning `detected_count: 5` + `answer: "indeterminate"` + `indeterminate_reason: "nothing_detected"` is now repaired at the API boundary: (a) `nothing_detected` forces `detected_count` to 0, (b) `indeterminate` forces `confidence` to 0, (c) determinate `yes`/`no` answers never carry an `indeterminate_reason`.
- **Video metadata populated synchronously on `/complete`.** `POST /v1/videos/:id/complete` now awaits the ffprobe enrichment (15 s timeout) before building the response, so `duration_s`, `width`, `height`, and `fps` are present in the response body and in immediate `GET /v1/videos/:id` reads. On timeout the endpoint returns the row as-is and enrichment continues in the background.
- **`billed_seconds` on list analyses now correct.** The `GET /v1/analyses` list was querying `credit_reservations.job_id` (a column that does not exist). Fixed to join via `jobs.reservation_id → credit_reservations.id`, matching the single-GET path. `usage.billed_seconds` is now populated on all settled list items.

### New endpoints
- **`GET /llms.txt`** — plain-text LLM index following the llms.txt convention. No auth required. Lists the API base URL, `/docs`, `/openapi.json`, and changelog. Lets AI coding assistants discover the API surface without a browser.

### Docs
- **Query-type maturity note** added to [agents.md](./agents.md): presence and counting queries are mature/GA; action and temporal queries are beta (duration-sensitive); open-ended prompts are rejected with `unsupported_query_form` rather than billed.

---

## 2026-07-27 — PRI-480: API hardening, credits, and fixture parity

### Breaking changes
None.

### New fields
- **`result.video_duration_s`** — now `number | null` (was always `number`). Returns `null` when the source video duration could not be determined (short uploads, metadata-less files). Agents must null-check this field.
- **`result.indeterminate_reason`** — why the answer is `indeterminate`. Enum:
  - `low_confidence` — model saw something but confidence was below threshold; try a more specific prompt.
  - `nothing_detected` — all confidence scores were 0; no subject detected in any frame.
  - `unsupported_query_form` — open-ended or freeform query; rephrase as a closed yes/no or count question.
  - `duration_mismatch` — inference result duration disagrees with source video duration (>20%); result is untrusted.
- **`result.detected_count`** — integer count for count-intent queries ("how many X…"). `null` on yes/no queries.

### New endpoints
- **`GET /v1/credits`** — returns `{ balance_seconds, grant_seconds, used_seconds, transactions: [...] }`. Per-analysis transaction history. Lets agents audit every charge independently. No parameters needed; key-scoped.

### New parameters
- **`POST /v1/analyses` → `validate_only: boolean`** — parse + estimate cost, no GPU, no credits deducted. Returns `AnalysisPreview` with `estimated_cost_seconds`, `query_type`, and `answerability` signal. Use before committing to an analysis.

### Behaviour fixes
- **Action pipeline duration now deterministic.** The action query path (`how many X…`) was returning GPU wall-clock time as `video_duration_s` instead of source video duration. For a 6s video this produced 40–75s billing. Root cause: `duration_seconds` was absent from the action result dict in the inference server; the API fell back to GPU wall-clock. Fixed in inference I-1 (inference commit `4e0825a`).
- **`detected_count` now populates for action queries.** The count was computed by inference but not forwarded in the callback payload. Fixed in inference I-2.
- **`indeterminate_reason` forwarded from inference.** When inference explicitly sets a reason, the API now respects it rather than re-classifying.
- **Duration invariant cross-check.** If inference returns a duration >20% different from the admitted source duration, the API flags the result `indeterminate` with `indeterminate_reason: duration_mismatch` rather than silently returning wrong timing.
- **Open-ended query gate.** Submitting a query the model cannot answer (open-ended form) now returns `answer: indeterminate`, `indeterminate_reason: unsupported_query_form` immediately, at zero cost, instead of burning GPU credits and returning an unreliable result.
- **Video metadata probed at upload-complete.** `duration_seconds`, `width`, `height`, `fps` are populated on the video object immediately after `POST /v1/videos/:id/complete`. Fire-and-forget ffprobe enrichment runs after response is sent for non-faststart files.

### Test fixture update
`GET /v1/test-fixture` now returns a `fixtures[]` array with two entries:
- `presence` — forklift yes/no (existing fixture, unchanged)
- `action` — forklift count query; assert `detected_count >= 1`

Legacy flat fields (`test_video_url`, `test_prompt`, `expected_answer`, `expected_confidence_min`) preserved for backwards compatibility.

---

## 2026-07-24 — PRI-477: billing cap, detected_count, error envelope

### New fields
- **`result.detected_count`** — integer count on count-intent queries (object path).
- **`analyses.list` response** — includes `billed_seconds` per analysis.
- **Error envelope** — all errors now return `{ error: { code, message, request_id } }` (was bare `{ error, message }`).

### Behaviour fixes
- **Billing cap** — per-analysis billing is capped at the source video duration. A slow GPU run (warmup, recompile) cannot overbill beyond the video length.
- **`answer: indeterminate`** — when confidence is 0 and all term confidences are 0 the answer is now `indeterminate` instead of `no`. A `no` that can't be substantiated is indistinguishable from a model that saw nothing.
- **`usage` deprecated** — the `GET /v1/usage` response is kept but `usage` inline on analysis objects has moved to `GET /v1/credits`.

---

## 2026-07-22 — PRI-476: inline usage, url-ingest probe, liveProgress

### New fields
- **`analysis.usage`** — inline `{ billed_seconds, credit_balance_after }` on completed analyses. Agents no longer need a second GET /v1/usage round-trip.
- **URL-ingest video probe** — `POST /v1/videos` with `source_url` now runs the same metadata probe that upload-complete uses.

---

## 2026-07-18 — Public API v1 GA

Initial public release of the REST API with:
- `POST /v1/sandbox` — instant `pv_test_` key, no email, no card
- `POST /v1/keys/upgrade` — upgrade to `pv_live_` + 6,000s free grant
- `POST /v1/videos` — presigned upload or URL ingest
- `POST /v1/analyses` — submit prompt + video → analysis
- `GET /v1/analyses/:id` — poll or use `Prefer: wait=60`
- `GET /v1/analyses` — paginated list
- `GET /v1/credits` — balance + transactions
- `GET /v1/test-fixture` — stable CI fixture

---

## 2026-07-12 — Credit notifications, ToS consent, CORS

### New features
- **Expiring-credits reminder email** — sent once per credit lot, 7 days before expiry. Requires opt-in notification prefs.
- **Low-balance email** — fires once per episode (was: every 24h).

### Behaviour fixes
- **Admin API-key mint/rotate** now stamps implied Terms of Service acceptance.
- **Admins exempt from ToS gate** on stream and upload endpoints.
- **CORS preflight** now allows `X-Primate-Client` header (dashboard regression fix).

---

## 2026-07-09 — PRI-440/439: P11 hardening, pricing analytics, SDK 0.1.1

### New features
- **Brownout ladder + status page** — spend anomaly auto-suspend with configurable ladder (`BROWNOUT_STATE`). Public status reflected at `/v1/status`.
- **SSRF IP-pinning** — all outbound URL fetches (e.g., source_url ingest) are blocked from internal RFC-1918 and link-local ranges.
- **Key-hygiene redaction** — raw key values are redacted from server logs after mint.
- **C1 runtime measurement** — per-analysis GPU wall-clock recorded for pricing analytics (Phase 5).

### SDK
- **`PrimateError.rawMessage`** — verbatim server message, for UI display. TS SDK + MCP bumped to 0.1.1 via npm OIDC Trusted Publishing.
- **Python SDK** — PyPI Trusted Publishing workflow added (tag `sdk-py-v*`).

---

<!-- Backfilled 2026-07-27 (PRI-482 r8) from the website changelog when docs collapsed to one clock. -->

## 2026-07-09 — `additive` — SDKs, MCP server, agent artifacts

- Official SDKs: TypeScript (`@primate-intelligence/sdk`) and Python (`primate-intelligence`) — typed resources, registry-driven retries, auto idempotency keys, `createAndWait()`, webhook verification, pagination iterators, browser `connectStream()`.
- MCP server (`@primate-intelligence/mcp`) with seven tools mirroring the spec.
- `llms.txt` / `llms-full.txt` + `/.well-known/llms.txt`; all docs pages served as raw markdown at `/docs/*.md`.
- New documentation site: quickstart, agent quickstart, ten guides, Scalar API reference, error-registry anchors.

## 2026-07-09 — `deprecation` — Legacy `pk_` API key prefix sunset prepared

- Existing `pk_` keys remain valid through the launch migration.
- New keys and rotations create `pv_live_` / `pv_test_` keys only.
- The 12-month `pk_` sunset clock starts at production GA announcement after Matt approves the cutover; the exact date will be published in the versioning guide and dashboard before enforcement.

## 2026-07-08 — `additive` — Billing: credit purchases + auto-refill

- `GET /v1/credit-pricing` (public): price per second, grant sizes, purchase options.
- Dashboard credit purchases, saved payment methods, and threshold-triggered auto-refill.
- `GET /v1/billing/usage-summary` for dashboard usage aggregation.

## 2026-07-07 — `additive` — Webhooks + usage meters

- `webhook_endpoints` resource: CRUD, Standard-Webhooks signing, delivery worker with `1m…24h` retry schedule, deliveries API, redelivery, secret rotation with 24h dual-secret overlap, auto-disable after 72h of failures.
- Event vocabulary: `video.ready`, `video.failed`, `analysis.completed`, `analysis.failed`, `analysis.canceled`, `stream.ended`.
- Per-request `webhook` overrides on `POST /v1/analyses` / `POST /v1/streams` (unsigned).
- `GET /v1/usage` generic meters shape (`credit_seconds` balance + period consumption).

## 2026-07-06 — `additive` — Streams public API

- `streams` resource (§4.8): create → signal (WS) → WebRTC → live per-frame results → end. Queueing with honest `queue_position`/`estimated_start_s`, per-plan session caps, 5s metering ticks, credit reservation reconciled to the second.
- `stream_already_active` (409) error code registered.

## 2026-07-05 — `additive` — Client tokens

- `POST /v1/client_tokens`: ephemeral browser-safe `pvct_` tokens (60–900s TTL, scope subsets, optional video/stream binding). Signaling WS accepts client tokens only — never secret keys.
- `token_expired` (401) error code registered.

## 2026-07-04 — `additive` — Instant sandbox + auth cutoff

- Anonymous `POST /v1/sandbox` issues instant `pv_test_` keys (IP-limited, 7-day expiry, fixture corpus, deterministic results) with a pre-seeded fixture video.
- Metered credit enforcement on the live plane; open signup.
- `sandbox_limit_exceeded` (429) error code registered.

## 2026-07-03 — `additive` — Public core: videos + analyses

- `videos` resource: presigned upload (create → PUT → complete), SSRF-guarded URL ingest, cursor-paginated lists, delete with 409 protection.
- `analyses` resource: free-text prompts or structured queries, `Prefer: wait` sync sugar (cap 120s), live progress + queue position, cancel, deterministic `result` contract (`answer`/`confidence`/`clips`).
- `GET /v1/models`, `GET /v1/errors` (machine-readable registry), idempotency keys (JCS canonical body comparison, 24h replay window).

## 2026-07-02 — `additive` — OpenAPI spec

- `GET /v1/openapi.json` — OpenAPI 3.1, generated from the DTO registry; CI drift + `oasdiff breaking` gates. The spec is the source of truth for docs, SDKs, and this changelog's compatibility promises.
