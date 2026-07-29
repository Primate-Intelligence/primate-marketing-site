#!/usr/bin/env node
/**
 * check-docs-twins.mjs (PRI-504) — post-build assertion: for every
 * dist/docs/**\/index.html there is a same-path .md twin whose title matches
 * the page's <h1>. Drift check, not trust (Jeff's PRI-504 review).
 *
 * Exceptions: agents + changelog have no build-time .md (their canonical
 * markdown is proxied from the API deploy artifact via vercel.json), so for
 * those we assert the vercel.json rewrite exists instead.
 *
 * Run after astro build: node scripts/check-docs-twins.mjs
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const docsDist = join(dist, 'docs');

if (!existsSync(docsDist)) {
  console.error('dist/docs missing — run astro build first');
  process.exit(2);
}

const PROXIED = new Set(['agents', 'changelog']);

function* htmlPages(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlPages(p);
    else if (entry.name === 'index.html') yield p;
  }
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function h1Of(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? decodeEntities(m[1].replace(/<[^>]+>/g, '').trim()) : null;
}

function mdTitleOf(md) {
  const m = md.match(/^# (.+)$/m);
  return m ? m[1].trim() : null;
}

const vercelJson = readFileSync(join(root, 'vercel.json'), 'utf8');

let pages = 0;
let failures = 0;
for (const htmlPath of htmlPages(docsDist)) {
  pages++;
  const slug = relative(docsDist, dirname(htmlPath)).split('\\').join('/') || '(root)';
  const effectiveSlug = slug === '(root)' ? 'quickstart' : slug;

  if (PROXIED.has(effectiveSlug)) {
    if (!vercelJson.includes(`/docs/${effectiveSlug}.md`)) {
      failures++;
      console.error(`FAIL  /docs/${effectiveSlug} — proxied page but no vercel.json rewrite for /docs/${effectiveSlug}.md`);
    } else {
      console.log(`ok    /docs/${effectiveSlug} (md proxied to API canonical)`);
    }
    continue;
  }

  const mdPath = slug === '(root)' ? join(docsDist, 'quickstart.md') : join(docsDist, `${slug}.md`);
  if (!existsSync(mdPath) || statSync(mdPath).size === 0) {
    failures++;
    console.error(`FAIL  /docs/${effectiveSlug} — missing .md twin at ${relative(dist, mdPath)}`);
    continue;
  }

  const html = readFileSync(htmlPath, 'utf8');
  const md = readFileSync(mdPath, 'utf8');
  const h1 = h1Of(html);
  const mdTitle = mdTitleOf(md);
  if (!h1 || !mdTitle || h1 !== mdTitle) {
    failures++;
    console.error(`FAIL  /docs/${effectiveSlug} — title mismatch: html h1=${JSON.stringify(h1)} vs md=${JSON.stringify(mdTitle)}`);
    continue;
  }
  console.log(`ok    /docs/${effectiveSlug}`);
}

// llms surfaces must exist and mention the docs
for (const f of ['llms.txt', 'llms-full.txt', '.well-known/llms.txt']) {
  const p = join(dist, f);
  if (!existsSync(p) || !readFileSync(p, 'utf8').includes('/docs/')) {
    failures++;
    console.error(`FAIL  /${f} missing or has no docs links`);
  } else {
    console.log(`ok    /${f}`);
  }
}

console.log(`\n${pages} docs HTML pages checked, ${failures} failure(s)`);
process.exit(failures ? 1 : 0);
