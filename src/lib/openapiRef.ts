/**
 * API reference generator (PRI-504) — markdown from the committed OpenAPI
 * 3.1 snapshot at src/spec/openapi.json.
 *
 * The API contract is FROZEN (MCP-submission scoring) — this module is
 * presentation only. The build reads the COMMITTED snapshot (deterministic
 * builds, per Jeff's PRI-504 review); drift vs the live spec is surfaced by
 * scripts/check-spec-drift.mjs in CI, and a human bumps the snapshot with
 * scripts/refresh-snapshots.mjs as a reviewed event.
 *
 * Output is a single markdown document (rendered to static HTML by the
 * /docs/reference page; served raw at /docs/reference.md) so agents and
 * crawlers get the full contract without JavaScript — replacing the SPA's
 * CDN-loaded Scalar embed.
 */
import spec from '../spec/openapi.json';
import { API } from './docsCorpus';

type Schema = Record<string, any>;

const SPEC = spec as Schema;
const METHOD_ORDER = ['get', 'post', 'put', 'patch', 'delete'];
// Display order: integration-journey order, not alphabetical.
const TAG_ORDER = [
  'provisioning',
  'videos',
  'analyses',
  'streams',
  'webhook_endpoints',
  'client_tokens',
  'billing',
  'usage',
  'meta',
];
const TAG_TITLES: Record<string, string> = {
  provisioning: 'Provisioning & keys',
  videos: 'Videos',
  analyses: 'Analyses',
  streams: 'Streams',
  webhook_endpoints: 'Webhook endpoints',
  client_tokens: 'Client tokens',
  billing: 'Billing',
  usage: 'Usage',
  meta: 'Meta & platform',
};

