#!/usr/bin/env node
/**
 * gen-lastmod.mjs (PRI-492) — generate src/generated/sitemap-lastmod.json:
 * a map of sitemap URL path → ISO lastmod date, derived from the last git
 * commit that touched each page's source file(s).
 *
 * Why a committed map: Vercel build containers have no .git directory, so
 * git dates can't be computed at deploy time. This script runs as part of
 * `npm run build` — locally (where git exists) it refreshes the map; on
 * Vercel (no git) it exits 0 and the committed map is used as-is.
 *
 * URL→source mapping mirrors the routing rules in src/pages/** and
 * src/lib/docsCorpus.ts. URLs without a confident mapping simply get no
 * <lastmod> (valid per the sitemap spec).
 */
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src', 'generated', 'sitemap-lastmod.json');

function gitDate(paths) {
  try {
    const out = execSync(
      `git log -1 --format=%cI -- ${paths.map((p) => JSON.stringify(p)).join(' ')}`,
      { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] },
    )
      .toString()
      .trim();
    return out || null;
  } catch {
    return null;
  }
}

// Bail out gracefully when git history is unavailable (e.g. Vercel build).
try {
  execSync('git rev-parse HEAD', { cwd: root, stdio: 'ignore' });
} catch {
  console.log('[gen-lastmod] no git history available — keeping committed map');
  process.exit(0);
}

const map = {};
const add = (urlPath, sources) => {
  const d = gitDate(sources);
  if (d) map[urlPath] = d;
};

// ── Static top-level pages ────────────────────────────────────────────────────
const staticPages = {
  '/': 'src/pages/index.astro',
  '/pricing/': 'src/pages/pricing.astro',
  '/performance/': 'src/pages/performance.astro',
  '/careers/': 'src/pages/careers.astro',
  '/cookie-policy/': 'src/pages/cookie-policy.astro',
  '/privacy/': 'src/pages/privacy.astro',
  '/team/': 'src/pages/team.astro',
  '/terms/': 'src/pages/terms.astro',
  '/use-cases/': 'src/pages/use-cases.astro',
  '/values/': 'src/pages/values.astro',
};
for (const [url, src] of Object.entries(staticPages)) add(url, [src]);

// ── Blog: slug comes from frontmatter, date from the content file ────────────
const blogDir = join(root, 'src', 'content', 'blog');
const blogFiles = [];
for (const f of readdirSync(blogDir).filter((f) => f.endsWith('.md'))) {
  const raw = readFileSync(join(blogDir, f), 'utf8');
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) continue;
  const slug = fm[1].match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1];
  const status = fm[1].match(/^status:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1];
  if (!slug || status !== 'published') continue;
  const rel = `src/content/blog/${f}`;
  blogFiles.push(rel);
  add(`/blog/${slug}/`, [rel]);
}
// Blog index reflects the newest change to any published post or the index page.
add('/blog/', ['src/pages/blog/index.astro', ...blogFiles]);

// ── Docs: content collection + generated/proxied pages ───────────────────────
const docsDir = join(root, 'src', 'content', 'docs');
const walk = (dir, prefix = '') =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(join(dir, e.name), `${prefix}${e.name}/`)
      : e.name.endsWith('.md')
        ? [`${prefix}${e.name.replace(/\.md$/, '')}`]
        : [],
  );
for (const slug of walk(docsDir)) {
  add(`/docs/${slug}/`, [`src/content/docs/${slug}.md`]);
}
// /docs is the canonical quickstart page.
add('/docs/', ['src/content/docs/quickstart.md', 'src/pages/docs/index.astro']);
add('/docs/errors/', ['src/spec/error-registry.json']);
add('/docs/agents/', ['src/snapshots/agents.md']);
add('/docs/changelog/', ['src/snapshots/changelog.md']);
add('/docs/reference/', ['src/pages/docs/reference.astro']);

if (!existsSync(dirname(OUT))) mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(map, null, 2) + '\n');
console.log(`[gen-lastmod] wrote ${Object.keys(map).length} lastmod entries → ${OUT}`);
