---
title: Test mode
description: pv_test_ keys, deterministic fixtures, and CI verification without burning quota.
order: 16
section: Guides
---

# Test mode

Every account has two key modes. They hit the same API surface with the same code — only the backend differs.

| | `pv_test_` | `pv_live_` |
|---|---|---|
| Getting one | `POST /v1/sandbox` — instant, anonymous | Signup + card |
| Results | Deterministic, canned, fixture corpus | Real GPU inference |
| Credits | Can never hold or spend credits | Metered |
| Speed | Analyses complete in seconds | Workload-shaped |
| Expiry | 7 days (sandbox) | Until revoked |

## Instant sandbox

```bash doc-test id=test-mode-sandbox
curl -s -X POST https://api.primateintelligence.ai/v1/sandbox
```

No email, no card, no human. The response includes the key, a pre-seeded fixture video id, the fixture prompt, and the expected answer. IP-limited (default 3 provisions per 24h → `429 sandbox_limit_exceeded`).

This is the zero-touch path for agents and CI: build and verify the *entire* integration before any human signs up. Graduating to live is a **billing gate, not an integration gate** — your code doesn't change.

## Deterministic fixtures

On test keys, analyses against the fixture corpus return canned results — same input, same output, every time. That makes them assertable in CI:

```bash doc-test id=test-mode-fixture
curl -s https://api.primateintelligence.ai/v1/test-fixture
```

```json
{
  "name": "presence",
  "test_video_url": "https://app.primateintelligence.ai/empty-state/forklift-demo.mp4",
  "test_prompt": "Is there a forklift in this video?",
  "expected_answer": "yes",
  "expected_confidence_min": 0.8
}
```

## CI verification pattern

```python
# conftest-friendly integration check (runs in seconds, costs nothing)
from primate_intelligence import Primate

def test_primate_integration():
    client = Primate()  # PRIMATE_API_KEY = a pv_test_ key in CI secrets
    videos = client.videos.list()
    analysis = client.analyses.create_and_wait(
        video_id=videos["data"][0]["id"],
        prompt="Is there a person in this video?",
        timeout_s=60,
    )
    assert analysis["result"]["answer"] == "yes"
    assert analysis["result"]["confidence"] >= 0.8
```

Every code sample in these docs runs in CI against this exact mechanism — docs that don't run don't ship.

## Limits of test mode

- Fixture corpus only — you can't upload arbitrary videos for real analysis on a test key (uploads work mechanically, but analysis results are canned)
- No live streaming GPU sessions
- `403 test_mode_only` marks operations unavailable in your key's mode

When you need real inference on your own footage: [sign up](https://primateintelligence.ai/signup), add a card, create a `pv_live_` key, change the env var. Done.
