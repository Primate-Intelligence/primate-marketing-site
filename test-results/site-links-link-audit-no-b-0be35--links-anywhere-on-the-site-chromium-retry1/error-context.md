# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: site-links.spec.ts >> link audit >> no broken internal links anywhere on the site
- Location: tests/site-links.spec.ts:94:3

# Error details

```
Error: broken internal links:
404 /docs/changelog/openapi.json (linked from /docs/changelog/)
404 /docs/changelog/agents.md (linked from /docs/changelog/)
404 /blog/benchmark-post (linked from /technology/benchmarks/)
404 /blog/determinism-post (linked from /technology/determinism/)
404 /blog/jepa-deep-dive (linked from /technology/how-jepa-works/)
404 /blog/security-camera-use-case (linked from /use-cases/smart-cameras/)

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 8

- Array []
+ Array [
+   "404 /docs/changelog/openapi.json (linked from /docs/changelog/)",
+   "404 /docs/changelog/agents.md (linked from /docs/changelog/)",
+   "404 /blog/benchmark-post (linked from /technology/benchmarks/)",
+   "404 /blog/determinism-post (linked from /technology/determinism/)",
+   "404 /blog/jepa-deep-dive (linked from /technology/how-jepa-works/)",
+   "404 /blog/security-camera-use-case (linked from /use-cases/smart-cameras/)",
+ ]
```

# Test source

