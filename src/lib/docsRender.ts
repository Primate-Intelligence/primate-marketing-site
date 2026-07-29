/**
 * Docs markdown → HTML renderer (PRI-504).
 *
 * Mirrors the SPA's src/docs/render.ts (marked, GFM, stable heading ids so
 * the error-registry #<code> anchors and TOC links keep working) but runs at
 * BUILD time — output is static HTML, no client JS. Content is trusted
 * (committed markdown + generated-from-committed-spec), never user input.
 */
import { Marked } from 'marked';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const marked = new Marked({ gfm: true, breaks: false });

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const plain = text.replace(/<[^>]+>/g, '').replace(/[`*_]/g, '');
      return `<h${depth} id="${slugify(plain)}">${text}</h${depth}>\n`;
    },
  },
});

/** Strip frontmatter + doc-test annotations (CI metadata) for display. */
export function prepareMarkdown(raw: string): string {
  let md = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
  md = md.replace(/^```(\w+)[^\n]*$/gm, '```$1');
  return md;
}

export function renderDocsMarkdown(raw: string): string {
  return marked.parse(prepareMarkdown(raw)) as string;
}

/** Extract h2/h3 headings for the on-page table of contents. */
export function extractHeadings(raw: string): Array<{ depth: number; text: string; id: string }> {
  const md = prepareMarkdown(raw);
  const out: Array<{ depth: number; text: string; id: string }> = [];
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(##|###) (.+)$/);
    if (m) {
      const text = m[2].replace(/[`*_]/g, '');
      out.push({ depth: m[1].length, text, id: slugify(text) });
    }
  }
  return out;
}
