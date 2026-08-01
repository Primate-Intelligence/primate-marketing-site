---
title: Prompts & queries
description: Free-text prompts vs structured queries, what's answerable, and how unassessable components behave.
order: 11
section: Guides
---

# Prompts & queries

Every analysis is a **question about a video**. You can ask it two ways: free text (`prompt`) or a pre-compiled structured query (`query`). Provide exactly one.

## What Primate can answer

The model supports ten distinct prompt types. The table below shows what to expect from each.

| Type | Example prompt | `answer` | `detected_count` | `clips` |
|------|---------------|----------|-----------------|---------|
| **Presence** | "Is there a person?" | yes / no / indeterminate | — | ✅ when yes |
| **Absence** | "Are there no dogs?" | yes / no | — | — |
| **Action** | "Is someone walking?" | yes / no | — | ✅ when yes |
| **Count — bare** | "How many people are in this video?" | — | ✅ integer | — |
| **Count — threshold** | "Are there more than 2 people?" | yes / no | ✅ integer | — |
| **Compound** | "Is there a person AND a dog?" | yes / no | — | ✅ when yes |
| **Attribute** | "Is anyone wearing a red jacket?" | description | — | — |
| **Location** | "Where is the dog?" | description | — | — |
| **State** | "Is the door open?" | description | — | — |
| **Segment** | "Show me where the person is" | — | — | ✅ with masks |

**Open-ended prompts** ("Tell me what you see") return a description but have lower accuracy than targeted queries. Prefer a specific question.

**Not supported:**
- Audio / sound ("Is there loud noise?")
- Identity ("Is this John?")
- OCR / text in frame ("What does the sign say?")
- Subjective judgment ("Does the room look nice?")
- Exhaustive counting over long footage ("Count every bird in this 2-hour archive") — count queries are accurate on a single clip or short segment, not long multi-hour recordings

---

## Free-text prompts

```json
{ "video_id": "video_…", "prompt": "Is there a person near the door?" }
```

The server compiles your prompt into a structured query (the `query` field on the analysis shows exactly what it understood, `parse_mode` shows how: `llm` or `heuristic`). Max 2000 characters.

### Prompt design tips

**Do this:**
- "Is there a person near the door?" — presence
- "Are there more than two people in frame?" — count + threshold, returns `yes`/`no` + `detected_count`
- "How many people are walking?" — bare count, returns `detected_count` + natural-language narrative
- "Does anyone fall down?" — action
- "Is there a person AND a dog?" — compound
- "Is anyone wearing a red jacket?" — attribute
- "Is the door open or closed?" — state
- "Where is the bicycle relative to the car?" — location

**Avoid this:**
- "Tell me everything that happens in the video" — open-ended; use a targeted question instead
- "Count every pedestrian across this 30-minute file" — count works best on clips, not long recordings
- "Is this suspicious activity?" — subjective; rephrase as a specific visual condition

**One question per analysis beats a paragraph.** If you need to answer "Is there a person?" AND "Are there more than 2 people?", submit two analyses — the answers are independent and the second one gives you `detected_count`.

---

## The answer contract

### `result.answer`

`result.answer` is one of `yes`, `no`, `indeterminate`:

| Value | Meaning |
|-------|---------|
| `yes` | The condition is present with meaningful confidence |
| `no` | The condition was not detected |
| `indeterminate` | The model could not commit either way — treat as "don't ship a decision on this" |

Count queries (bare "how many?" form) do not populate `result.answer`. Use `result.detected_count` instead.

### `result.detected_count`

Populated for `count`-intent analyses (when the prompt asks "how many?" or uses a threshold):

```json
{
  "result": {
    "answer": "yes",
    "confidence": 0.94,
    "detected_count": 3,
    "clips": [...]
  }
}
```

For count + threshold queries, `answer` tells you whether the threshold was met; `detected_count` tells you the actual number observed.

### `result.confidence`

`result.confidence` ∈ [0, 1]. Meaningful confidence is ≥ 0.5. A result with `confidence: 0` and no positive term detections returns `answer: "indeterminate"`, not `"no"`.

### `result.clips[]`

Clip objects carry `start_s`, `end_s`, `confidence`. Present for presence, action, compound, and segment queries when the answer is `yes`. Null or absent for description/count responses.

### `result.query_type`

How the question was classified: `object`, `action`, `compound`, `attribute`, or `open_ended`.

### `narrative` (opt-in)

Create the analysis with `options: {narrative: true}` and the completed analysis carries a top-level `narrative` object — timestamped event sentences describing what happened in the video:

```json
{"narrative": {"status": "ready", "entries": [{"t_s": 3.2, "text": "A person enters from the left."}]}}
```

Generation runs **asynchronously after the analysis completes**: the first completed read may show `status: "generating"` with empty entries — keep polling the GET until `ready` (or `failed`). Included in the analysis price, no surcharge. Without the opt-in, `narrative` is always `null`. (Streams have a live equivalent — see [Streaming § Live narrative](/docs/guides/streaming#live-narrative-opt-in).)

---

## Unassessable components

If part of your question can't be assessed, the API **answers what it can and tells you what it couldn't** — it never silently drops half your question:

```json
{
  "prompt": "Is there a person talking loudly?",
  "query": {
    "search_terms": ["person"],
    "unassessable_components": ["talking loudly (audio)"]
  },
  "result": { "answer": "yes", "confidence": 0.91 }
}
```

Check `query.unassessable_components` when your prompts mix visual and non-visual language.

---

## Structured queries

Skip the compiler and send the compiled form directly (`parse_mode: "client"`). Useful when you generate queries programmatically or need exact control:

```json
{
  "video_id": "video_…",
  "query": {
    "search_terms": ["person", "dog"],
    "conditions": [
      { "type": "presence", "target": "person", "negated": false },
      { "type": "presence", "target": "dog", "negated": false }
    ],
    "connective": "and",
    "query_type": "compound",
    "prompt_intent": "presence",
    "response_framing": "yes_no"
  }
}
```

Key structured query fields:

| Field | Values | Description |
|-------|--------|-------------|
| `query_type` | `object` `action` `compound` `open_ended` | Top-level classification |
| `prompt_intent` | `presence` `absence` `count` `action` `segment` | What the model optimizes for |
| `response_framing` | `yes_no` `description` `count` | Shape of the result |
| `count_terms` | string[] | What to count (for count intent) |
| `count_threshold` | integer \| null | Threshold for threshold comparison |
| `count_comparison` | `gt` `gte` `lt` `lte` `eq` \| null | How to compare against threshold |
| `quantifier` | `{operator, value}` \| null | Alternative to count_threshold |

If the body fails the CompiledQuery schema you get `400 query_invalid` with `param` naming the field. If the compiler can't parse a free-text prompt you get `422 parse_failed` — rephrase, or fall back to a structured query.

---

## Prompt errors

| Code | Meaning |
|------|---------|
| `prompt_empty` | Provide `prompt` or `query` |
| `prompt_too_long` | > 2000 chars |
| `query_invalid` | Structured query fails the schema (`param` names the field) |
| `parse_failed` | Compiler couldn't produce a query — retryable after rephrasing |
