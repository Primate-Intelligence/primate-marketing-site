---
title: Quickstart
description: First analysis in three curl commands — no signup required.
order: 1
section: Getting started
---

# Quickstart

Primate Vision answers questions about video. Upload a video (or point us at a URL), ask a question in plain English, and get a deterministic answer with confidence and clip timestamps — no hallucinations.

This page gets you from zero to a verified result in about a minute, **without creating an account**.

## 1. Get a key

One command. No email, no card:

```bash doc-test id=quickstart-sandbox
curl -s -X POST https://api.primateintelligence.ai/v1/sandbox
```

The response contains your `pv_test_` key plus a ready-to-analyze fixture video:

```json
{
  "object": "sandbox_key",
  "api_key": "pv_test_…",
  "mode": "test",
  "expires_at": "2026-07-16T00:00:00Z",
  "fixture_video_id": "video_…",
  "fixture_prompt": "Is there a person in this video?",
  "expected_answer": "yes"
}
```

Export it:

```bash
export PRIMATE_API_KEY="pv_test_…"   # from the response above
```

Test keys return **deterministic canned results** for the fixture corpus — perfect for CI. They can't spend credits or touch the GPU, and expire in 7 days. Graduating to a `pv_live_` key requires [signup](https://primateintelligence.ai/signup) (a billing gate, not an integration gate — your code doesn't change).

## 2. Create an analysis

Your sandbox account comes pre-seeded with a fixture video. Ask a question about it — `Prefer: wait` holds the connection until the result is ready (up to 120s), collapsing the poll loop:

```bash doc-test id=quickstart-analyze env=VIDEO_ID
curl -s -X POST https://api.primateintelligence.ai/v1/analyses \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: wait=60" \
  -d '{"video_id": "'"$VIDEO_ID"'", "prompt": "Is there a person in this video?"}'
```

## 3. Read the result

The response is the full analysis resource:

```json
{
  "id": "an_…",
  "object": "analysis",
  "status": "completed",
  "result": {
    "answer": "yes",
    "confidence": 0.93,
    "clips": [{ "start_s": 1, "end_s": 4, "confidence": 0.93 }],
    "query_type": "object"
  }
}
```

That's the whole loop: **video → question → answer**. `result.answer` is always `yes`, `no`, or `indeterminate`; `result.clips` tells you *where* in the video.

## The same thing in TypeScript

```typescript doc-test id=quickstart-ts sdk=ts
import Primate from '@primate-intelligence/sdk';

const client = new Primate(); // reads PRIMATE_API_KEY

const videos = await client.videos.list();          // fixture video is pre-seeded
const analysis = await client.analyses.createAndWait({
  video_id: videos.data[0].id,
  prompt: 'Is there a person in this video?',
});
console.log(analysis.result?.answer, analysis.result?.confidence);
```

## The same thing in Python

```python doc-test id=quickstart-py sdk=py
from primate_intelligence import Primate

client = Primate()  # reads PRIMATE_API_KEY

videos = client.videos.list()                       # fixture video is pre-seeded
analysis = client.analyses.create_and_wait(
    video_id=videos["data"][0]["id"],
    prompt="Is there a person in this video?",
)
print(analysis["result"]["answer"], analysis["result"]["confidence"])
```

## Next steps

- **[Upload your own video](/docs/guides/uploading)** — presigned upload, URL ingest, or the SDK helper
- **[Write better prompts](/docs/guides/prompts)** — what's answerable, structured queries, `unassessable_components`
- **[Stop polling](/docs/guides/waiting)** — `Prefer: wait` vs webhooks
- **[Building with an AI agent?](/docs/agents)** — the condensed machine-readable path
- **[API reference](/docs/reference)** — every endpoint, generated from the OpenAPI spec
