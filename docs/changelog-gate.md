# Changelog / competitive-data gate (PRI-576, PRI-578)

CI job `changelog-gate` in `.github/workflows/docs-integrity.yml` runs on
every PR and scans **added lines** in these files:

- `src/snapshots/changelog.md`
- `src/data/performance.ts`
- `src/pages/performance.astro`
- `src/pages/performance.md.ts`

Patterns live in `scripts/lib/changelog-gate-patterns.mjs`. Two families:

1. **Internal-process leaks (PRI-576)** — Linear ticket refs (`PRI-\d+`),
   internal status words (`internal`, `TODO`, `WIP`, `legal review`,
   `staging`, ...), sprint/cadence language (`sprint`, `velocity`,
   `standup`, ...), named engineers.
2. **Competitive usage/performance numbers (PRI-578)** — exact sample
   counts (`183 frames`, `10 sessions`, `9 runs`), usage-scale framing
   (`all production sessions in window`, `trailing 30 days`).

One gate, not two, per Matt's directive — anything that touches the
changelog or the performance page goes through the same check.

## When it fails

The check output quotes the exact file, line, and matched pattern with a
one-line reason. Either:

- **Fix the content** — rephrase to remove the flagged term/number, push
  again, or
- **Override** — after explicit human review, add the `changelog-override`
  label to the PR and re-run the check (or push a new commit). The label
  is the sign-off record; it's visible in PR history, so this is never a
  silent bypass.

## Extending patterns

Add a new entry to `CHANGELOG_GATE_PATTERNS` in
`scripts/lib/changelog-gate-patterns.mjs`. No changes needed to the
workflow or the check script itself.

## Testing the gate locally

```
node scripts/check-changelog-gate.mjs --stdin-diff < path/to/diff.patch
```

or against a real branch:

```
node scripts/check-changelog-gate.mjs --base origin/dev --head HEAD
```
