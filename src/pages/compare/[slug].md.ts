/**
 * Markdown twin for every comparison page: /compare/:slug.md
 * Generated at build time from the same source markdown that renders the HTML
 * page — never hand-maintained.
 */
import type { APIRoute } from 'astro';
import { getCompareEntries, toMarkdownTwin, type ComparePost } from '../../lib/compare';

export async function getStaticPaths() {
  const posts = await getCompareEntries();
  return posts.map((post) => ({ params: { slug: post.data.slug }, props: { post } }));
}

export const GET: APIRoute = ({ props }) => {
  const post = (props as { post: ComparePost }).post;
  return new Response(toMarkdownTwin(post), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
