/**
 * Markdown twin for every blog post: /blog/:slug.md
 * Generated at build time from the SAME source markdown that renders the HTML
 * page (PRI-502 rule: never hand-maintained twins).
 */
import type { APIRoute } from 'astro';
import { getPublishedPosts, toMarkdownTwin, type Post } from '../../lib/blog';

export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ params: { slug: post.data.slug }, props: { post } }));
}

export const GET: APIRoute = ({ props }) => {
  const post = (props as { post: Post }).post;
  return new Response(toMarkdownTwin(post), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
};
