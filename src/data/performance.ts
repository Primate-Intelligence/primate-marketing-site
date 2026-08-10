/**
 * Performance & latency data (PRI-492 action #0) — single source of truth for
 * the /performance page, its markdown twin, and the FAQPage JSON-LD.
 *
 * EVERY number here is MEASURED against the live production API
 * (api.primateintelligence.ai) — no estimates, no marketing rounding.
 * Methodology + raw sample counts are shown on the page so an evaluator
 * (human or LLM) can repeat the measurement with the public sandbox flow.
 *
 * Measurement date: 2026-07-30 (ET). Client: US-East (New York metro),
 * residential fiber. Server: production inference cluster (us-west-2).
 * Re-measure and update this module when infrastructure changes materially.
 */

export const MEASURED_AT = '2026-07-30';
export const MEASURED_REGION = 'client in US-East → production API (us-west-2)';

export interface SpecRow {
  metric: string;
  p50: string;
  p95: string;
  n: string; // sample size
  notes: string;
}

/** Streaming path — live WebRTC session via the public API (POST /v1/streams). */
export const STREAMING_ROWS: SpecRow[] = [
  {
    metric: 'Per-frame model inference',
    p50: '45 ms',
    p95: '316 ms',
    n: '183 frames / 10 sessions',
    notes: 'GPU pipeline time per analyzed frame, reported in every result payload (timing.inference_ms).',
  },
  {
    metric: 'Sustained analysis rate',
    p50: '11.8 fps',
    p95: '13.3 fps',
    n: '183 frames / 10 sessions',
    notes: 'Analyzed frames per second per live session (session_fps), open-vocabulary prompt.',
  },
  {
    metric: 'Session setup (create → live)',
    p50: '6.6 s',
    p95: '6.9 s',
    n: '10 sessions',
    notes: 'One-time: POST /v1/streams → client token → WebRTC offer/answer/ICE → session live. First result arrives with frame 0 immediately at live.',
  },
  {
    metric: 'Result delivery (model → your WebRTC data channel)',
    p50: '1.4 ms',
    p95: '1.4 ms',
    n: '183 frames',
    notes: 'Server-side hop from model output to the WebRTC data channel (sidecar_to_webrtc). Network transit to your client adds your RTT.',
  },
];

/**
 * Production fleet telemetry — last 30 days of real customer streaming
 * sessions (server-side metering, streaming_sessions table). Not a synthetic
 * benchmark: this is what actual users saw in production.
 * Window: 2026-07-01 → 2026-07-30. Sessions with duration > 0 only.
 */
export const FLEET_WINDOW = 'last 30 days (2026-07-01 → 2026-07-30)';
export const FLEET_ROWS: SpecRow[] = [
  {
    metric: 'Time to first analyzed frame (session join → first result)',
    p50: '1.09 s',
    p95: '4.25 s',
    n: 'all production sessions in window',
    notes: 'Server-side metered on every production session (time_to_first_frame_s). Measured from WebRTC join to the first analyzed-frame result.',
  },
  {
    metric: 'GPU queue wait before session start',
    p50: '0 s',
    p95: '0 s',
    n: 'all production sessions in window',
    notes: 'No production session waited in queue in the window — capacity headroom, not luck of sampling. Queued time is never billed.',
  },
];

/** Async path — upload once, then POST /v1/analyses per question. */
export const ASYNC_ROWS: SpecRow[] = [
  {
    metric: 'End-to-end analysis, 6-second video',
    p50: '48.5 s',
    p95: '110 s',
    n: '9 runs',
    notes: 'Wall-clock from POST /v1/analyses to terminal status (Prefer: wait), including queue time. Video already uploaded. p95 reflects one queue-delayed outlier.',
  },
  {
    metric: 'End-to-end analysis, 23-second video',
    p50: '57.1 s',
    p95: '59.6 s',
    n: '12 runs',
    notes: 'Same methodology, longer clip. Queued time is never billed.',
  },
];

