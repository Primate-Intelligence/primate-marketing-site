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
