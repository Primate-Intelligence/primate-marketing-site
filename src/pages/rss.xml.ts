/**
 * Blog RSS feed — /rss.xml (net-new; no legacy feed existed on the SPA).
 * Feed URL is effectively permanent once agents/readers pick it up (PRI-502).
 */
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/blog';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
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
