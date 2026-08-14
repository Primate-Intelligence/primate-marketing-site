/**
 * Blog RSS feed — /rss.xml (net-new; no legacy feed existed on the SPA).
 * Feed URL is effectively permanent once agents/readers pick it up (PRI-502).
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getStrictlyPublishedPosts } from '../lib/blog';

export async function GET(context: APIContext) {
  // Strictly-published, not getPublishedPosts: `site` below is hardcoded to
  // the prod host regardless of which environment built this feed, so a dev
  // build's draft-preview posts would emit permanent RSS entries linking to
  // prod URLs that 404 (drafts are excluded from prod). Same class of bug as
  // llms.txt (2026-08-13) — any machine feed with an absolute/canonical link
  // must use the strict variant; only the human blog pages preview drafts.
  const posts = await getStrictlyPublishedPosts();
  return rss({
    title: 'Primate Intelligence Blog',
    description: 'Research notes and perspectives from the Primate Intelligence team.',
    site: context.site ?? 'https://primateintelligence.ai',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.excerpt,
      link: `/blog/${post.data.slug}`,
      pubDate: new Date(post.data.date),
      author: post.data.author,
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
