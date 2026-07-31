# Primate Intelligence — Marketing Site

The public website for Primate Intelligence's real-time video intelligence API — video analysis on live streams and uploads, built on JEPA predictive world models. Serves www.primateintelligence.ai: home, docs, pricing, use cases, blog, performance, and legal pages. Docs: https://www.primateintelligence.ai/docs · llms.txt: https://www.primateintelligence.ai/llms.txt · Free sandbox key: `POST https://api.primateintelligence.ai/v1/sandbox`.

## Stack

- **Framework**: [Astro](https://astro.build) (static output)
- **Deployment**: Vercel — `main` branch → production (www.primateintelligence.ai)
- **Content**: markdown-in-git blog posts (`src/content/`), `.md` twins for every page (agent-readable)

## Commands

| Command | Action |
| :--- | :--- |
| `npm ci` | Install dependencies |
| `npm run dev` | Local dev server at `localhost:4321` |
| `npm run build` | Production build to `./dist/` (also regenerates sitemap `<lastmod>` from git history and, on Vercel production builds, pings IndexNow) |
| `npm run preview` | Preview the build locally |

## Notable machinery

- `scripts/gen-lastmod.mjs` — real `<lastmod>` dates in the sitemap, derived from git history (PRI-492)
- `scripts/indexnow-ping.mjs` — submits sitemap URLs to Bing/IndexNow after each production deploy (PRI-492)
- `scripts/check-docs-twins.mjs` / `check-spec-drift.mjs` — docs pages must match the live API contract; the OpenAPI snapshot is intentionally pinned
- `vercel.json` — 301 topology (app routes → app.primateintelligence.ai) and content-type headers for `llms.txt` / `.md` twins
