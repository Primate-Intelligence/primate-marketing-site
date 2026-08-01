---
title: Streaming
description: Real-time video analysis over WebRTC — create, signal, go live, get per-frame results.
order: 20
section: Guides
---

# Streaming

Streams analyze live video in real time: point a camera (or any MediaStream) at the API and get per-frame detection results back over a WebRTC data channel, with the same prompt semantics as file analyses.

## Lifecycle

```
POST /v1/streams → queued|ready → (WS join → offer/answer/ICE) → live → ended
```

1. **Create** the stream server-side with your secret key:

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/streams \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Is there a person in the frame?", "options": {"narrative": true}, "recording": true}'
```

The response carries everything the client needs: `signaling.url` (a WebSocket), `ice_servers` (STUN/TURN with credentials), `limits` (`max_session_s`, `warn_at_remaining_s`), and `queue_position`/`estimated_start_s` when capacity is busy.

Two optional opt-ins at create time:

- **`options: {narrative: true}`** — [live narrative](#live-narrative-opt-in): result detections carry `narrative_update` sentences, and the WS delivers `status` ordering events. No surcharge.
- **`recording: true`** — [session recording](#session-recordings-opt-in): retrieve the annotated session video after the stream ends.

2. **Mint a client token** for the browser/device (the signaling WS **never** accepts secret keys):

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/client_tokens \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scopes": ["streams:signal"], "stream_id": "'"$STREAM_ID"'", "ttl_s": 300}'
```

3. **Connect** from the client. With the TS SDK this is one call:

```typescript
import { connectStream } from '@primate-intelligence/sdk/browser';

const session = await connectStream({
  stream,                    // the Stream resource (relay it from your server)
  clientToken,               // pvct_… minted in step 2
  mediaStream: await navigator.mediaDevices.getUserMedia({ video: true }),
  onResult: (r) => console.log(r.frame_num, r.detections),
  onNarrative: (n) => log(`${n.t_s}s: ${n.text}`),        // narrative streams only
  onStatus: (s) => log(`engine: ${s.status}`),            // narrative streams only
  onWarning: (w) => (w.code ? diagnose(w) : showCountdown(w.remaining_s)),
  onEnd: (reason) => cleanup(reason),
});
// change the question mid-stream (server confirms with prompt_updated):
session.updatePrompt('Is there a forklift moving?');
// done:
session.end();
```

Under the hood: WS `join` → `ready` (or `queued {position}`) → WebRTC `offer`/`answer` + ICE trickle → media flows → `result` messages per analyzed frame.

## Signaling protocol (build your own client)

Messages you send: `join`, `offer {sdp}`, `ice {candidate}`, `update_prompt {prompt}`, `end`, `ping`.
Messages you receive: `queued {position, estimated_start_s}`, `ready`, `answer {sdp}`, `ice {candidate}`, `live`, `result {frame_num, detections}`, `prompt_updated`, `status {…}` (narrative streams only), `metering {…}`, `warning {…}`, `end {reason}`, `error {code, message}`, `pong`.

