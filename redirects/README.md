# Prepared 301 maps (NOT ACTIVE)

`docs-301-map.json` — PRI-504. Every legacy docs URL on the apex
(`primateintelligence.ai/docs/*`) mapped to its new home on
`www.primateintelligence.ai/docs/*`. Path parity is 1:1 — the map is a host
swap, no slug renames.

**Status: prepared, intentionally inactive.** The old SPA docs keep serving
until P4 (PRI-505, the launch gate) flips the redirects on the apex Vercel
project. Do not apply earlier.

Activation checklist (P4 owns this):

1. Verify the www docs on a production deployment: every URL in the map's
   `redirects[].destination` returns 200 with real HTML / markdown
   (agent-fetch check with GPTBot / ClaudeBot / PerplexityBot UAs).
2. Enumerate the PRI-475 OpenAI-submission URLs; anything cited there must
   keep resolving byte-identically (redirect or duplicate-serve — audit each,
   per Jeff's PRI-504 review).
3. Add the `vercel_redirects` block from `docs-301-map.json` to the apex
   project's `vercel.json` **and remove the SPA's `/docs/*` rewrites and
   React routes in the same change** (a redirect behind a rewrite never
   fires).
4. 301s preserve URL fragments, so the `docs_url: …/docs/errors#<code>`
   anchors stamped into every API error response keep working with zero API
   changes (contract is frozen).
5. Re-verify MCP submission scoring 10/10 after the flip (llms.txt URLs
   change to www).
