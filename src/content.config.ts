import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Blog posts migrated verbatim from primate-intelligence-website-dev
// src/content/posts/*.md (PRI-502). Slugs come from frontmatter — NOT
// filenames — so legacy /blog/:slug URLs are preserved 1:1.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    author: z.string(),
    authorInitials: z.string(),
    date: z.string(),
    readTime: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['published', 'draft']),
    excerpt: z.string(),
  }),
});

// Developer docs migrated verbatim from primate-intelligence-website-dev
// src/docs/content/** (PRI-504). Slugs come from file paths (quickstart,
// guides/uploading, …) — 1:1 with the legacy /docs/* URLs, zero renames.
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    section: z.string(),
  }),
});

// Comparison posts migrated from blog/ (menu-IA restructure). Slugs come from
// frontmatter — NOT filenames — matching the same pattern as the blog collection.
const compare = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/compare' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    author: z.string(),
    authorInitials: z.string(),
    date: z.string(),
    readTime: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['published', 'draft']),
    excerpt: z.string(),
  }),
});

export const collections = { blog, docs, compare };
