import { getCollection, type CollectionEntry } from 'astro:content';

export type ComparePost = CollectionEntry<'compare'>;

/** Published comparison posts, newest first. */
export async function getCompareEntries(): Promise<ComparePost[]> {
  const posts = await getCollection('compare', ({ data }) => data.status === 'published');
  return posts.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
}

/** Rebuild the canonical markdown file (frontmatter + body) for .md twins. */
export function toMarkdownTwin(post: ComparePost): string {
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
    `canonical: https://primateintelligence.ai/compare/${d.slug}`,
    '---',
  ].join('\n');
  return `${fm}\n\n${post.body ?? ''}\n`;
}
