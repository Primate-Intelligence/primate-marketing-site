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

export const collections = { blog };
