---
title: "Tutorial: build from scratch"
description: Zero to a working video-question CLI in ~15 minutes — no account required to start.
order: 21
section: Guides
---

# Tutorial: build from scratch

We'll build `askvideo` — a Node CLI that takes a video URL and a question, and prints the answer. Zero to working in about 15 minutes, entirely on a free test key.

## Step 0: get a key (30 seconds)

```bash doc-test id=tutorial-sandbox
curl -s -X POST https://api.primateintelligence.ai/v1/sandbox
```

```bash
export PRIMATE_API_KEY="pv_test_…"   # from the response
```

## Step 1: project setup

```bash
mkdir askvideo && cd askvideo
npm init -y
```

## Step 2: the whole program

`askvideo.mjs`:

```javascript
const [url, ...promptParts] = process.argv.slice(2);
const prompt = promptParts.join(' ');
if (!url || !prompt) {
  console.error('usage: node askvideo.mjs <video-url> <question…>');
  process.exit(2);
}

const apiKey = process.env.PRIMATE_API_KEY;
const baseUrl = process.env.PRIMATE_BASE_URL ?? 'https://api.primateintelligence.ai';
if (!apiKey) {
  console.error('PRIMATE_API_KEY is required');
  process.exit(2);
}

async function api(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json();
  if (!res.ok) {
    const err = body.error ?? { code: 'request_failed', message: res.statusText };
    console.error(`${err.code}: ${err.message}`);
    if (err.docs_url) console.error(`docs: ${err.docs_url}`);
    process.exit(1);
  }
  return body;
}

async function createAndWait(videoId, question) {
  let analysis = await api('/v1/analyses', {
    method: 'POST',
    headers: { Prefer: 'wait=60' },
    body: JSON.stringify({ video_id: videoId, prompt: question }),
  });

  for (let i = 0; analysis.status !== 'completed' && i < 30; i += 1) {
    if (analysis.status === 'failed' || analysis.status === 'canceled') {
      throw new Error(`analysis_${analysis.status}: ${JSON.stringify(analysis.error)}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    analysis = await api(`/v1/analyses/${analysis.id}`);
  }
  return analysis;
}

const video = await api('/v1/videos', {
  method: 'POST',
  body: JSON.stringify({ url }),
});
console.error(`video ${video.id} (${video.status})`);

const analysis = await createAndWait(video.id, prompt);
console.log(JSON.stringify(analysis.result, null, 2));
```

## Step 3: run it

Test keys analyze the fixture corpus deterministically, so use the official fixture:

```bash
FIXTURE=$(curl -s https://api.primateintelligence.ai/v1/test-fixture)
node askvideo.mjs \
  "$(echo $FIXTURE | python3 -c 'import json,sys; print(json.load(sys.stdin)["test_video_url"])')" \
  "Is there a person in this video?"
```

```json
{
  "answer": "yes",
  "confidence": 0.93,
  "clips": [{ "start_s": 1, "end_s": 4, "confidence": 0.93 }],
  "query_type": "object",
  "video_duration_s": 10
}
```

That's a working integration. Everything below is production hardening.

## Step 4: make it CI-verifiable

`test.mjs`:

```javascript
const baseUrl = process.env.PRIMATE_BASE_URL ?? 'https://api.primateintelligence.ai';
const headers = {
  Authorization: `Bearer ${process.env.PRIMATE_API_KEY}`,
  'Content-Type': 'application/json',
};
const fixture = await fetch(`${baseUrl}/v1/test-fixture`).then(r => r.json());
const video = await fetch(`${baseUrl}/v1/videos`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ url: fixture.test_video_url }),
}).then(r => r.json());
const analysis = await fetch(`${baseUrl}/v1/analyses`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'wait=60' },
  body: JSON.stringify({ video_id: video.id, prompt: fixture.test_prompt }),
}).then(r => r.json());

const ok =
  analysis.result.answer.toLowerCase() === fixture.expected_answer.toLowerCase() &&
  analysis.result.confidence >= fixture.expected_confidence_min;
console.log(ok ? 'INTEGRATION OK' : 'INTEGRATION BROKEN');
process.exit(ok ? 0 : 1);
```

Run that in CI with a `pv_test_` key in your secrets — it completes in seconds and costs nothing.

## Step 5: production hardening checklist

- **Error handling** — retry only codes marked retryable in the [error registry](/docs/guides/errors-retries); never retry [`insufficient_credits`](/docs/guides/billing)
- **Stop polling** — swap `createAndWait` for [webhooks](/docs/guides/webhooks) at volume
- **Pin a model** — pass `model: 'darwin-1.3'` so behavior changes only when you choose ([versioning](/docs/guides/versioning))
- **Your own videos** — swap URL ingest for [presigned upload](/docs/guides/uploading) when the bytes live with you
- **Go live** — [sign up](https://primateintelligence.ai/signup), create a `pv_live_` key, change the env var. No code changes.

## Where to next

- [Sample matrix](https://github.com/Primate-Intelligence/primate-examples) — Python, webhook receivers, browser SPA, streaming, token-mint server
- [Agent quickstart](/docs/agents) — the condensed machine-readable version of everything you just did
- [API reference](/docs/reference)
