// PRI-492 item 7: IndexNow ping — tells Bing (and every IndexNow-participating
// engine) about our URLs minutes after a production deploy instead of waiting
// for a crawl. ChatGPT search rides Bing's index, so this is the fastest path
// from "published" to "citable by ChatGPT".
//
// Runs as the last step of `npm run build`. Behavior:
//   - Only pings on Vercel PRODUCTION builds (VERCEL_ENV === 'production').
//     Preview/dev builds and local builds skip (log + exit 0).
//   - Submits every URL in the generated sitemap (well under the 10k/POST cap).
//   - NEVER fails the build: any error is logged and swallowed.
//
// Key file: public/8f93da61a26840f0a1ccbda3cee3f503.txt (added in PRI-505),
// serving at https://primateintelligence.ai/8f93da61a26840f0a1ccbda3cee3f503.txt

import { readFileSync } from 'node:fs';

const KEY = '8f93da61a26840f0a1ccbda3cee3f503';
const HOST = 'primateintelligence.ai';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log(`[indexnow] skip — VERCEL_ENV=${process.env.VERCEL_ENV ?? '(unset)'} (only pings on production builds)`);
    return;
  }

  const xml = readFileSync(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) {
    console.log('[indexnow] skip — no URLs found in dist/sitemap.xml');
    return;
  }

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList: urls,
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  // 200 = submitted, 202 = accepted pending key validation — both fine.
  console.log(`[indexnow] submitted ${urls.length} URLs → HTTP ${res.status}`);
}

main().catch((err) => {
  // Non-fatal by design: indexing pings must never break a deploy.
  console.warn(`[indexnow] ping failed (non-fatal): ${err?.message ?? err}`);
});