```ts
  22  |   '/robots.txt',
  23  |   '/sitemap.xml',
  24  |   '/sitemap-0.xml',
  25  |   '/docs/changelog.xml',
  26  |   '/index.md',
  27  |   '/about.md',
  28  |   '/pricing.md',
  29  |   '/use-cases.md',
  30  |   '/team.md',
  31  |   '/values.md',
  32  |   '/careers.md',
  33  |   '/faq.md',
  34  |   '/compare.md',
  35  |   '/technology.md',
  36  |   '/performance.md',
  37  |   '/agents.md',
  38  |   '/docs/agents.md',
  39  |   '/docs/changelog.md',
  40  |   '/docs/quickstart.md',
  41  |   '/docs/reference.md',
  42  |   '/docs/supported-actions.md',
  43  |   '/docs/guides/webhooks.md',
  44  |   '/blog/darwin-video-jepa-benchmarks.md',
  45  |   '/compare/twelve-labs.md',
  46  |   '/technology/benchmarks.md',
  47  |   '/technology/darwin-preview.md',
  48  |   '/use-cases/smart-cameras.md',
  49  |   '/docs/quickstart/', // legacy deep link, canonicalizes to /docs
  50  | ];
  51  | 
  52  | // Redirects that must land on a 200 destination.
  53  | const REDIRECT_ROUTES = [
  54  |   '/signup',
  55  |   '/login',
  56  |   '/dashboard',
  57  |   '/blog/how-jepa-works',
  58  |   '/blog/benchmarks-deep-dive',
  59  |   '/blog/best-video-understanding-apis-2026',
  60  |   '/blog/primate-vision-vs-twelve-labs',
  61  |   '/v2/pricing',
  62  |   '/waitlist',
  63  | ];
  64  | 
  65  | async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
  66  |   const res = await request.get(`${BASE}/sitemap.xml`);
  67  |   expect(res.status(), 'sitemap.xml should be reachable').toBe(200);
  68  |   const xml = await res.text();
  69  |   const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  70  |   expect(paths.length).toBeGreaterThan(30);
  71  |   return paths;
  72  | }
  73  | 
  74  | test.describe('link audit', () => {
  75  |   test('every sitemap route and known extra route returns 200', async ({ request }) => {
  76  |     const paths = [...(await sitemapPaths(request)), ...EXTRA_ROUTES_200];
  77  |     const failures: string[] = [];
  78  |     for (const p of paths) {
  79  |       const res = await request.get(`${BASE}${p}`, { maxRedirects: 5 });
  80  |       if (res.status() !== 200) failures.push(`${res.status()} ${p}`);
  81  |     }
  82  |     expect(failures, `non-200 routes:\n${failures.join('\n')}`).toEqual([]);
  83  |   });
  84  | 
  85  |   test('redirect routes resolve to a 200 destination', async ({ request }) => {
  86  |     const failures: string[] = [];
  87  |     for (const p of REDIRECT_ROUTES) {
  88  |       const res = await request.get(`${BASE}${p}`, { maxRedirects: 8 });
  89  |       if (res.status() !== 200) failures.push(`${res.status()} ${p}`);
  90  |     }
  91  |     expect(failures, `broken redirects:\n${failures.join('\n')}`).toEqual([]);
  92  |   });
  93  | 
  94  |   test('no broken internal links anywhere on the site', async ({ request }) => {
  95  |     test.setTimeout(300_000);
  96  |     const pages = await sitemapPaths(request);
  97  |     const linkTargets = new Map<string, string>(); // path -> first page linking to it
  98  |     for (const p of pages) {
  99  |       const res = await request.get(`${BASE}${p}`);
  100 |       if (res.status() !== 200) continue;
  101 |       const html = await res.text();
  102 |       for (const m of html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)) {
  103 |         const href = m[1];
  104 |         if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) continue;
  105 |         let u: URL;
  106 |         try {
  107 |           u = new URL(href, `${BASE}${p}`);
  108 |         } catch {
  109 |           continue;
  110 |         }
  111 |         if (u.origin !== new URL(BASE).origin) continue; // externals audited separately
  112 |         const path = u.pathname;
  113 |         if (!linkTargets.has(path)) linkTargets.set(path, p);
  114 |       }
  115 |     }
  116 |     expect(linkTargets.size).toBeGreaterThan(50);
  117 |     const failures: string[] = [];
  118 |     for (const [path, from] of linkTargets) {
  119 |       const res = await request.get(`${BASE}${path}`, { maxRedirects: 5 });
  120 |       if (res.status() >= 400) failures.push(`${res.status()} ${path} (linked from ${from})`);
  121 |     }
> 122 |     expect(failures, `broken internal links:\n${failures.join('\n')}`).toEqual([]);
      |                                                                        ^ Error: broken internal links:
  123 |   });
  124 | });
  125 | 
  126 | test.describe('render smoke', () => {
  127 |   test('every sitemap page renders without console errors or failed requests', async ({
  128 |     page,
  129 |     request,
  130 |   }) => {
  131 |     test.setTimeout(600_000);
  132 |     const paths = await sitemapPaths(request);
  133 |     const failures: string[] = [];
  134 |     for (const p of paths) {
  135 |       const consoleErrors: string[] = [];
  136 |       const badResponses: string[] = [];
  137 |       const onConsole = (msg: { type: () => string; text: () => string }) => {
  138 |         if (msg.type() === 'error') consoleErrors.push(msg.text());
  139 |       };
  140 |       const onResponse = (res: { status: () => number; url: () => string }) => {
  141 |         if (res.status() >= 400 && res.url().startsWith(BASE)) {
  142 |           badResponses.push(`${res.status()} ${res.url()}`);
  143 |         }
  144 |       };
  145 |       page.on('console', onConsole);
  146 |       page.on('response', onResponse);
  147 |       const res = await page.goto(`${BASE}${p}`, { waitUntil: 'load' });
  148 |       if (!res || res.status() !== 200) failures.push(`HTTP ${res?.status()} ${p}`);
  149 |       if (consoleErrors.length) failures.push(`console errors on ${p}: ${consoleErrors.join(' | ')}`);
  150 |       if (badResponses.length) failures.push(`failed requests on ${p}: ${badResponses.join(' | ')}`);
  151 |       page.off('console', onConsole);
  152 |       page.off('response', onResponse);
  153 |     }
  154 |     expect(failures, failures.join('\n')).toEqual([]);
  155 |   });
  156 | });
  157 | 
```