import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

/**
 * Published posts, newest first. Drafts stay in the repo but never render —
 * except on dev builds (PUBLIC_SITE_ENV=dev), where drafts render too so
 * Matt can review them at dev-www.primateintelligence.ai before flipping
 * status to "published". Prod always filters to published only.
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const isDevEnv = import.meta.env.PUBLIC_SITE_ENV === 'dev';
  const posts = await getCollection(
    'blog',
    isDevEnv ? undefined : ({ data }) => data.status === 'published'
  );
  return posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
}

/**
 * Strictly-published posts, regardless of PUBLIC_SITE_ENV. Use this (never
 * getPublishedPosts) for anything that emits an absolute canonical-host link
 * intended for machine/agent consumption — llms.txt, llms-full.txt, RSS,
 * sitemap. Those links always point at the prod SITE host (toMarkdownTwin's
 * canonical is hardcoded to primateintelligence.ai), so on a dev build
 * getPublishedPosts()'s draft-preview posts produce links that 404 against
 * prod (caught 2026-08-13: broke the Doc link liveness CI check, which
 * fetches dev's llms-full.txt and follows every link unauthenticated).
 * Drafts stay reviewable by Matt on the dev *site* (blog/index + blog/[slug]
 * keep using getPublishedPosts) — they just never appear in a machine feed
 * before they're actually live.
 */
export async function getStrictlyPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection('blog', ({ data }) => data.status === 'published');
  return posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
}

/** Rebuild the canonical markdown file (frontmatter + body) for .md twins. */
export function toMarkdownTwin(post: Post): string {
  const d = post.data;
  const fm = [
    '---',
    `title: ${JSON.stringify(d.title)}`,
    `slug: ${JSON.stringify(d.slug)}`,
    `author: ${JSON.stringify(d.author)}`,
    `date: ${JSON.stringify(d.date)}`,
    `readTime: ${JSON.stringify(d.readTime)}`,
    `tags: ${JSON.stringify(d.tags)}`,
    `excerpt: ${JSON.stringify(d.excerpt)}`,
    `canonical: https://primateintelligence.ai/blog/${d.slug}`,
    '---',
  ].join('\n');
  return `${fm}\n\n${post.body ?? ''}\n`;
}

export function formatDate(dateStr: string, style: 'short' | 'long' = 'short'): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: style === 'short' ? 'short' : 'long',
    day: 'numeric',
    year: 'numeric',
  });
}
