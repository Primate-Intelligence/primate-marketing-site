/**
 * /technology/darwin-preview — single source of truth for the darwin-preview
 * announcement post (PRI-516). The HTML page AND the .md twin render from
 * these exports — never hand-maintain the twin (PRI-502: drift is worse than
 * absence).
 *
 * ACTION_CLASSES is copied verbatim from the inference repo:
 *   primate-intelligence-inference/inference/action_classes.json
 * When the model's action vocabulary changes, re-copy that file into
 * src/data/action_classes.json — do NOT edit the list here by hand.
 */
import actionClasses from './action_classes.json';

export const ACTION_CLASSES: string[] = actionClasses as string[];

export const POST = {
  slug: 'darwin-preview',
  title: 'darwin-preview is open for testing',
  date: '2026-08-01',
  excerpt:
    'We’re making darwin-preview — our real-time video action-detection model — available for testing. We’re looking for design partners, and we’re seeking feedback.',
};

/** Post body, minus the action list (which renders from ACTION_CLASSES). */
export const INTRO_PARAGRAPHS: string[] = [
  'We’re making darwin-preview available for testing today. We’re looking for design partners, and we’re seeking feedback.',
  'darwin-preview is a preview of our real-time video action-detection model. Point it at live video and it tells you what people are doing, as they do it — falling, climbing a ladder, opening a door, shaking hands. It’s built on a JEPA-based predictive world model: rather than classifying single frames in isolation, the model learns how scenes evolve over time and detects actions from that understanding of motion. That’s what lets it run against live streams instead of waiting for a clip to finish.',
  'Preview means preview. Quality is improving rapidly, and you should expect occasional misses — an action detected a beat late, or not at all. The vocabulary below is what the model is currently trained to detect. We’d rather show you exactly where the edges are than pretend there aren’t any.',
];

export const ACTIONS_INTRO =
  'darwin-preview currently detects 532 action classes. Prompts targeting actions outside this list may produce unreliable results — if the product sent you here after a prompt warning, this list is why.';

export const DESIGN_PARTNER = {
  heading: 'We’re looking for design partners',
  body: 'If you’re building on real-time video understanding — security, safety, retail, sports, robotics, manufacturing — we want to work with you directly while darwin-preview matures. Design partners get a direct line to the team and real influence over what the model learns to detect next.',
  ctaLabel: 'Become a design partner',
  email: 'matt@primateintelligence.ai',
  emailSubject: 'darwin-preview design partner',
};

export const FEEDBACK_ASK =
  'And if you’re just testing: tell us what it misses and what surprises you. A prompt that should have worked, an action caught that you didn’t expect — that feedback is exactly what a preview is for.';