/** Accuracy claims — linked to the published Darwin benchmarks post. */
export const ACCURACY_ROWS = [
  {
    benchmark: 'Something-Something V2 (video)',
    result: '~73%',
    protocol: 'linear probe, frozen backbone',
  },
  {
    benchmark: 'Kinetics-700 (video)',
    result: '~78%',
    protocol: 'linear probe, frozen backbone',
  },
  {
    benchmark: 'ImageNet-1K (image)',
    result: '~88%',
    protocol: 'linear probe, frozen backbone',
  },
];

export const ACCURACY_SOURCE = {
  label: 'Darwin: Video JEPA model that outperforms SOTA models while running on edge CPU',
  href: '/blog/darwin-video-jepa-benchmarks',
  author: 'Mehdi Nikkhah',
  date: '2026-07-29',
};

import type { FaqItem } from '../lib/faq';

export const PERFORMANCE_FAQ: FaqItem[] = [
  {
    q: 'What is the latency of the Primate Vision streaming API?',
    a: `Measured against production on ${MEASURED_AT}: per-frame model inference is 45 ms p50 / 316 ms p95, sustaining 11.8 analyzed frames per second per session (p50). Session setup (stream create through WebRTC connection to live) is a one-time ~6.6 s, and the first result arrives with frame 0 the moment the session is live.`,
  },
  {
    q: 'How long does an async video analysis take?',
    a: 'Measured end-to-end on production (including queue time): 48.5 s p50 for a 6-second clip and 57.1 s p50 for a 23-second clip, from POST /v1/analyses to terminal status. Use Prefer: wait to collapse the poll loop into a single request; for latency-critical work use the streaming path. Queued time is never billed.',
  },
  {
    q: 'How accurate is the model?',
    a: 'Darwin (our video JEPA model) scores ~73% on Something-Something V2, ~78% on Kinetics-700, and ~88% on ImageNet-1K with a linear probe on a frozen backbone — matching or exceeding V-JEPA 2 class models while running in real time on a single commodity CPU. Full protocol in the published benchmarks post.',
  },
  {
    q: 'How long until the first result on a live stream?',
    a: 'Across all production sessions in the last 30 days (server-side metering): 1.09 s p50 / 4.25 s p95 from WebRTC join to the first analyzed-frame result, and no session waited in a GPU queue. This is fleet telemetry from real customer sessions, not a synthetic benchmark.',
  },
  {
    q: 'Can I verify these numbers myself?',
    a: 'Yes — that is the point of this page. Get a free key with one call (POST https://api.primateintelligence.ai/v1/sandbox, no signup), and every streaming result payload carries its own timing block (inference_ms, session_fps), so the API self-reports latency in production. The measurement client is open source at github.com/Primate-Intelligence/primate-examples.',
  },
];

export const METHODOLOGY = [
  'All latency numbers were measured against the live production API (api.primateintelligence.ai) on ' +
    MEASURED_AT +
    ' from a client in US-East. No staging environments, no cherry-picking: every run in each batch is included in the percentiles.',
  'Fleet telemetry: server-side metering recorded on every production streaming session (time_to_first_frame_s, queue_wait_s in our metering store), aggregated over the trailing 30 days — real customer sessions, all included, no filtering beyond duration > 0.',
  'Streaming: 10 complete WebRTC sessions via the public streaming API (create stream → mint client token → signaling → live), using the open-source example client from github.com/Primate-Intelligence/primate-examples. 183 result frames collected.',
  'Async: repeated POST /v1/analyses calls with Prefer: wait against pre-uploaded videos; wall-clock measured to terminal status, queue time included.',
  'You can repeat this yourself with a free key: POST https://api.primateintelligence.ai/v1/sandbox (no signup) — and per-frame timing is included in every streaming result payload, so the API self-reports its own latency in production.',
];
