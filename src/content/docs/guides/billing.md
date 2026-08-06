---
title: Billing & credits
description: Frame-based settlement, credit grants, auto-refill, and handling insufficient_credits in code.
order: 19
section: Guides
---

# Billing & credits

Primate Vision bills by **frames processed**, prepaid as credits. Each processed frame costs `price_per_frame_cents`, and the total settles to your credit ledger as equivalent credit-seconds. Current pricing is always at `GET /v1/credit-pricing` (public, no auth — see `price_per_frame_cents`) and on the [pricing page](/pricing).

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

- **Analyses** — the frames actually processed, debited when the analysis completes. Failed platform-side work (`inference_error`, `stuck_timeout`) is **not billed**; resubmit freely.
- **Streams** — live sessions reserve credits up front and reconcile to the processed-frame count at end (`GET /v1/streams/{id}` shows the final usage). Mid-stream you get `warning` messages as the reservation runs low, then the session ends with `end_reason: "insufficient_credits"`.

## Settlement method (`metering_rule`)

Every stream and analysis is pinned to a settlement rule **at creation time**, immutable for its lifetime, and reported back on the terminal object:

- `per_frame` — the current default. Cost = frames processed × `price_per_frame_cents`, settled to the ledger as equivalent credit-seconds: `round(frames × price_per_frame_cents ÷ price_per_second_cents)`. The slower your capture rate, the less you pay for the same wall-clock coverage.
- `per_second` — the legacy rule: source clock seconds, fps-independent. Reported for resources created before the frame-metering cutover; in-flight sessions always finish under the rule they started with.

Read it from the terminal response — both the top-level field and the `usage` block carry it:

```json
{
  "metering_rule": "per_frame",
  "usage": {
    "billed_seconds": 16,
    "credit_balance_after": 5978,
    "metering_rule": "per_frame",
    "frames": 108000
  }
}
```

Worked example at current pricing (`price_per_frame_cents: 0.00015`, `price_per_second_cents: 1`): 108,000 frames × 0.00015¢ = 16.2¢ → `round(16.2 ÷ 1)` = **16 credit-seconds** settled.

`usage.frames` is the processed-frame count and is reported for **both** rules (frame counting predates the billing cutover) — for `per_second` rows it's informational, not the billing basis. `usage` is terminal-only: null until the analysis completes or the stream ends.

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
