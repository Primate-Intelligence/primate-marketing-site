// changelog-gate-patterns.mjs (PRI-576/PRI-578) — regex config for the
// changelog-gate CI check. One list, two purposes: block internal-process
// leaks in the public changelog (PRI-576) AND block competitively sensitive
// usage/performance numbers anywhere on the public site (PRI-578) — per
// Matt's directive these are one review step, not two disconnected gates.
//
// Add new patterns here, not in the workflow or the check script.
// Each entry: { id, label, regex, reason }
//   - regex must NOT have the global flag set here; the checker clones it
//     with 'gi' as needed.

export const CHANGELOG_GATE_PATTERNS = [
  // --- PRI-576: internal dev-cadence / process leaks ---
  {
    id: 'ticket-ref',
    label: 'Internal ticket reference',
    regex: /\bPRI-\d+\b/,
    reason: 'Internal Linear ticket IDs should not appear in public-facing copy.',
  },
  {
    id: 'internal-status-words',
    label: 'Internal status/process language',
    regex: /\b(internal|TODO|WIP|FIXME|legal review|staging|pending review|do not ship|not for release)\b/i,
    reason: 'Internal-only status language leaked into a public page.',
  },
  {
    id: 'sprint-cadence',
    label: 'Sprint/velocity/cadence language',
    regex: /\b(sprint|velocity|story points?|standup|retro(spective)?|backlog groom(ing)?)\b/i,
    reason: 'Internal dev-cadence terminology should not appear in public docs.',
  },
  {
    id: 'engineer-names',
    label: 'Named engineer / internal handle',
    regex: /\b(Jeff|Mehdi Nikkhah|Matt Miesnieks)\b/,
    reason: 'Internal team references do not belong in customer-facing changelog entries.',
  },

  // --- PRI-578: competitively sensitive usage/performance numbers ---
  {
    id: 'sample-count',
    label: 'Exact sample/session count',
    regex: /\b\d+\s*(frames?|sessions?|runs?)\b/i,
    reason: 'Exact sample counts disclose real production usage/traffic scale to competitors.',
  },
  {
    id: 'usage-scale-framing',
    label: 'Usage-scale framing phrase',
    regex: /\b(all production sessions?( in (the )?window)?|trailing \d+ days?|last \d+ days?)\b/i,
    reason: 'Phrasing that lets a reader infer real customer traffic volume.',
  },
];

/**
 * Scan a block of text for gate matches.
 * @param {string} text
 * @returns {{id:string,label:string,reason:string,match:string,index:number}[]}
 */
export function scanText(text) {
  const hits = [];
  for (const p of CHANGELOG_GATE_PATTERNS) {
    const re = new RegExp(p.regex.source, p.regex.flags.includes('i') ? 'gi' : 'g');
    let m;
    while ((m = re.exec(text)) !== null) {
      hits.push({ id: p.id, label: p.label, reason: p.reason, match: m[0], index: m.index });
      if (m.index === re.lastIndex) re.lastIndex++; // avoid infinite loop on zero-width
    }
  }
  return hits;
}