There are two kinds of `warning`: the credit-exhaustion countdown (`warning {remaining_s}`, no `code` field) and diagnostic warnings that carry a `code` field — see [No-media warning](#no-media-warning-the-server-tells-you-when-your-media-is-the-problem) below. Distinguish them by the presence of `code`.

A Python/aiortc backend example (robotics-style, no browser — including a "stream a file" recipe and a relay-only datacenter/CI profile) ships in the public [examples repo](https://github.com/Primate-Intelligence/primate-examples), alongside a self-contained browser webcam example.

**Trickle ICE is bidirectional**: after the `answer`, the server may keep sending `ice {candidate}` messages as late srflx/relay candidates finish gathering — keep consuming and adding them. Clients on UDP-blocked networks (datacenters, CI, strict NATs) complete via the TURN servers in `ice_servers`; TURN-over-TCP:443 is supported.

### Result contract (identical to file analyses)

Each `result.detections[]` row uses the same enums and casing as the file API: `answer` is lowercase `yes|no|indeterminate`, `confidence` is 0..1, and `prompt` is echoed exactly as you submitted it. Latency telemetry (per-stage breakdowns) lives under a `timing` object.

### Update the prompt mid-stream

Send `{"type": "update_prompt", "prompt": "…"}` (≤2000 chars) at any point while live — no reconnect, no new stream. The server recompiles the prompt, applies it to the live engine, and confirms with `{"type": "prompt_updated"}`; subsequent result frames echo the new prompt. An invalid prompt returns `{"type": "error", "code": "validation_failed" | "parse_failed"}` and the **old prompt stays active**. On narrative streams, expect a `recalculating` status event while the engine rebuilds context.

### Live narrative (opt-in)

Create the stream with `options: {narrative: true}` and two things change (nothing changes without the opt-in):

1. Result detections carry a **`narrative_update`** object — `{t_s, text}`, a new narrative sentence — whenever the engine detects an appearance/disappearance/action. Event-driven, NOT per frame: absent (not `null`) on frames without one.
2. The WS delivers additive **`status`** events for ordering/annotating narrative entries:

```json
{"type": "status", "status": "prompt_context" | "combined_prompt" | "recalculating", "message": "…"}
```

The vocabulary is a **closed set** — exactly these three values; internal engine statuses never leak. Typical use: mark when the engine is recalculating context right after an `update_prompt`. Included in the per-second price — no surcharge.

### Session recordings (opt-in)

Create the stream with **`recording: true`** (top-level boolean) to retrieve the server-side session recording afterwards:

1. The stream resource carries `recording: {status}` — `recording` while live, `available` once ended with a stored recording, `failed`, or `none`. Streams without the opt-in have `recording: null`.
2. Once `available`, call `GET /v1/streams/{id}/recording` → `{url, expires_at, content_type: "video/h264", container: "h264-annex-b"}`. The URL is **signed fresh on every GET, 1-hour TTL** — re-fetch for a new one; old recordings always stay retrievable.
3. The recording is a raw H.264 Annex-B elementary stream (the exact annotated frames the client saw). Lossless remux to MP4: `ffmpeg -i recording.h264 -c copy recording.mp4`.

### Result sampling — results are sampled, not per-frame

Results are **sampled**, not emitted for every source frame — inference cadence is adaptive (roughly every 8th source frame under load). Two different axes to keep straight:

- `frame_num` on each live `result` is the **source-frame index** the result was computed on. Gaps between consecutive `frame_num` values are normal and expected — don't treat them as dropped results.
- `results_summary.result_frames` on the ended stream resource counts the number of **result events emitted** over the session — NOT a source-frame count.

Expect roughly **8–15 results per second** depending on load; never assume a fixed cadence.

> **Alias note:** `results_summary.frames` is a supported alias of `results_summary.result_frames` (identical value), superseded by `result_frames`. Prefer `result_frames` in new code; existing reads of `frames` keep working.

### Metering ticks

While live, a `metering` message arrives every 5 seconds:

```json
{"type": "metering", "elapsed_s": 45, "billed_s": 45, "session_remaining_s": 555, "balance_s": 555}
```

- `session_remaining_s` — seconds remaining in **this session's** credit reservation (the session cap). This is NOT your account credit balance — that lives at `GET /v1/billing/credits` (`balance_seconds`).
- `balance_s` — supported alias of `session_remaining_s` (identical value), superseded by `session_remaining_s`. Prefer `session_remaining_s` in new code; existing reads of `balance_s` keep working.
- `elapsed_s` / `billed_s` — live-clock seconds elapsed = billed (identical by construction; join, queueing, and negotiation are free).

### No-media warning (the server tells you when your media is the problem)

If the WebRTC transport connects but **no decodable video frame arrives within 5 seconds**, the server pushes a diagnostic `warning` on the signaling WS (re-warned once at 15s, then quiet; canceled by the first decoded frame):

```json
{"type": "warning", "code": "no_media_frames", "transport_connected": true,
 "elapsed_s": 5, "packets_received": 312, "frames_decoded": 0, "hint": "…"}
```

Read `packets_received` to self-diagnose:

- `packets_received: 0` — your client is **not sending media** (track not attached, muted, or the capture source is dead).
- `packets_received > 0` with `frames_decoded: 0` — media is arriving but is **not decodable** (wrong codec — must be VP8 or H.264 — or the source produces no real frames, e.g. a canvas capture without an active draw loop).

If the session then ends without ever going live, the terminal resource records `end_reason: "media_timeout"` with the same media counters in `failure_diagnostic`, and bills 0.

### Honest end reasons

`end {reason}` and the terminal resource's `end_reason` distinguish real failures — a session that never went live is never `completed`:

| Reason | Meaning | Billed |
|---|---|---|
| `completed` | Normal end after live | live seconds |
| `canceled` | Ended before going live (client action) | 0 |
| `ice_failed` | ICE never connected — resource carries `failure_diagnostic` (server candidate summary) | 0 |
| `media_timeout` | Transport connected but no media flowed — `failure_diagnostic` carries the media counters | 0 |
| `insufficient_credits` | Balance exhausted mid-stream | live seconds |
| `timeout` | `limits.max_session_s` reached | live seconds |
| `error` | Server-side failure | live seconds (0 if never live) |

### failure_diagnostic — debugging a failed session from the API alone

When a session ends without ever going live on a transport failure, the terminal Stream resource carries a nullable `failure_diagnostic` object (and the session bills **0**):

- On `ice_failed` it holds the server-side ICE candidate summary:

```json
{"end_reason": "ice_failed",
 "failure_diagnostic": {
   "local_candidates": ["host 203.0.113.7", "srflx 203.0.113.7", "relay 198.51.100.20"],
   "hint": "Server advertised public host + srflx/relay candidates; check the client's path to the TURN servers in ice_servers."
 }}
```

  If `local_candidates` shows only private addresses (`172.x`, `10.x`), the fault is on our side — contact support. If it shows srflx/relay candidates, check your client's network path to the TURN servers in `ice_servers` (TURN-over-TCP:443 and `turns:` TLS relays are available for locked-down egress networks).

- On `media_timeout` it holds the media counters from the no-media warning (`packets_received`, `frames_decoded`) so you can tell "never sent media" apart from "sent undecodable media" after the fact.

`failure_diagnostic` is `null` on successful sessions and on ends unrelated to transport.

## Credits & limits

- One active (queued/ready/live) stream per account by default — a second create returns `409 stream_already_active`
- Sessions reserve credits up front; metering ticks every 5s (see [Metering ticks](#metering-ticks) for the field contract); you get `warning {remaining_s}` before funds run out, then `end {reason: "insufficient_credits"}`
- `limits.max_session_s` is the hard per-session cap from your plan
- Your account-wide balance is at `GET /v1/billing/credits` — metering ticks only report the session reservation
- After `ended`, `GET /v1/streams/{id}` shows `duration_s`, `usage` (reconciled to the second), and `results_summary` (`result_frames` = count of result events — see [Result sampling](#result-sampling--results-are-sampled-not-per-frame))

## End a stream

From the client: send `end` (or just `session.end()`). Server-side / cleanup:

```bash
curl -s -X POST https://api.primateintelligence.ai/v1/streams/$STREAM_ID/end \
  -H "Authorization: Bearer $PRIMATE_API_KEY"
```

Idempotent — safe to call on an already-ended stream. `stream.ended` fires as a [webhook](/docs/guides/webhooks) if subscribed.
