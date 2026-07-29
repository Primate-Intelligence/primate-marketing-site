/**
 * Company values — migrated VERBATIM from primate-intelligence-website-dev
 * src/pages/Values.tsx (PRI-502).
 */
export interface Value {
  name: string;
  body: string;
}

export const VALUES_HERO = {
  eyebrow: 'Our Values',
  heading: 'Built on Substance, Not Status',
  lede: 'Seven principles that guide how we work, who we hire, and what we build.',
  attribution: 'Matt Miesnieks · Co-founder & CEO',
};

export const VALUES: Value[] = [
  {
    name: 'NO EGO',
    body: "We give credit to other people and other teams. We win together and lose together. Leaders give the credit and take the blame. These are hard standards — they frequently go against our emotions in the moment. But it's how we build a team that's resilient, supportive, and able to achieve more than talented individuals can achieve alone.",
  },
  {
    name: 'ENGINEERING FIRST',
    body: "We solve hard technical problems. We want to be known as a place where great engineers do great work. We ship products, even when shipping requires risky research. We don't boil the ocean, and we don't do science projects that nobody asked for.",
  },
  {
    name: 'SERVE OTHERS',
    body: "We exist to make our customers successful and let them get all the glory. Building the enabling technology, knowing we helped you succeed — that's what we live for. It's infinitely more gratifying to help someone else succeed than to receive the accolades ourselves.",
  },
  {
    name: 'TRANSPARENCY & TRUST',
    body: 'Transparency creates accountability. But leadership must first earn the right to ask for it. Anyone who is transparent with us — team members, customers, the world — must be trusted by us in return. Knowing we are working toward a shared vision is the basis of succeeding together.',
  },
  {
    name: 'DIVERSITY',
    body: "We want to expose ourselves to a wide range of viewpoints. We don't care about your background beyond whether you share our mission, can contribute to it, and bring life experiences that enrich us all. We recognise many people are systematically disadvantaged, and we hold ourselves accountable.",
  },
  {
    name: 'DATA & PRIVACY',
    body: "We charge for the value we directly provide. Like AWS or Stripe, our business model is not built on your data. We're not exposed to the conflicted motivations that incumbents have. We will make mistakes — ask to be judged by how we respond to them, not expected to make none.",
  },
  {
    name: 'CREATIVITY',
    body: 'We are engineers working on deep technical problems, but at heart we are working for something bigger than ourselves. To solve hard problems, you need to be as creative in your thinking and take risks in your execution as any artist or founder.',
  },
];

// Compact team blurbs used on the Values page team section (verbatim).
export const VALUES_TEAM = {
  eyebrow: 'The Team',
  heading: "Built by people who've done this before",
  members: [
    {
      name: 'Matt Miesnieks',
      title: 'CEO & Co-founder',
      image: '/images/headshot-matt.jpg',
      blurb:
        'Previously co-founded 6D.ai, pioneering real-world AR at scale. Sold to Niantic. Building the next generation of spatial intelligence.',
    },
    {
      name: 'Mehdi Nikkhah',
      title: 'CTO & Co-founder',
      image: '/images/headshot-mehdi.jpg',
      blurb:
        'Led all CV engineering and research at 6D.ai. 15 years building computer vision systems at the frontier. PhD, world-class spatial AI researcher.',
    },
  ],
};
