---
title: Uploading video
description: Three ways to get video in — presigned upload, URL ingest, SDK helper — and how to choose.
order: 10
section: Guides
---

# Uploading video

There are three paths to get video into Primate Vision. All of them end with a `video` resource in status `ready`, at which point you can create analyses against it.

**Formats:** `video/mp4` (H.264) and `video/quicktime`. **Max size:** 2 GiB. **Retention:** source videos are deleted 30 days after upload (see [security model](/docs/guides/security-model)).

## Choosing a path

| Path | Use when |
|---|---|
| **URL ingest** | The video is already at a public https URL (CDN, S3, YouTube-dl output) |
| **Presigned upload** | You have the bytes (server file, browser file input) — bytes go straight to S3, never through our API servers |
| **SDK `upload()` helper** | You use an SDK and want the presigned dance done for you |

## URL ingest

One call. The API fetches the video asynchronously:

```bash doc-test id=uploading-url skip-live
curl -s -X POST https://api.primateintelligence.ai/v1/videos \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/clip.mp4"}'
```

The video starts `processing` and transitions to `ready` (or `failed` with `error.code` = `url_fetch_failed` / `url_forbidden` / `video_unreadable`). Poll `GET /v1/videos/{id}` or subscribe to the `video.ready` webhook.

URL rules (SSRF policy): `https` only, port 443, public hosts only, max 3 redirects, 2 GiB cap. Private/internal addresses are rejected with `url_forbidden`.

## Presigned upload

Three steps — create, PUT, complete:

```bash
# 1. Create — declares filename/type/size, returns a presigned S3 PUT URL
curl -s -X POST https://api.primateintelligence.ai/v1/videos \
  -H "Authorization: Bearer $PRIMATE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filename": "clip.mp4", "content_type": "video/mp4", "size_bytes": 12345678}'

# 2. PUT the bytes directly to S3 (the upload.url + upload.headers from step 1)
curl -s -X PUT "$UPLOAD_URL" -H "Content-Type: video/mp4" --data-binary @clip.mp4

# 3. Tell the API the PUT finished
curl -s -X POST https://api.primateintelligence.ai/v1/videos/$VIDEO_ID/complete \
  -H "Authorization: Bearer $PRIMATE_API_KEY"
```

The presigned URL expires (see `upload.expires_at`, typically 1h). If the declared `size_bytes` doesn't match what landed in S3, `complete` fails with `upload_incomplete` — re-create the video.

## SDK helper

```typescript
import Primate from '@primate-intelligence/sdk';
import { readFile } from 'fs/promises';

const client = new Primate();
const video = await client.videos.upload(await readFile('clip.mp4'), {
  filename: 'clip.mp4',
  content_type: 'video/mp4',
});
```

```python
from primate_intelligence import Primate

client = Primate()
with open("clip.mp4", "rb") as f:
    video = client.videos.upload(f.read(), filename="clip.mp4")
```

Both run create → PUT → complete and return the video resource.

## Browser uploads

Never put a secret key in a browser. Mint an ephemeral [client token](/docs/guides/security-model#client-tokens) server-side with the `videos:write` scope, then run the presigned flow from the browser with the `pvct_` token. Working example: the [browser SPA sample](https://github.com/Primate-Intelligence/primate-examples).

## Lifecycle

```
awaiting_upload → uploading → processing → ready
                                        ↘ failed
```

`DELETE /v1/videos/{id}` removes the video (409 `resource_conflict` while analyses are still running against it). Deletion propagates from S3 + CDN within 72h; signed URLs expire within 1h regardless.

## Your video library (playback + history)

Uploaded videos stay usable as a library — three fields/endpoints together give full list-replay-history semantics:

- **`Video.media`** — ready videos carry `media: {url, expires_at}`, a signed playback URL for the original source video. Sign-on-read: generated **fresh on every GET with a 1-hour TTL** — re-fetch the video for a new URL after expiry; old videos always stay playable. `media` is `null` for non-ready videos and sandbox fixture videos.
- **`GET /v1/videos/{id}/analyses`** — every analysis ever run against a video, newest first, with the same list envelope + filters (`status`, `limit`, `starting_after`) as `GET /v1/analyses`. (Equivalent spelling: `GET /v1/analyses?video_id={id}`.)
- **`Analysis.artifacts`** — completed analyses with an annotated result video carry `annotated_video_url` (same sign-on-read semantics).
