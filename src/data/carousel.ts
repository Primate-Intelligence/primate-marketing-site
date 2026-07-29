/**
 * Darwin carousel — all 13 slides migrated VERBATIM from
 * primate-intelligence-website-dev src/components/PrimateVision/BeforeStateCarousel.tsx
 * (PRI-502 content-fidelity rule: copy exact, no paraphrase, no new illustrations).
 * Legacy CTA hrefs pointing at /v2/* are normalized to their new-home path per
 * the PRI-501 URL map (copy unchanged).
 */
export interface CarouselSlide {
  eyebrow?: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
  imgSrc: string;
}

export const SLIDES: CarouselSlide[] = [
  {
    heading: "Darwin watches your video and tells you what's happening — in real time.",
    body: 'Point your camera. Type what to look for. Darwin streams results as it watches.',
    imgSrc: '/images/slide-hero-darwin-watching.jpg',
  },
  {
    eyebrow: 'Platform',
    heading: 'JEPA world models for physical AI.',
    body: 'First deployable JEPA perception product. Cloud performance. Edge costs.',
    cta: { label: 'How JEPA works →', href: '/blog/how-jepa-works' },
    imgSrc: '/images/slide0-brain-diagram.png',
  },
  {
    eyebrow: 'Edge',
    heading: 'SOTA inference left the cloud.',
    body: 'Research-grade video benchmarks running on $400 hardware. Not a tradeoff.',
    imgSrc: '/images/slide1-sota.png',
  },
  {
    eyebrow: 'Accuracy',
    heading: "VLMs hallucinate. JEPA can't.",
    body: 'Deterministic — reasons from evidence, not pattern completion.',
    cta: { label: 'Benchmarks →', href: '/blog/benchmarks-deep-dive' },
    imgSrc: '/images/slide2-jepa-cant.png',
  },
  {
    eyebrow: 'Cost',
    heading: '10× cheaper. More accurate.',
    body: 'On-device inference with orders of magnitude more efficiency than VLMs.',
    cta: { label: 'See pricing →', href: '/pricing' },
    imgSrc: '/images/slide3-10x-cheaper.png',
  },
  {
    eyebrow: 'Smart Cameras',
    heading: 'From detection to understanding. Same camera.',
    body: "Behavioural understanding, not bounding boxes. Primate Vision knows what someone is doing, not just that they're present.",
    imgSrc: '/images/slide4-smart-cameras.png',
  },
  {
    eyebrow: 'Robotics',
    heading: 'World models that predict before robots act.',
    body: 'World model perception for robotic systems. Predict the interaction before the motor decision.',
    imgSrc: '/images/slide5-robotics.png',
  },
  {
    eyebrow: 'Healthcare',
    heading: "Hallucinations aren't a bug. They're a risk.",
    body: 'Every output is verifiable, repeatable and grounded in what it observed.',
    imgSrc: '/images/slide6-healthcare.png',
  },
  {
    eyebrow: 'Drones / UAV',
    heading: 'Real-time on-device inference. Finally.',
    body: '100% on-device real-time processing. No cloud roundtrips.',
    imgSrc: '/images/slide7-drones.png',
  },
  {
    eyebrow: 'Autonomous Vehicles',
    heading: 'AV perception that anticipates.',
    body: "AV perception architectures excel at detecting what's there. The hardest problem is predicting what will happen next.",
    imgSrc: '/images/slide8-autonomous.png',
  },
  {
    eyebrow: 'Video Search',
    heading: 'Deterministic video search at a fraction of VLM cost.',
    body: 'Query video in natural language. Find the frame where the event happened.',
    imgSrc: '/images/slide9-video-search.png',
  },
  {
    eyebrow: 'Video Ad Tech',
    heading: 'Real-time scene understanding. Deterministic.',
    body: "Contextual targeting that understands what's happening, not just what objects are present.",
    imgSrc: '/images/slide10-adtech.png',
  },
  {
    eyebrow: 'Benchmarks',
    heading: "We didn't move the goalposts. We cleared them.",
    body: 'SSv2 top-1 and EK-100 results that match or exceed the largest VLMs at 10× lower cost.',
    cta: { label: 'See the numbers →', href: '/blog/benchmarks-deep-dive' },
    imgSrc: '/images/slide0-brain-diagram.png',
  },
];
