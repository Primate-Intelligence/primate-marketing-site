import type { APIRoute } from 'astro';
import {
  POST,
  INTRO_PARAGRAPHS,
  ACTIONS_INTRO,
  ACTION_CLASSES,
  DESIGN_PARTNER,
  FEEDBACK_ASK,
} from '../../data/darwinPreview';

/** Markdown twin for /technology/darwin-preview — generated from the same
 *  data module as the HTML page (never hand-maintained). */
export const GET: APIRoute = () => {
  const actions = [...ACTION_CLASSES].sort((a, b) => a.localeCompare(b));
  const md = `---
title: ${JSON.stringify(POST.title)}
date: ${JSON.stringify(POST.date)}
canonical: https://primateintelligence.ai/technology/${POST.slug}
site: Primate Intelligence
---

# ${POST.title}

${INTRO_PARAGRAPHS.join('\n\n')}

## What darwin-preview can detect today

${ACTIONS_INTRO}

${actions.map((a) => `- ${a}`).join('\n')}

## ${DESIGN_PARTNER.heading}

${DESIGN_PARTNER.body}

Contact: ${DESIGN_PARTNER.email} (subject: "${DESIGN_PARTNER.emailSubject}") · Try it: https://app.primateintelligence.ai/

${FEEDBACK_ASK}
`;
  return new Response(md, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
