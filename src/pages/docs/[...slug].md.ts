/**
 * Markdown twin for every docs page: /docs/:slug.md (PRI-504).
 * Generated at build time from the SAME corpus that renders the HTML pages
 * (PRI-502 rule: twins are never hand-maintained).
 *
 * agents.md + changelog.md are intentionally ABSENT here — their canonical
 * copies live in the API deploy artifact and are proxied by vercel.json
 * rewrites (one clock, PRI-482 r8). Emitting build-time snapshots at those
 * URLs would shadow the proxy and reintroduce drift.
 */
import type { APIRoute } from 'astro';
import { getDocsPages, docMarkdownTwin, type DocPage } from '../../lib/docsCorpus';

export async function getStaticPaths() {
  const pages = await getDocsPages();
  return pages
    .filter((page) => !page.remoteCanonical)
    .map((page) => ({ params: { slug: page.slug }, props: { page } }));
}

export const GET: APIRoute = ({ props }) => {
  const page = (props as { page: DocPage }).page;
  return new Response(docMarkdownTwin(page), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
