/**
 * Docs corpus (PRI-504) — single source of truth for the /docs section.
 *
 * Composition:
 *   - Authored guides: src/content/docs/** (Astro content collection,
 *     migrated verbatim from the SPA's src/docs/content/**; slugs are the
 *     file paths so legacy /docs/* URLs are preserved 1:1).
 *   - Error registry page: GENERATED at build time from the committed spec
 *     snapshot src/spec/error-registry.json (same markdown shape the SPA's
 *     generate-docs-artifacts.mjs produced — anchor ids per error code are
 *     load-bearing: error-registry.ts stamps docs_url #<code> anchors into
 *     every API error response).
 *   - API-canonical pages (agents, changelog): canonical copy lives in the
 *     API deploy artifact and is PROXIED at /docs/agents.md etc. via
 *     vercel.json rewrites ("one clock", PRI-482 r8). The HTML pages render
 *     from committed snapshots in src/snapshots/ (refresh via
 *     scripts/refresh-snapshots.mjs; drift surfaced by scripts/check-spec-drift.mjs).
 *
 * Rule (PRI-502/PRI-504): HTML pages, .md twins, llms.txt and llms-full.txt
 * are ALL generated from this module — never hand-maintained twins.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import errorRegistry from '../spec/error-registry.json';
import agentsSnapshot from '../snapshots/agents.md?raw';
import changelogSnapshot from '../snapshots/changelog.md?raw';

export const API = 'https://api.primateintelligence.ai';
/** Docs canonical host (PRI-504: docs live at www). */
export const WWW = 'https://www.primateintelligence.ai';

export type DocEntry = CollectionEntry<'docs'>;

export interface DocPage {
  slug: string;
  title: string;
  description: string;
  section: string;
  order: number;
  /** Raw markdown body (no frontmatter). */
  body: string;
  /** True when the canonical .md is served by the API deploy artifact (proxied). */
  remoteCanonical: boolean;
}

const SECTIONS = ['Getting started', 'Guides', 'Reference'] as const;

// ── Error registry page (generated from the committed snapshot) ───────────────

interface RegistryEntry {
  code: string;
  kind: string;
  status: number | null;
  retryable: boolean;
  idem: boolean;
  message: string;
  docs_url: string;
}

export function errorsMarkdown(): string {
  const rows = (errorRegistry as { data: RegistryEntry[] }).data;
  const http = rows.filter((r) => r.kind === 'http');
  const resource = rows.filter((r) => r.kind === 'resource');
  let md = `# Error registry

Every error code the API can return, with retry semantics. This registry is closed and append-only — codes are never removed or repurposed within v1. Machine-readable at \`GET ${API}/v1/errors\`.

**retryable** = safe to retry the same request unchanged (with backoff). **idem** = idempotent to retry with the same \`Idempotency-Key\`.

## HTTP errors

`;
  for (const r of http) {
    md += `### \`${r.code}\`\n\n<a id="${r.code}"></a>**HTTP ${r.status}** · retryable: **${r.retryable ? 'yes' : 'no'}** · idem: **${r.idem ? 'yes' : 'no'}**\n\n${r.message}\n\n`;
  }
  md += `## Resource-level errors

These never appear as HTTP responses — only in \`analysis.error.code\` / \`video.error.code\` on failed resources.

`;
  for (const r of resource) {
    md += `### \`${r.code}\`\n\n<a id="${r.code}"></a>${r.message}\n\n`;
  }
  return md;
}

// ── Corpus assembly ────────────────────────────────────────────────────────────

const REMOTE_META = [
  {
    slug: 'agents',
    title: 'Quickstart for AI agents',
    description:
      'The zero-human-intervention integration path — canonical copy served by the API deploy artifact.',
    section: 'Getting started',
    order: 2,
    body: agentsSnapshot,
  },
  {
    slug: 'changelog',
    title: 'Changelog',
    description:
      'Dated API changes, newest-first — canonical copy served by the API deploy artifact. Subscribe via RSS at /docs/changelog.xml.',
    section: 'Reference',
    order: 90,
    body: changelogSnapshot,
  },
];

export async function getDocsPages(): Promise<DocPage[]> {
  const entries = await getCollection('docs');
  const local: DocPage[] = entries.map((e) => ({
    slug: e.id.replace(/\.md$/, ''),
    title: e.data.title,
    description: e.data.description,
    section: e.data.section,
    order: e.data.order,
    body: e.body ?? '',
    remoteCanonical: false,
  }));
  const remote: DocPage[] = REMOTE_META.map((m) => ({ ...m, remoteCanonical: true }));
  const errors: DocPage = {
    slug: 'errors',
    title: 'Error registry',
    description: 'Every error code with retry semantics — the docs_url targets.',
    section: 'Reference',
    order: 80,
    body: errorsMarkdown(),
    remoteCanonical: false,
  };
  return [...local, ...remote, errors].sort((a, b) => a.order - b.order);
}

export interface NavSection {
  section: string;
  pages: Array<Pick<DocPage, 'slug' | 'title' | 'description'>>;
}

/** Sidebar nav, grouped in fixed section order; Reference includes /docs/reference. */
export async function getDocsNav(): Promise<NavSection[]> {
  const pages = await getDocsPages();
  return SECTIONS.map((section) => ({
    section,
    pages: [
      ...pages
        .filter((p) => p.section === section)
        .map(({ slug, title, description }) => ({ slug, title, description })),
      ...(section === 'Reference'
        ? [
            {
              slug: 'reference',
              title: 'API reference',
              description: 'Every endpoint, generated from the OpenAPI 3.1 spec.',
            },
          ]
        : []),
    ],
  }));
}

// ── Markdown twins ─────────────────────────────────────────────────────────────

/** Clean markdown twin for a docs page (same shape the SPA's public/docs/*.md had). */
export function docMarkdownTwin(page: DocPage): string {
  return `# ${page.title}\n\n> ${page.description}\n\n${page.body.replace(/^# .*\n/, '')}`;
}
