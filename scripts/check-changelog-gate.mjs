#!/usr/bin/env node
/**
 * check-changelog-gate.mjs (PRI-576 / PRI-578) — CI gate that blocks
 * internal-process leaks and competitively sensitive usage/performance
 * numbers from landing in public-facing copy.
 *
 * Scans the git diff of a PR (base...head) restricted to public-content
 * files (the changelog snapshot + anything under src/data or src/pages that
 * feeds a public page) for added lines matching CHANGELOG_GATE_PATTERNS.
 *
 * Override: a PR with the `changelog-override` label skips the gate (still
 * runs and reports, but exits 0) — human sign-off is the label itself, so
 * the override is visible in PR history, not a silent bypass.
 *
 * Usage:
 *   node scripts/check-changelog-gate.mjs [--base <ref>] [--head <ref>]
 *   node scripts/check-changelog-gate.mjs --stdin-diff   (test fixtures)
 *
 * Exit codes: 0 clean or overridden, 1 flagged content found, 2 usage error.
 */
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { scanText } from './lib/changelog-gate-patterns.mjs';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const GATED_PATH_PATTERNS = [
  /^src\/snapshots\/changelog\.md$/,
  /^src\/data\/performance\.ts$/,
  /^src\/pages\/performance\.(astro|md\.ts)$/,
];

function isGatedPath(path) {
  return GATED_PATH_PATTERNS.some((re) => re.test(path));
}

function getDiff() {
  if (args.includes('--stdin-diff')) {
    return readFileSync(0, 'utf8');
  }
  const base = getArg('--base', process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'origin/dev');
  const head = getArg('--head', 'HEAD');
  try {
    execSync(`git rev-parse ${base}`, { stdio: 'ignore' });
  } catch {
    execSync(`git fetch origin ${base.replace(/^origin\//, '')} --depth=50`, { stdio: 'ignore' });
  }
  const gatedFiles = [
    'src/snapshots/changelog.md',
    'src/data/performance.ts',
    'src/pages/performance.astro',
    'src/pages/performance.md.ts',
  ];
  return execSync(`git diff ${base}...${head} -- ${gatedFiles.map((f) => `'${f}'`).join(' ')}`, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
}

// Parse a unified diff, yielding { path, line, text } for ADDED lines only,
// scoped to gated paths.
function* addedLines(diffText) {
  let currentPath = null;
  let gated = false;
  let newLineNo = 0;
  for (const raw of diffText.split('\n')) {
    if (raw.startsWith('+++ ')) {
      const p = raw.slice(4).replace(/^b\//, '');
      currentPath = p;
      gated = isGatedPath(p);
      continue;
    }
    if (raw.startsWith('@@')) {
      const m = raw.match(/\+(\d+)/);
      newLineNo = m ? parseInt(m[1], 10) - 1 : 0;
      continue;
    }
    if (!gated) continue;
    if (raw.startsWith('+++') || raw.startsWith('---')) continue;
    if (raw.startsWith('+')) {
      newLineNo++;
      yield { path: currentPath, line: newLineNo, text: raw.slice(1) };
    } else if (!raw.startsWith('-')) {
      newLineNo++;
    }
  }
}

const diff = getDiff();
const findings = [];
for (const { path, line, text } of addedLines(diff)) {
  const hits = scanText(text);
  for (const hit of hits) {
    findings.push({ path, line, text: text.trim(), ...hit });
  }
}

if (findings.length === 0) {
  console.log('changelog-gate: no flagged patterns in gated files — clean.');
  process.exit(0);
}

console.error(`changelog-gate: ${findings.length} flagged line(s):\n`);
for (const f of findings) {
  console.error(`  ${f.path}:${f.line}  [${f.label}]`);
  console.error(`    > ${f.text}`);
  console.error(`    reason: ${f.reason}\n`);
}

const overridden = (process.env.PR_LABELS || '').split(',').map((s) => s.trim()).includes('changelog-override');
if (overridden) {
  console.error('changelog-override label present — human sign-off recorded, passing despite flags.');
  process.exit(0);
}

console.error('Add the `changelog-override` label after explicit human review to bypass, or fix the flagged content.');
process.exit(1);