function deref(node: Schema | undefined): Schema | undefined {
  if (!node) return node;
  if (node.$ref) {
    const path = String(node.$ref).replace(/^#\//, '').split('/');
    let cur: any = SPEC;
    for (const part of path) cur = cur?.[part];
    return cur;
  }
  return node;
}

function refName(node: Schema | undefined): string | null {
  if (node?.$ref) return String(node.$ref).split('/').pop() ?? null;
  return null;
}

/** Compact one-line type description for a schema node. */
function typeLabel(node: Schema | undefined, depth = 0): string {
  if (!node) return 'unknown';
  const name = refName(node);
  if (name) return name;
  if (node.enum) return node.enum.map((v: unknown) => `\`${JSON.stringify(v)}\``).join(' · ');
  if (node.type === 'array') {
    const inner = node.items ? refName(node.items) ?? typeLabel(node.items, depth + 1) : 'any';
    return `array<${inner}>`;
  }
  if (node.anyOf || node.oneOf) {
    const parts = (node.anyOf ?? node.oneOf).map((n: Schema) => refName(n) ?? typeLabel(n, depth + 1));
    return parts.join(' | ');
  }
  let label = node.type ?? 'object';
  if (node.format) label += ` (${node.format})`;
  if (node.nullable) label += ' | null';
  return label;
}

function schemaAnchor(name: string): string {
  return `schema-${name.toLowerCase()}`;
}

function linkType(node: Schema | undefined): string {
  const name = refName(node);
  if (name) return `[${name}](#${schemaAnchor(name)})`;
  if (node?.type === 'array' && node.items) {
    const inner = refName(node.items);
    if (inner) return `array<[${inner}](#${schemaAnchor(inner)})>`;
  }
  return typeLabel(node);
}

function propertyRows(schema: Schema | undefined, indent = ''): string[] {
  const s = deref(schema);
  if (!s?.properties) return [];
  const required = new Set<string>(s.required ?? []);
  const rows: string[] = [];
  for (const [prop, rawNode] of Object.entries<Schema>(s.properties)) {
    const node = rawNode;
    const resolved = deref(node);
    const req = required.has(prop) ? ' *(required)*' : '';
    const desc = (resolved?.description ?? node.description ?? '').replace(/\s*\n\s*/g, ' ');
    rows.push(`${indent}- \`${prop}\` — ${linkType(node)}${req}${desc ? ` — ${desc}` : ''}`);
  }
  return rows;
}

function operationMarkdown(path: string, method: string, op: Schema): string {
  const anchor = `${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  let md = `### \`${method.toUpperCase()} ${path}\`\n\n<a id="${anchor}"></a>`;
  md += `**${op.summary ?? ''}**\n\n`;
  if (op.description) md += `${op.description}\n\n`;

  const params: Schema[] = op.parameters ?? [];
  if (params.length) {
    md += `**Parameters**\n\n`;
    for (const rawP of params) {
      const p = deref(rawP) ?? rawP;
      const req = p.required ? ' *(required)*' : '';
      const desc = (p.description ?? '').replace(/\s*\n\s*/g, ' ');
      md += `- \`${p.name}\` (${p.in}, ${typeLabel(p.schema)})${req}${desc ? ` — ${desc}` : ''}\n`;
    }
    md += '\n';
  }

  const reqBody = deref(op.requestBody);
  const reqSchema = reqBody?.content?.['application/json']?.schema;
  if (reqSchema) {
    md += `**Request body** — ${linkType(reqSchema)}\n\n`;
    const rows = propertyRows(reqSchema);
    if (rows.length && !refName(reqSchema)) md += rows.join('\n') + '\n\n';
  }

  const responses: Schema = op.responses ?? {};
  const codes = Object.keys(responses).sort();
  if (codes.length) {
    md += `**Responses**\n\n`;
    for (const code of codes) {
      const r = deref(responses[code]) ?? responses[code];
      const schema = r?.content?.['application/json']?.schema;
      const desc = (r?.description ?? '').replace(/\s*\n\s*/g, ' ');
      md += `- \`${code}\` — ${desc}${schema ? ` → ${linkType(schema)}` : ''}\n`;
    }
    md += '\n';
  }
  return md;
}

function schemasMarkdown(): string {
  const schemas: Record<string, Schema> = SPEC.components?.schemas ?? {};
  let md = `## Object schemas\n\nEvery named object in the contract. Field types link to their schema.\n\n`;
  for (const [name, schema] of Object.entries(schemas)) {
    md += `### ${name}\n\n<a id="${schemaAnchor(name)}"></a>`;
    if (schema.description) md += `${String(schema.description).replace(/\s*\n\s*/g, ' ')}\n\n`;
    const rows = propertyRows(schema);
    if (rows.length) {
      md += rows.join('\n') + '\n\n';
    } else if (schema.enum) {
      md += `Enum: ${schema.enum.map((v: unknown) => `\`${JSON.stringify(v)}\``).join(' · ')}\n\n`;
    } else {
      md += `Type: ${typeLabel(schema)}\n\n`;
    }
  }
  return md;
}

export interface RefTagSection {
  tag: string;
  title: string;
  operations: Array<{ method: string; path: string; summary: string; anchor: string }>;
}

/** Nav model for the reference page TOC. */
export function referenceToc(): RefTagSection[] {
  const byTag = new Map<string, RefTagSection['operations']>();
  for (const [path, ops] of Object.entries<Schema>(SPEC.paths)) {
    for (const method of METHOD_ORDER) {
      const op = ops[method];
      if (!op) continue;
      const tag = op.tags?.[0] ?? 'meta';
      const anchor = `${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      (byTag.get(tag) ?? byTag.set(tag, []).get(tag)!).push({
        method,
        path,
        summary: op.summary ?? '',
        anchor,
      });
    }
  }
  const tags = [...TAG_ORDER.filter((t) => byTag.has(t)), ...[...byTag.keys()].filter((t) => !TAG_ORDER.includes(t))];
  return tags.map((tag) => ({ tag, title: TAG_TITLES[tag] ?? tag, operations: byTag.get(tag)! }));
}

/** The full reference as one markdown document (HTML page + .md twin source). */
export function referenceMarkdown(): string {
  const info = SPEC.info ?? {};
  let md = `# API reference

> ${String(info.description ?? '').split('\n')[0] || 'Primate Vision API — full endpoint reference.'}

Generated from the OpenAPI 3.1 contract (version \`${info.version ?? 'v1'}\`). The machine-readable spec is the source of truth: [${API}/v1/openapi.json](${API}/v1/openapi.json).

- Base URL: \`${API}\`
- Auth: \`Authorization: Bearer $PRIMATE_API_KEY\` (see [Security model](/docs/guides/security-model))
- Errors: every non-2xx response carries the standard envelope — see the [Error registry](/docs/errors)

`;
  for (const section of referenceToc()) {
    md += `## ${section.title}\n\n`;
    for (const op of section.operations) {
      const pathOps = (SPEC.paths as Schema)[op.path];
      md += operationMarkdown(op.path, op.method, pathOps[op.method]);
    }
  }
  md += schemasMarkdown();
  return md;
}
