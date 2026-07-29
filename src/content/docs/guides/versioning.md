---
title: Versioning & deprecation
description: Compatibility guarantees, deprecation process, model sunsets, and service expectations.
order: 17
section: Guides
---

# Versioning & deprecation

## Compatibility contract

The v1 API is **additive-only**. Within v1 we may:

- Add new endpoints, optional request fields, response fields, enum values on *new* fields, and error codes (the registry is append-only)

We will never (without a major version):

- Remove or rename fields/endpoints, change field types or meanings, change error-code semantics, or tighten validation on existing fields

Write clients that **ignore unknown fields** — that's the only client-side requirement for staying compatible.

The gate is mechanical: every spec change runs `oasdiff breaking` in CI; a breaking diff fails the build unless it's an explicitly approved major-version migration.

## Deprecation process

When something must go:

1. It's marked `deprecated` in the OpenAPI spec + the [changelog](/docs/changelog) (typed entry: `breaking | additive | fix | deprecation`)
2. A **migration guide** ships with before/after code in curl/TS/Python, the deadline, and an automated check command
3. Sunset headers appear on responses where applicable
4. Breaking removals only ever land in a new major version

## Legacy `pk_` key sunset

API keys created before v1 used the `pk_` prefix. They remain valid during the launch migration so existing integrations do not break. New keys and rotations now create `pv_live_` / `pv_test_` keys only.

The `pk_` compatibility window is **12 months from GA announcement**. The exact sunset date starts when Matt approves the production GA cutover and will be published here, in the changelog, and in dashboard key-management copy. Before that date, rotate each legacy key from the dashboard or `POST /v1/api-keys/{id}/rotate`; the replacement key is drop-in for `Authorization: Bearer`.

After the sunset, `pk_` keys return `401 invalid_api_key`. No paid usage is charged by the act of rotating a key.

## Model versioning

Models are versioned resources (`GET /v1/models`) with lifecycle: `preview → stable → deprecated`, and a `sunset_at` date once deprecated.

- Omitting `model` on create uses the current default — fine for exploration
- **Production integrations should pin a model id** (e.g. `"model": "darwin-1.3"`) so behavior changes only when you choose
- `400 model_deprecated` past sunset tells you to re-pin; the changelog carries the migration entry

## SDK versioning

SDKs follow semver. An SDK major bump happens only with an API major. Minor/patch releases are additive (new endpoints, fixes) and safe to auto-update within `^`.

## Service expectations

Published targets (not a contractual SLA in v1):

- **Availability:** 99.9%/mo control plane; ≥ 99% completion success for admitted analyses
- **Latency:** p95 reads < 300ms; creates < 1.5s (excluding upload bytes); webhook dispatch p95 < 60s after terminal transition; test-mode analyses < 10s
- **Analysis latency is workload-shaped** — we publish honest transparency instead: `queue_position` + `estimated_start_s` accurate to ±50%
- Single region: us-west-2 (US). All processing and storage. EU is roadmap, not promise.

## Changelog & RSS

Every change lands in the [changelog](/docs/changelog) with a date and type tag. Subscribe: [RSS feed](/docs/changelog.xml). Agents: the changelog is also in `llms-full.txt`.
