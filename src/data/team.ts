/**
 * Team bios — migrated VERBATIM from primate-intelligence-website-dev
 * src/pages/Team.tsx (PRI-502).
 */
export interface TeamMember {
  name: string;
  title: string;
  image: string;
  linkedin: string;
  bio: string[];
}

export const TEAM_HERO = {
  eyebrow: 'Team',
  heading: 'The People Behind the Research',
};

export const TEAM: TeamMember[] = [
  {
    name: 'Matt Miesnieks',
    title: 'Co-founder & CEO',
    image: '/images/headshot-matt.jpg',
    linkedin: 'https://www.linkedin.com/in/mattmiesnieks/',
    bio: [
      'Matt is a serial entrepreneur with over 15 years building at the intersection of computer vision, spatial computing, and applied AI. He began his career as an Engineer in Sydney before spending a decade leading Enterprise Sales for frontier technology companies across APAC. He then led business at Layar — one of the first AR platforms — and founded Dekko, a mobile computer vision startup. In 2016 he co-founded 6D.ai, which pioneered the AR Cloud: a real-time 3D scene understanding platform that enabled mobile devices to reconstruct and reason about physical spaces. 6D.ai was acquired by Niantic in 2020, where its technology became core infrastructure for large-scale AR mapping.',
      "At Primate Intelligence, Matt leads Primate Vision — the company's flagship product for CV developers. He is focused on building the next generation of predictive world models, applying JEPA-based architectures to give computer vision developers research-grade scene understanding infrastructure. He is a frequent speaker and writer on spatial computing, physical AI, and the future of machine perception.",
    ],
  },
  {
    name: 'Mehdi Nikkhah',
    title: 'Co-founder & CTO',
    image: '/images/headshot-mehdi.jpg',
    linkedin: 'https://www.linkedin.com/in/mehdi-nikkhah/',
    bio: [
      'Mehdi is a computer vision researcher and engineer with over 15 years at the frontier of machine perception. He holds a PhD from the University of Pennsylvania, specializing in computer vision and deep learning architectures. After his doctorate, he led AI research at Cisco before joining 6D.ai as Principal Researcher, where he built and led the core AI engineering and research team — developing the real-time semantic understanding and depth estimation systems that powered the platform\'s scene reconstruction capabilities.',
      "At Primate Intelligence, Mehdi leads all technical research and engineering on Primate Vision, driving the design and implementation of the company's JEPA-based world models. His expertise spans self-supervised learning, semantic segmentation, depth estimation, and neural architecture design — a rare combination of research depth and production engineering that underpins Primate Vision's ability to move from lab to infrastructure at speed.",
    ],
  },
];
