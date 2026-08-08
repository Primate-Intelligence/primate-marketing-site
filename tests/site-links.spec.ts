import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * Site-wide link audit + render smoke (PRI link-audit, 2026-08-08).
 *
 * Route inventory comes from the LIVE sitemap so new pages are covered
 * automatically — a page missing from the sitemap is itself a bug the
 * "sitemap covers src/pages" check in CI would catch, and the hardcoded
 * EXTRA_ROUTES list below covers the deliberately-unlisted surfaces
 * (markdown twins, llms.txt, rss, redirects).
 */

const BASE = process.env.BASE_URL || 'https://primateintelligence.ai';

// Non-sitemap routes that must still resolve (markdown twins are generated
// per-page; spot-set covers every generator code path in src/pages/*.md.ts).
const EXTRA_ROUTES_200 = [
  '/llms.txt',
  '/llms-full.txt',
  '/.well-known/llms.txt',
  '/rss.xml',
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap-0.xml',
  '/docs/changelog.xml',
  '/index.md',
  '/about.md',
  '/pricing.md',
  '/use-cases.md',
  '/team.md',
  '/values.md',
  '/careers.md',
  '/faq.md',
  '/compare.md',
  '/technology.md',
  '/performance.md',
  '/agents.md',
  '/docs/agents.md',
  '/docs/changelog.md',
  '/docs/quickstart.md',
  '/docs/reference.md',
  '/docs/supported-actions.md',
  '/docs/guides/webhooks.md',
  '/blog/darwin-video-jepa-benchmarks.md',
  '/compare/twelve-labs.md',
  '/technology/benchmarks.md',
  '/technology/darwin-preview.md',
  '/use-cases/smart-cameras.md',
  '/docs/quickstart/', // legacy deep link, canonicalizes to /docs
];

// Redirects that must land on a 200 destination.
const REDIRECT_ROUTES = [
  '/signup',
  '/login',
  '/dashboard',
  '/blog/how-jepa-works',
  '/blog/benchmarks-deep-dive',
  '/blog/best-video-understanding-apis-2026',
  '/blog/primate-vision-vs-twelve-labs',
  '/v2/pricing',
  '/waitlist',
];

async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  const res = await request.get(`${BASE}/sitemap.xml`);
  expect(res.status(), 'sitemap.xml should be reachable').toBe(200);
  const xml = await res.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(paths.length).toBeGreaterThan(30);
  return paths;
}

test.describe('link audit', () => {
  test('every sitemap route and known extra route returns 200', async ({ request }) => {
    const paths = [...(await sitemapPaths(request)), ...EXTRA_ROUTES_200];
    const failures: string[] = [];
    for (const p of paths) {
      const res = await request.get(`${BASE}${p}`, { maxRedirects: 5 });
      if (res.status() !== 200) failures.push(`${res.status()} ${p}`);
    }
    expect(failures, `non-200 routes:\n${failures.join('\n')}`).toEqual([]);
  });

  test('redirect routes resolve to a 200 destination', async ({ request }) => {
    const failures: string[] = [];
    for (const p of REDIRECT_ROUTES) {
      const res = await request.get(`${BASE}${p}`, { maxRedirects: 8 });
      if (res.status() !== 200) failures.push(`${res.status()} ${p}`);
    }
    expect(failures, `broken redirects:\n${failures.join('\n')}`).toEqual([]);
  });

  test('no broken internal links anywhere on the site', async ({ request }) => {
    test.setTimeout(300_000);
    const pages = await sitemapPaths(request);
    const linkTargets = new Map<string, string>(); // path -> first page linking to it
    for (const p of pages) {
      const res = await request.get(`${BASE}${p}`);
      if (res.status() !== 200) continue;
      const html = await res.text();
      for (const m of html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)) {
        const href = m[1];
        if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;
        let u: URL;
        try {
          u = new URL(href, `${BASE}${p}`);
        } catch {
          continue;
        }
        if (u.origin !== new URL(BASE).origin) continue; // externals audited separately
        const path = u.pathname;
        if (!linkTargets.has(path)) linkTargets.set(path, p);
      }
    }
    expect(linkTargets.size).toBeGreaterThan(50);
    const failures: string[] = [];
    for (const [path, from] of linkTargets) {
      const res = await request.get(`${BASE}${path}`, { maxRedirects: 5 });
      if (res.status() >= 400) failures.push(`${res.status()} ${path} (linked from ${from})`);
    }
    expect(failures, `broken internal links:\n${failures.join('\n')}`).toEqual([]);
  });
});

test.describe('render smoke', () => {
  test('every sitemap page renders without console errors or failed requests', async ({
    page,
    request,
  }) => {
    test.setTimeout(600_000);
    const paths = await sitemapPaths(request);
    const failures: string[] = [];
    for (const p of paths) {
      const consoleErrors: string[] = [];
      const badResponses: string[] = [];
      const onConsole = (msg: { type: () => string; text: () => string }) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      };
      const onResponse = (res: { status: () => number; url: () => string }) => {
        if (res.status() >= 400 && res.url().startsWith(BASE)) {
          badResponses.push(`${res.status()} ${res.url()}`);
        }
      };
      page.on('console', onConsole);
      page.on('response', onResponse);
      const res = await page.goto(`${BASE}${p}`, { waitUntil: 'load' });
      if (!res || res.status() !== 200) failures.push(`HTTP ${res?.status()} ${p}`);
      if (consoleErrors.length) failures.push(`console errors on ${p}: ${consoleErrors.join(' | ')}`);
      if (badResponses.length) failures.push(`failed requests on ${p}: ${badResponses.join(' | ')}`);
      page.off('console', onConsole);
      page.off('response', onResponse);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});
