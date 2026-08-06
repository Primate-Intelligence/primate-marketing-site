---
title: Billing & credits
description: Credit-seconds, grants, auto-refill, and handling insufficient_credits in code.
order: 19
section: Guides
---

# Billing & credits

Primate Vision bills by **video-seconds processed**, prepaid as credits. 1 credit-second = 1 second of video analyzed. Current pricing is always at `GET /v1/credit-pricing` (public, no auth) and on the [pricing page](/pricing).

## How credits flow

- **Signup grant** — new accounts get a free frame budget to evaluate with (currently 108,000 frames — up to 30 hours of monitoring at 1 fps, 1 hour at 30 fps; expiring)
- **Card grant** — adding a card grants another tranche
- **Purchases** — buy credit blocks in the [dashboard](https://primateintelligence.ai/dashboard/billing); custom amounts supported
- **Auto-refill** — opt in to top up automatically when the balance crosses the threshold (currently 600s)

Test-mode keys never hold or spend credits — build and CI on `pv_test_` for free, forever.

## Check your balance

```bash doc-test id=billing-usage
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

## What you're charged for

- **Analyses** — the duration of video actually analyzed, debited when the analysis completes. Failed platform-side work (`inference_error`, `stuck_timeout`) is **not billed**; resubmit freely.
- **Streams** — live sessions reserve credits up front and reconcile to actual connected seconds at end (`GET /v1/streams/{id}` shows the final usage). Mid-stream you get `warning` messages as the reservation runs low, then the session ends with `end_reason: "insufficient_credits"`.

## Handling `insufficient_credits` in code

The one billing error every integration must handle (`402`, **not retryable**):

```typescript doc-test id=billing-handling sdk=ts offline
import Primate, { PrimateError } from '@primate-intelligence/sdk';

const client = new Primate();
try {
  await client.analyses.create({ video_id: videoId, prompt: 'Is the loading dock clear?' });
} catch (err) {
  if (err instanceof PrimateError && err.code === 'insufficient_credits') {
    const { meters } = await client.usage.retrieve();
    const balance = meters.find((m) => m.meter === 'credit_seconds')?.balance ?? 0;
    notifyOwner(
      `Primate Vision balance is ${balance}s — top up or enable auto-refill: ` +
      `https://primateintelligence.ai/dashboard/billing`,
    );
    // Do NOT retry unchanged — queue the job for after refill instead.
  } else {
    throw err;
  }
}
```

The robust pattern:

1. Catch `insufficient_credits` → **stop submitting** (it will keep failing)
2. Read `GET /v1/usage` for the real balance
3. Surface a human-actionable message with the billing URL
4. If the account has auto-refill, retry after a short delay **once** — refill is triggered by the threshold crossing
5. Alert *before* you hit zero: poll `credit_seconds` and warn below your own threshold

## Free-credit expiry

Granted (free) credits expire; purchased credits don't. Expiry dates show in the dashboard. Expired grants simply vanish from `balance` — no negative surprises.

## Invoices & history

Purchase history and receipts live in the [dashboard billing page](https://primateintelligence.ai/dashboard/billing). Usage aggregates by day/analysis are on the [usage page](https://primateintelligence.ai/dashboard/usage).
