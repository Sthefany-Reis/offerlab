import type { Specialist } from '@/lib/types';

// Curated mock specialist mentors. Chat is AI-powered locally; LinkedIn links
// open the public LinkedIn profile so the user can connect for real.
export const SPECIALISTS: Specialist[] = [
  {
    id: 'maya-recruiter',
    name: 'Maya Okonkwo',
    title: 'Senior Tech Recruiter',
    field: 'Recruiting & hiring',
    expertise: ['Resume screening', 'Salary negotiation', 'Interview pipelines'],
    bio: 'Spent 10+ years hiring engineers and PMs at high-growth startups and FAANG.',
    avatarColor: 'bg-brand',
    linkedinUrl: 'https://www.linkedin.com/search/results/people/?keywords=tech%20recruiter',
  },
  {
    id: 'daniel-eng-lead',
    name: 'Daniel Park',
    title: 'Engineering Manager',
    field: 'Software engineering careers',
    expertise: ['System design', 'Leveling up', 'Tech interviews'],
    bio: 'Manages platform teams and has interviewed hundreds of engineers from junior to staff.',
    avatarColor: 'bg-violet',
    linkedinUrl: 'https://www.linkedin.com/search/results/people/?keywords=engineering%20manager',
  },
  {
    id: 'sofia-design',
    name: 'Sofia Marino',
    title: 'Principal Product Designer',
    field: 'Product & UX design',
    expertise: ['Portfolio reviews', 'Design systems', 'Craft & storytelling'],
    bio: 'Builds design teams and mentors designers transitioning into product roles.',
    avatarColor: 'bg-coral',
    linkedinUrl: 'https://www.linkedin.com/search/results/people/?keywords=product%20designer',
  },
  {
    id: 'amir-data',
    name: 'Amir Hassan',
    title: 'Head of Data Science',
    field: 'Data & analytics',
    expertise: ['ML portfolios', 'Case studies', 'Breaking into data'],
    bio: 'Leads data science org; passionate about helping analysts grow into DS/ML roles.',
    avatarColor: 'bg-info',
    linkedinUrl: 'https://www.linkedin.com/search/results/people/?keywords=data%20science',
  },
  {
    id: 'grace-career',
    name: 'Grace Bennett',
    title: 'Career & Leadership Coach',
    field: 'Career strategy',
    expertise: ['Career pivots', 'Personal branding', 'Confidence & negotiation'],
    bio: 'Certified coach who helps professionals change industries and land senior roles.',
    avatarColor: 'bg-positive',
    linkedinUrl: 'https://www.linkedin.com/search/results/people/?keywords=career%20coach',
  },
];

export function getSpecialist(id: string): Specialist | undefined {
  return SPECIALISTS.find((s) => s.id === id);
}
