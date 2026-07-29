/**
 * Use-case verticals — migrated VERBATIM from
 * primate-intelligence-website-dev src/pages/UseCases.tsx (PRI-502).
 */
export type StatusVariant = 'green' | 'amber' | 'steel';

export interface Vertical {
  badge: string;
  headline: string;
  description: string;
  keyBenefit: string;
  statusLabel: string;
  statusVariant: StatusVariant;
}

export const USE_CASES_HERO = {
  eyebrow: 'Use Cases',
  heading: 'One model. Eight markets.',
  lede: "Primate Vision's JEPA world model addresses every CV pipeline where hallucinations, brittle performance, or cloud inference costs are limiting you.",
  note: "We're focused on smart cameras for initial PMF. Design partners active across use cases below.",
};

export const VERTICALS: Vertical[] = [
  {
    badge: 'Smart Cameras / Physical Security',
    headline: 'Loitering detection that actually works.',
    description:
      "Security cameras can detect objects. They can't understand what those objects are doing. Loitering, tailgating, abandoned bags, slip-and-fall events — these require temporal scene understanding that YOLO-class models simply can't provide. Primate Vision identifies actions, not just objects, and delivers the same deterministic answer every time.",
    keyBenefit:
      'Zero false-negative loitering events. No hallucinations under varying lighting or camera angle.',
    statusLabel: 'Design partners active',
    statusVariant: 'green',
  },
  {
    badge: 'Robotics',
    headline: 'Robots that understand before they act.',
    description:
      "General-purpose robots need to understand object relationships and predict the consequences of actions — not just detect what's in view. Fragmented CV pipelines (YOLO + SAM + custom post-processing) are the primary bottleneck to shipping intelligent robot behavior. Primate Vision replaces the stack with a single API call.",
    keyBenefit:
      'One API replaces YOLO + SAM + depth + custom glue. Works zero-shot across environments.',
    statusLabel: 'Design partners active',
    statusVariant: 'green',
  },
  {
    badge: 'Healthcare / Medical Imaging',
    headline: "In healthcare, hallucinations aren't a bug. They're a risk.",
    description:
      "Vision language models that give different answers to the same scan on different days are unusable in clinical settings. Primate Vision's deterministic architecture — same input, same output, every time — is a clinical-grade property, not just a technical nicety. AMI Labs, founded by Yann LeCun, has validated healthcare as a primary target for JEPA-based models.",
    keyBenefit:
      'Deterministic, auditable outputs. Every result verifiable against the same input.',
    statusLabel: 'Exploring',
    statusVariant: 'amber',
  },
  {
    badge: 'Drones / UAV',
    headline: 'Understood, not just recorded.',
    description:
      "Drone-captured footage is high-resolution but contextually sparse — current CV models detect objects but can't classify scene state, identify hazards, or understand what's happening at altitude. Primate Vision's edge-capable architecture runs on Jetson-grade hardware onboard, providing scene understanding without cloud roundtrips.",
    keyBenefit:
      'On-device scene understanding. No cloud dependency for real-time flight decisions.',
    statusLabel: 'Exploring',
    statusVariant: 'amber',
  },
  {
    badge: 'Autonomous Vehicles',
    headline: 'Predict before it happens.',
    description:
      "AV perception systems excel at detecting what's there. The hardest problem is predicting what will happen next — a pedestrian's intent to cross, a vehicle's turning behavior, a cyclist's trajectory. Primate Vision's predictive world model architecture is designed for temporal action anticipation.",
    keyBenefit:
      "Action prediction, not just detection. The same JEPA architecture that powers AMI's robotics research.",
    statusLabel: 'Coming — roadmap',
    statusVariant: 'steel',
  },
  {
    badge: 'Video Search & Summarization',
    headline: 'Search your archive like a database.',
    description:
      "NVIDIA's VSS Blueprint can summarize a video — but it samples 8 frames per 30 seconds and hallucinates the gaps. Primate Vision analyzes every frame and returns deterministic structured output, making video archives genuinely queryable without the reliability problems that plague LLM-based approaches.",
    keyBenefit:
      'Deterministic structured output. Same query, same answer. Every time.',
    statusLabel: 'Exploring',
    statusVariant: 'amber',
  },
  {
    badge: 'Video Advertising / Ad Tech',
    headline: 'Real-time scene context for every frame.',
    description:
      "Contextual video advertising requires understanding what's happening in a scene — not just what objects are present. Primate Vision's action and relationship understanding enables frame-level contextual signals for ad insertion, brand safety, and content classification at inference speeds that cloud VLMs can't match.",
    keyBenefit:
      'Frame-level scene understanding at edge inference speeds. No $120/camera/month cloud APIs.',
    statusLabel: 'Exploring',
    statusVariant: 'amber',
  },
  {
    badge: 'Research / Academia',
    headline: 'SOTA JEPA benchmarks. Open for research.',
    description:
      "Primate Vision's backbone beats V-JEPA 2.1 on SSv2 and EK-100 action benchmarks at a fraction of the training cost. For researchers building on JEPA architectures, Primate Vision provides a production-grade API surface over the same underlying model family.",
    keyBenefit:
      'Beats V-JEPA 2.1 on action benchmarks. Full methodology published at launch.',
    statusLabel: 'Available',
    statusVariant: 'green',
  },
];

export const USE_CASES_CTA = {
  heading: 'Ready to test Primate Vision on your footage?',
  body: 'Upload a short video. Ask a question. See the result in ~10 seconds.',
  primary: { label: 'Try it now →', href: 'https://primateintelligence.ai/' },
  secondary: {
    label: 'Talk to us about your use case →',
    href: 'https://cal.com/mattmiesnieks/customer-discovery',
  },
};
