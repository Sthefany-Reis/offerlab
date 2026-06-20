import type {
  ChatMessage as SpecialistChatMessage,
  CvAnalysis,
  InterviewAnswerFeedback,
  InterviewQuestion,
  InterviewSession,
  JobApplication,
  JobMatchResult,
  QualifiedJob,
  RebuiltCv,
  Roadmap,
  SkillGap,
  SkillToImprove,
  Specialist,
} from '@/lib/types';

// Fully local, on-device career engine. No external AI provider (no OpenAI / Gemini).
// All functions are async to preserve the existing call sites and loading UX.
// OpenAIError export name is retained so consuming screens need no changes.
export class OpenAIError extends Error {}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// Small async wrapper so screens keep their spinner/await flow and feel responsive.
function compute<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err instanceof Error ? err : new OpenAIError('Could not process the request.'));
      }
    }, 350);
  });
}

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function uniq(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      out.push(item.trim());
    }
  }
  return out;
}

// ---- Skill knowledge base -------------------------------------------------

interface SkillDef {
  name: string;
  aliases: string[];
  category: 'language' | 'frontend' | 'backend' | 'data' | 'cloud' | 'design' | 'pm' | 'soft';
}

const SKILL_DB: SkillDef[] = [
  { name: 'JavaScript', aliases: ['javascript', 'js', 'es6', 'ecmascript'], category: 'language' },
  { name: 'TypeScript', aliases: ['typescript', 'ts'], category: 'language' },
  { name: 'Python', aliases: ['python', 'py'], category: 'language' },
  { name: 'Java', aliases: ['java'], category: 'language' },
  { name: 'Go', aliases: ['golang', 'go lang'], category: 'language' },
  { name: 'C#', aliases: ['c#', 'csharp', '.net', 'dotnet'], category: 'language' },
  { name: 'Ruby', aliases: ['ruby', 'rails'], category: 'language' },
  { name: 'PHP', aliases: ['php', 'laravel'], category: 'language' },
  { name: 'SQL', aliases: ['sql', 'postgres', 'postgresql', 'mysql', 'sqlite'], category: 'data' },
  { name: 'React', aliases: ['react', 'reactjs', 'react.js'], category: 'frontend' },
  { name: 'React Native', aliases: ['react native', 'react-native', 'expo'], category: 'frontend' },
  { name: 'Vue', aliases: ['vue', 'vuejs', 'nuxt'], category: 'frontend' },
  { name: 'Angular', aliases: ['angular'], category: 'frontend' },
  { name: 'Next.js', aliases: ['next.js', 'nextjs', 'next js'], category: 'frontend' },
  { name: 'HTML/CSS', aliases: ['html', 'css', 'scss', 'sass', 'tailwind'], category: 'frontend' },
  { name: 'Node.js', aliases: ['node', 'node.js', 'nodejs', 'express'], category: 'backend' },
  { name: 'GraphQL', aliases: ['graphql', 'apollo'], category: 'backend' },
  { name: 'REST APIs', aliases: ['rest', 'restful', 'api', 'apis'], category: 'backend' },
  { name: 'Docker', aliases: ['docker', 'container', 'containers'], category: 'cloud' },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'], category: 'cloud' },
  {
    name: 'AWS',
    aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
    category: 'cloud',
  },
  { name: 'Azure', aliases: ['azure'], category: 'cloud' },
  { name: 'GCP', aliases: ['gcp', 'google cloud'], category: 'cloud' },
  { name: 'CI/CD', aliases: ['ci/cd', 'cicd', 'jenkins', 'github actions'], category: 'cloud' },
  {
    name: 'Data Analysis',
    aliases: ['data analysis', 'analytics', 'pandas', 'numpy'],
    category: 'data',
  },
  {
    name: 'Machine Learning',
    aliases: ['machine learning', 'ml', 'tensorflow', 'pytorch', 'scikit'],
    category: 'data',
  },
  {
    name: 'Figma',
    aliases: ['figma', 'sketch', 'adobe xd'],
    category: 'design',
  },
  {
    name: 'UI/UX Design',
    aliases: ['ui', 'ux', 'user experience', 'user interface', 'wireframe', 'prototyping'],
    category: 'design',
  },
  {
    name: 'Product Management',
    aliases: ['product management', 'product manager', 'roadmap', 'backlog'],
    category: 'pm',
  },
  { name: 'Agile/Scrum', aliases: ['agile', 'scrum', 'kanban', 'sprint'], category: 'pm' },
  {
    name: 'Project Management',
    aliases: ['project management', 'stakeholder', 'jira'],
    category: 'pm',
  },
  {
    name: 'Communication',
    aliases: ['communication', 'presentation', 'stakeholder management'],
    category: 'soft',
  },
  { name: 'Leadership', aliases: ['leadership', 'led', 'managed', 'mentored'], category: 'soft' },
  {
    name: 'Marketing',
    aliases: ['marketing', 'seo', 'campaign', 'growth', 'content'],
    category: 'pm',
  },
  { name: 'Sales', aliases: ['sales', 'crm', 'salesforce', 'pipeline'], category: 'pm' },
];

interface RoleProfile {
  role: string;
  keywords: string[];
  coreSkills: string[];
  baseSalary: number; // USD mid annual for mid-level
}

const ROLE_DB: RoleProfile[] = [
  {
    role: 'Frontend Engineer',
    keywords: ['frontend', 'front-end', 'front end', 'ui developer', 'web developer'],
    coreSkills: ['JavaScript', 'TypeScript', 'React', 'HTML/CSS', 'REST APIs'],
    baseSalary: 105000,
  },
  {
    role: 'Backend Engineer',
    keywords: ['backend', 'back-end', 'back end', 'server', 'api developer'],
    coreSkills: ['Node.js', 'SQL', 'REST APIs', 'Docker', 'AWS'],
    baseSalary: 115000,
  },
  {
    role: 'Full-Stack Engineer',
    keywords: ['full stack', 'full-stack', 'fullstack', 'software engineer', 'developer'],
    coreSkills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'],
    baseSalary: 118000,
  },
  {
    role: 'Mobile Engineer',
    keywords: ['mobile', 'ios', 'android', 'react native', 'flutter'],
    coreSkills: ['React Native', 'TypeScript', 'JavaScript', 'REST APIs'],
    baseSalary: 112000,
  },
  {
    role: 'Data Scientist',
    keywords: ['data scientist', 'machine learning', 'ml engineer', 'data science'],
    coreSkills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    baseSalary: 125000,
  },
  {
    role: 'Data Analyst',
    keywords: ['data analyst', 'analytics', 'business intelligence', 'bi'],
    coreSkills: ['SQL', 'Data Analysis', 'Python', 'Communication'],
    baseSalary: 85000,
  },
  {
    role: 'DevOps Engineer',
    keywords: ['devops', 'sre', 'site reliability', 'platform engineer', 'infrastructure'],
    coreSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    baseSalary: 122000,
  },
  {
    role: 'Product Manager',
    keywords: ['product manager', 'product owner', 'product lead'],
    coreSkills: ['Product Management', 'Agile/Scrum', 'Communication', 'Data Analysis'],
    baseSalary: 120000,
  },
  {
    role: 'Product Designer',
    keywords: ['product designer', 'ux designer', 'ui designer', 'designer'],
    coreSkills: ['Figma', 'UI/UX Design', 'Communication'],
    baseSalary: 100000,
  },
  {
    role: 'Marketing Manager',
    keywords: ['marketing', 'growth', 'seo', 'content manager', 'brand'],
    coreSkills: ['Marketing', 'Communication', 'Data Analysis'],
    baseSalary: 90000,
  },
];

const SENIORITY_TIERS: { label: string; minYears: number; multiplier: number }[] = [
  { label: 'Lead / Principal', minYears: 9, multiplier: 1.55 },
  { label: 'Senior', minYears: 5, multiplier: 1.3 },
  { label: 'Mid-level', minYears: 2, multiplier: 1.0 },
  { label: 'Junior', minYears: 0, multiplier: 0.72 },
];

function detectSkills(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const skill of SKILL_DB) {
    if (skill.aliases.some((a) => lower.includes(a))) found.push(skill.name);
  }
  return uniq(found);
}

function detectYears(text: string): number {
  const lower = text.toLowerCase();
  let best = 0;
  const explicit = lower.match(/(\d{1,2})\+?\s*(?:years|yrs|year)\b/g);
  if (explicit) {
    for (const m of explicit) {
      const n = Number(m.match(/\d{1,2}/)?.[0] ?? 0);
      if (n > best && n <= 40) best = n;
    }
  }
  // Year ranges like 2018-2024 / 2019 – present
  const years = [...lower.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => Number(m[0]));
  if (years.length >= 2) {
    const span = new Date().getFullYear() - Math.min(...years);
    if (span > best && span <= 40) best = span;
  }
  return best;
}

function pickRole(text: string, skills: string[], targetRole: string): RoleProfile {
  const lower = text.toLowerCase();
  const skillSet = new Set(skills);
  let best: RoleProfile | undefined;
  let bestScore = -1;
  for (const role of ROLE_DB) {
    let score = 0;
    if (role.keywords.some((k) => lower.includes(k))) score += 4;
    if (targetRole && role.keywords.some((k) => targetRole.toLowerCase().includes(k))) score += 3;
    score += role.coreSkills.filter((s) => skillSet.has(s)).length;
    if (score > bestScore) {
      bestScore = score;
      best = role;
    }
  }
  return best ?? ROLE_DB[2];
}

function seniorityFor(years: number): (typeof SENIORITY_TIERS)[number] {
  return SENIORITY_TIERS.find((t) => years >= t.minYears) ?? SENIORITY_TIERS[3];
}

interface RegionInfo {
  region: string;
  currency: string;
  factor: number;
}

function regionFor(location: string): RegionInfo {
  const l = location.toLowerCase();
  if (/germany|berlin|munich|deutschland/.test(l))
    return { region: 'Germany', currency: 'EUR', factor: 0.82 };
  if (/uk|united kingdom|london|england/.test(l))
    return { region: 'United Kingdom', currency: 'GBP', factor: 0.78 };
  if (/india|bangalore|bengaluru|mumbai|delhi/.test(l))
    return { region: 'India', currency: 'USD', factor: 0.32 };
  if (/canada|toronto|vancouver/.test(l)) return { region: 'Canada', currency: 'CAD', factor: 1.0 };
  if (/australia|sydney|melbourne/.test(l))
    return { region: 'Australia', currency: 'AUD', factor: 1.05 };
  if (/europe|france|spain|netherlands|amsterdam|paris/.test(l))
    return { region: 'Europe', currency: 'EUR', factor: 0.85 };
  if (/remote/.test(l)) return { region: 'Remote', currency: 'USD', factor: 0.95 };
  return { region: location ? titleCase(location) : 'United States', currency: 'USD', factor: 1.0 };
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

// ---- analyzeCv ------------------------------------------------------------

export function analyzeCv(input: {
  rawText: string;
  targetRole: string;
  location: string;
}): Promise<CvAnalysis> {
  return compute(() => {
    const text = input.rawText.trim();
    if (text.length < 40) {
      throw new OpenAIError('That CV looks too short to analyze. Paste more of your CV text.');
    }

    const skills = detectSkills(text);
    const years = detectYears(text);
    const role = pickRole(text, skills, input.targetRole);
    const tier = seniorityFor(years);
    const region = regionFor(input.location);

    const coverage = role.coreSkills.filter((s) => skills.includes(s)).length;
    const coverageRatio = coverage / role.coreSkills.length;

    // CV strength score from length, skill breadth, experience and quantification.
    const hasNumbers = /\d+%|\$\d|\d+\s*(users|customers|revenue|projects|team)/i.test(text);
    const hasActionVerbs =
      /\b(led|built|designed|launched|improved|reduced|increased|managed)\b/i.test(text);
    let score = 42;
    score += Math.min(skills.length, 12) * 2.2;
    score += Math.min(years, 10) * 1.6;
    score += coverageRatio * 14;
    if (hasNumbers) score += 7;
    if (hasActionVerbs) score += 6;
    if (text.length > 1500) score += 4;
    const overallScore = Math.max(28, Math.min(96, Math.round(score)));

    const mid = roundTo(role.baseSalary * tier.multiplier * region.factor, 1000);
    const low = roundTo(mid * 0.84, 1000);
    const high = roundTo(mid * 1.22, 1000);

    const skillGaps: SkillGap[] = role.coreSkills
      .filter((s) => !skills.includes(s))
      .slice(0, 6)
      .map((skill, i) => ({
        skill,
        importance: i === 0 ? 'critical' : i < 2 ? 'high' : 'medium',
        currentLevel: 'none',
        targetLevel: 'advanced',
        reason: `${skill} is a core expectation for ${role.role} roles and is missing or not evident in your CV.`,
      }));
    // If they already cover the role, suggest stretch skills.
    if (skillGaps.length < 3) {
      const stretch = ['System Design', 'Mentoring', 'Performance Optimization', 'Testing'].filter(
        (s) => !skills.includes(s),
      );
      for (const s of stretch) {
        if (skillGaps.length >= 4) break;
        skillGaps.push({
          skill: s,
          importance: 'medium',
          currentLevel: 'beginner',
          targetLevel: 'advanced',
          reason: `Deepening ${s} would strengthen your case for more senior ${role.role} positions.`,
        });
      }
    }

    const topStrengths = uniq([
      ...(skills.length >= 6 ? ['Broad, relevant technical skill set'] : []),
      ...(years >= 5 ? [`${years} years of hands-on experience`] : []),
      ...(hasNumbers ? ['Quantified, results-oriented achievements'] : []),
      ...skills.slice(0, 3).map((s) => `Practical ${s} experience`),
    ]).slice(0, 5);
    if (topStrengths.length < 3) topStrengths.push('Clear, readable CV structure');

    const weaknesses = uniq([
      ...(hasNumbers ? [] : ['Few quantified outcomes — add metrics (%, $, scale)']),
      ...(skillGaps.length
        ? [
            `Gaps in ${skillGaps
              .slice(0, 2)
              .map((g) => g.skill)
              .join(' and ')}`,
          ]
        : []),
      ...(years < 2 ? ['Limited demonstrable years of experience'] : []),
      ...(text.length < 1200 ? ['CV is on the short side; expand key roles'] : []),
    ]).slice(0, 4);
    if (weaknesses.length < 2) weaknesses.push('Tailor wording more closely to your target role');

    const factors: CvAnalysis['marketValue']['factors'] = [
      {
        label: `${tier.label} seniority`,
        impact: tier.multiplier >= 1 ? 'positive' : 'neutral',
        note: `Estimated from ~${years} years of experience.`,
      },
      {
        label: 'Skill coverage',
        impact: coverageRatio >= 0.6 ? 'positive' : 'negative',
        note: `${coverage}/${role.coreSkills.length} core ${role.role} skills detected.`,
      },
      {
        label: region.region,
        impact: region.factor >= 1 ? 'positive' : 'neutral',
        note: `Salary normalized to the ${region.region} market.`,
      },
    ];
    if (hasNumbers)
      factors.push({
        label: 'Measurable impact',
        impact: 'positive',
        note: 'CV includes quantified achievements.',
      });

    return {
      detectedRole: role.role,
      seniority: tier.label,
      yearsExperience: years,
      topStrengths,
      weaknesses,
      currentSkills: skills.length ? skills : ['Communication', 'Problem solving'],
      overallScore,
      oneLineSummary: `${tier.label} ${role.role} with ~${years} years of experience and ${skills.length} relevant skills.`,
      marketValue: {
        currency: region.currency,
        lowAnnual: low,
        midAnnual: mid,
        highAnnual: high,
        region: region.region,
        seniority: tier.label,
        matchedRole: role.role,
        summary: `As a ${tier.label.toLowerCase()} ${role.role} in ${region.region}, market pay typically ranges ${region.currency} ${Math.round(low / 1000)}k–${Math.round(high / 1000)}k, centered near ${region.currency} ${Math.round(mid / 1000)}k.`,
        factors,
      },
      skillGaps,
    } satisfies CvAnalysis;
  });
}

// ---- buildRoadmap ---------------------------------------------------------

const RESOURCE_TEMPLATES: Record<
  string,
  { title: string; type: Roadmap['steps'][number]['resources'][number]['type']; provider: string }[]
> = {
  default: [
    { title: 'Structured online course', type: 'course', provider: 'Coursera' },
    { title: 'Hands-on practice project', type: 'project', provider: 'Self-directed' },
    { title: 'Reference book', type: 'book', provider: "O'Reilly" },
  ],
};

export function buildRoadmap(input: { analysis: CvAnalysis; goalRole: string }): Promise<Roadmap> {
  return compute(() => {
    const gaps = input.analysis.skillGaps.length
      ? input.analysis.skillGaps
      : input.analysis.currentSkills.slice(0, 4).map(
          (skill): SkillGap => ({
            skill,
            importance: 'medium',
            currentLevel: 'intermediate',
            targetLevel: 'advanced',
            reason: 'Deepen an existing strength.',
          }),
        );

    const steps: Roadmap['steps'] = gaps.slice(0, 6).map((gap, i) => {
      const weeks = gap.importance === 'critical' ? 4 : gap.importance === 'high' ? 3 : 2;
      const templates = RESOURCE_TEMPLATES.default;
      return {
        id: uid(),
        title: `Master ${gap.skill}`,
        skill: gap.skill,
        description: `Close the ${gap.importance} gap in ${gap.skill}: study fundamentals, then apply them in a small project relevant to a ${input.goalRole}.`,
        durationWeeks: weeks,
        milestone: `Ship a deliverable demonstrating ${gap.skill} to a ${input.goalRole} standard.`,
        resources: [
          {
            title: `${gap.skill} fundamentals`,
            type: templates[i % templates.length].type,
            provider: templates[i % templates.length].provider,
            estimatedHours: weeks * 6,
          },
          {
            title: `Build a ${gap.skill} mini-project`,
            type: 'project',
            provider: 'Self-directed',
            estimatedHours: weeks * 4,
          },
        ],
        done: false,
      };
    });

    return {
      goalRole: input.goalRole,
      totalWeeks: steps.reduce((sum, s) => sum + s.durationWeeks, 0),
      createdAt: Date.now(),
      steps,
    } satisfies Roadmap;
  });
}

// ---- tailorApplication ----------------------------------------------------

export function tailorApplication(input: {
  analysis: CvAnalysis;
  rawCv: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}): Promise<JobApplication> {
  return compute(() => {
    const jobSkills = detectSkills(`${input.jobTitle} ${input.jobDescription}`);
    const have = new Set(input.analysis.currentSkills);
    const highlightedSkills = jobSkills.filter((s) => have.has(s));
    const missingForRole = jobSkills.filter((s) => !have.has(s)).slice(0, 5);

    const overlap = jobSkills.length ? highlightedSkills.length / jobSkills.length : 0.6;
    const matchScore = Math.max(
      35,
      Math.min(97, Math.round(overlap * 70 + (input.analysis.overallScore / 100) * 30)),
    );

    const finalHighlights = (
      highlightedSkills.length ? highlightedSkills : input.analysis.currentSkills
    ).slice(0, 8);

    const company = input.company || 'your team';
    const role = input.jobTitle || input.analysis.detectedRole;

    const coverLetter = `Dear ${company} hiring team,

I'm excited to apply for the ${role} role. As a ${input.analysis.seniority.toLowerCase()} ${input.analysis.detectedRole} with ${input.analysis.yearsExperience}+ years of experience, I bring strong skills in ${finalHighlights.slice(0, 4).join(', ')} that map directly to what this position requires.

In recent work I have ${input.analysis.topStrengths[0]?.toLowerCase() ?? 'delivered measurable results'} and consistently focused on outcomes. I'm confident I can contribute quickly to ${company}'s goals${missingForRole.length ? `, while ramping up on ${missingForRole.slice(0, 2).join(' and ')}` : ''}.

I'd welcome the chance to discuss how my background fits your team. Thank you for your consideration.

Sincerely,
${input.analysis.detectedRole}`;

    const resumeBullets = uniq([
      `Delivered ${input.analysis.detectedRole} work using ${finalHighlights[0] ?? 'core tooling'}, improving key outcomes`,
      `Collaborated cross-functionally to ship features aligned with ${role} responsibilities`,
      `Applied ${finalHighlights.slice(0, 3).join(', ')} to solve real product problems`,
      `Owned end-to-end delivery from planning through release`,
      `Mentored peers and raised quality standards across the team`,
    ]).slice(0, 6);

    return {
      id: uid(),
      jobTitle: role,
      company: input.company,
      jobDescription: input.jobDescription,
      status: 'draft',
      createdAt: Date.now(),
      matchScore,
      tailoredSummary: `${input.analysis.seniority} ${input.analysis.detectedRole} targeting ${role} at ${company}, with proven strength in ${finalHighlights.slice(0, 3).join(', ')}.`,
      coverLetter,
      highlightedSkills: finalHighlights,
      missingForRole,
      resumeBullets,
    } satisfies JobApplication;
  });
}

// ---- generateInterview ----------------------------------------------------

export function generateInterview(input: {
  role: string;
  company: string;
  rawCv: string;
}): Promise<InterviewSession> {
  return compute(() => {
    const role = input.role || 'this role';
    const company = input.company;
    const skills = detectSkills(input.rawCv);
    const topSkill = skills[0] ?? 'a core technology';
    const secondSkill = skills[1] ?? 'a relevant tool';

    const base: Omit<InterviewQuestion, 'id'>[] = [
      {
        question: `Tell me about a project you're most proud of as a ${role}.`,
        category: 'behavioral',
        difficulty: 'easy',
        whatTheyLookFor: 'Ownership, impact, and clear communication of your contribution.',
        modelAnswerOutline:
          'Use STAR: situation, your specific actions, and the measurable result.',
      },
      {
        question: `Describe a time you faced conflict on a team. How did you handle it?`,
        category: 'behavioral',
        difficulty: 'medium',
        whatTheyLookFor: 'Maturity, empathy, and a constructive resolution.',
        modelAnswerOutline:
          'Set context, your approach to listening and resolving, and the outcome.',
      },
      {
        question: `How would you use ${topSkill} to solve a real problem in this role?`,
        category: 'technical',
        difficulty: 'medium',
        whatTheyLookFor: `Depth in ${topSkill} and practical, trade-off-aware thinking.`,
        modelAnswerOutline: `Explain the approach, why ${topSkill} fits, and how you'd validate the result.`,
      },
      {
        question: `Walk me through how you'd design a solution combining ${topSkill} and ${secondSkill}.`,
        category: 'technical',
        difficulty: 'hard',
        whatTheyLookFor: 'Structured thinking, trade-offs, and scalability awareness.',
        modelAnswerOutline: 'State requirements, propose an architecture, then discuss trade-offs.',
      },
      {
        question: `What does success look like in the first 90 days as a ${role}?`,
        category: 'role-specific',
        difficulty: 'medium',
        whatTheyLookFor: 'Initiative, prioritization, and understanding of the role.',
        modelAnswerOutline: 'Learn the system, ship a small win, and build relationships early.',
      },
      {
        question: `How do you prioritize when everything feels urgent?`,
        category: 'role-specific',
        difficulty: 'medium',
        whatTheyLookFor: 'A clear framework and bias toward impact.',
        modelAnswerOutline:
          'Describe a prioritization method and a concrete example of applying it.',
      },
      {
        question: company
          ? `Why do you want to work at ${company} specifically?`
          : `Why are you interested in this company?`,
        category: 'company-fit',
        difficulty: 'easy',
        whatTheyLookFor: 'Genuine motivation and alignment with the mission.',
        modelAnswerOutline: 'Connect the company mission to your values and goals.',
      },
      {
        question: `Where do you want to grow in the next two years?`,
        category: 'company-fit',
        difficulty: 'easy',
        whatTheyLookFor: 'Self-awareness and a growth mindset.',
        modelAnswerOutline: 'Name a concrete skill or scope you want, tied to this role.',
      },
    ];

    return {
      id: uid(),
      role: input.role,
      company: input.company,
      createdAt: Date.now(),
      feedback: [],
      questions: base.map((q) => ({ ...q, id: uid() })),
    } satisfies InterviewSession;
  });
}

// ---- evaluateAnswer -------------------------------------------------------

export function evaluateAnswer(input: {
  question: InterviewQuestion;
  answer: string;
  role: string;
}): Promise<InterviewAnswerFeedback> {
  return compute(() => {
    const answer = input.answer.trim();
    const words = answer.split(/\s+/).filter(Boolean).length;
    const lower = answer.toLowerCase();

    const hasStar = /\b(situation|task|action|result|so that|because|led to)\b/.test(lower);
    const hasMetric = /\d+%|\$\d|\b\d+\s*(users|customers|hours|days|weeks|people|team)/.test(
      lower,
    );
    const hasActionVerb =
      /\b(led|built|designed|launched|improved|reduced|increased|owned|drove)\b/.test(lower);

    let score = 35;
    if (words >= 40) score += 18;
    else if (words >= 20) score += 10;
    if (words >= 90) score += 8;
    if (hasStar) score += 14;
    if (hasMetric) score += 16;
    if (hasActionVerb) score += 9;
    score = Math.max(20, Math.min(97, score));

    const strengths: string[] = [];
    if (words >= 40) strengths.push('Good length with enough detail to follow.');
    if (hasMetric) strengths.push('Includes concrete numbers that prove impact.');
    if (hasActionVerb) strengths.push('Uses strong action verbs to convey ownership.');
    if (!strengths.length) strengths.push('You engaged directly with the question.');

    const improvements: string[] = [];
    if (!hasStar)
      improvements.push('Structure with STAR: Situation, Task, Action, Result for clarity.');
    if (!hasMetric)
      improvements.push('Add measurable outcomes (%, $, time saved) to quantify your impact.');
    if (words < 40) improvements.push('Expand with a specific example — aim for 60–120 words.');
    if (!hasActionVerb)
      improvements.push('Start sentences with strong verbs (led, built, improved).');
    if (improvements.length < 2)
      improvements.push(`Tie the answer back to the ${input.role} role explicitly.`);

    const suggestedAnswer = `Strong example (STAR): "In my last role (Situation), I owned ${input.question.category === 'technical' ? 'a critical technical challenge' : 'a key initiative'} (Task). I ${hasActionVerb ? answer.split(/[.!?]/)[0].trim() || 'led the effort end to end' : 'led the effort end to end, coordinated stakeholders, and shipped iteratively'} (Action). As a result, we improved the outcome by a measurable margin, e.g. 25% faster delivery or higher quality (Result)." Keep it specific, quantified, and relevant to the ${input.role} role.`;

    return {
      questionId: input.question.id,
      userAnswer: input.answer,
      score,
      strengths: strengths.slice(0, 3),
      improvements: improvements.slice(0, 4),
      suggestedAnswer,
    } satisfies InterviewAnswerFeedback;
  });
}

// ---- matchJobs ------------------------------------------------------------

export function matchJobs(input: {
  analysis: CvAnalysis;
  rawCv: string;
  targetRole: string;
}): Promise<JobMatchResult> {
  return compute(() => {
    const skills = new Set(input.analysis.currentSkills);

    const scored = ROLE_DB.map((role) => {
      const matching = role.coreSkills.filter((s) => skills.has(s));
      const ratio = matching.length / role.coreSkills.length;
      return {
        role,
        matching,
        score: Math.round(ratio * 100),
      };
    })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 5);
    const qualifiedJobs: QualifiedJob[] = top.map((r) => ({
      role: r.role.role,
      matchScore: Math.max(40, Math.min(96, r.score + 8)),
      reason: `Your skills cover ${r.matching.length}/${r.role.coreSkills.length} of the core requirements for ${r.role.role}.`,
      matchingSkills: r.matching.length ? r.matching : input.analysis.currentSkills.slice(0, 3),
      exampleTitles: [r.role.role, `Senior ${r.role.role}`, `${r.role.role} (Remote)`].slice(0, 3),
    }));

    const bestFitRole = qualifiedJobs[0]?.role ?? input.analysis.detectedRole;
    const target = input.targetRole.trim();
    const alignedWithTarget =
      !target ||
      bestFitRole.toLowerCase().includes(target.toLowerCase()) ||
      target.toLowerCase().includes(bestFitRole.toLowerCase());

    const skillsToImprove: SkillToImprove[] = input.analysis.skillGaps.slice(0, 6).map((g) => ({
      skill: g.skill,
      importance: g.importance,
      why: g.reason,
      howToLearn: `Take a focused course on ${g.skill} and apply it in a portfolio project within a few weeks.`,
    }));

    let targetGapPlan: JobMatchResult['targetGapPlan'] = null;
    if (target && !alignedWithTarget) {
      const targetRoleDef =
        ROLE_DB.find((r) => r.keywords.some((k) => target.toLowerCase().includes(k))) ??
        ROLE_DB.find((r) => target.toLowerCase().includes(r.role.toLowerCase()));
      const needed = targetRoleDef
        ? targetRoleDef.coreSkills.filter((s) => !skills.has(s))
        : ['Domain fundamentals', 'Portfolio project'];
      const readiness = targetRoleDef
        ? Math.round(
            (targetRoleDef.coreSkills.filter((s) => skills.has(s)).length /
              targetRoleDef.coreSkills.length) *
              100,
          )
        : 45;
      targetGapPlan = {
        targetRole: target,
        readiness,
        verdict: `You're currently a stronger fit for ${bestFitRole}. To reach ${target}, close the gaps below.`,
        certifications: needed.slice(0, 3).map((skill) => ({
          name: `${skill} certification or specialization`,
          provider: 'Coursera / Udemy',
          why: `Validates ${skill}, a core requirement for ${target}.`,
        })),
        skills: needed.length ? needed : ['Targeted portfolio project'],
      };
    }

    return {
      bestFitRole,
      alignedWithTarget,
      qualifiedJobs,
      skillsToImprove,
      targetGapPlan,
      createdAt: Date.now(),
    } satisfies JobMatchResult;
  });
}

// ---- rebuildCv ------------------------------------------------------------

function extractLines(text: string): string[] {
  return text
    .split(/[\n•\-–]/)
    .map((l) => l.trim())
    .filter((l) => l.length > 6 && l.length < 220);
}

export function rebuildCv(input: {
  analysis: CvAnalysis;
  rawCv: string;
  fullName: string;
  targetRole: string;
}): Promise<RebuiltCv> {
  return compute(() => {
    const headline = input.targetRole || input.analysis.detectedRole;
    const lines = extractLines(input.rawCv);
    const actionLines = lines.filter((l) =>
      /\b(led|built|designed|launched|improved|reduced|increased|managed|developed|created|owned|delivered)\b/i.test(
        l,
      ),
    );

    const experienceBullets = (actionLines.length ? actionLines : lines).slice(0, 6).map((l) => {
      const clean = l.replace(/\s+/g, ' ').trim();
      return /^[A-Z]/.test(clean) ? clean : clean.charAt(0).toUpperCase() + clean.slice(1);
    });

    const sections: RebuiltCv['sections'] = [
      {
        heading: 'Experience',
        bullets: experienceBullets.length
          ? experienceBullets
          : [
              `Delivered ${input.analysis.detectedRole} work with measurable impact.`,
              'Collaborated cross-functionally to ship product features.',
            ],
      },
      {
        heading: 'Skills',
        bullets: input.analysis.currentSkills,
      },
    ];

    // Pull education-ish lines if present.
    const eduLines = lines.filter((l) =>
      /\b(bsc|msc|b\.?s\.?|m\.?s\.?|bachelor|master|university|degree|diploma|phd)\b/i.test(l),
    );
    if (eduLines.length) sections.push({ heading: 'Education', bullets: eduLines.slice(0, 3) });

    const improvements = [
      'Added a clear, role-focused headline and professional summary.',
      'Rewrote bullets to lead with strong action verbs.',
      'Grouped scattered content into standard, ATS-friendly sections.',
      input.analysis.marketValue.factors.some((f) => f.label === 'Measurable impact')
        ? 'Preserved and surfaced your quantified achievements.'
        : 'Flagged where to add metrics to quantify impact.',
      'Consolidated and de-duplicated your skills list.',
    ];

    return {
      headline: titleCase(headline),
      summary: `${input.analysis.seniority} ${input.analysis.detectedRole} with ~${input.analysis.yearsExperience} years of experience. ${input.analysis.oneLineSummary} Strengths include ${input.analysis.topStrengths.slice(0, 2).join(' and ')}.`,
      sections,
      improvements,
      createdAt: Date.now(),
    } satisfies RebuiltCv;
  });
}

// ---- chatWithSpecialist ---------------------------------------------------

export function chatWithSpecialist(input: {
  specialist: Specialist;
  history: SpecialistChatMessage[];
  analysis: CvAnalysis | null;
  targetRole: string;
}): Promise<string> {
  return compute(() => {
    const lastUser = [...input.history].toReversed().find((m) => m.role === 'user');
    const q = (lastUser?.text ?? '').toLowerCase();
    const s = input.specialist;
    const target = input.targetRole || input.analysis?.detectedRole || 'your target role';

    const intro = `As someone who's spent years in ${s.field.toLowerCase()},`;

    if (!lastUser) {
      return `Hi, I'm ${s.name}. I focus on ${s.field.toLowerCase()} and topics like ${s.expertise.slice(0, 2).join(' and ')}. What would you like help with on the way to ${target}?`;
    }

    if (/salary|pay|money|compensation|raise|negotiat/.test(q)) {
      const mv = input.analysis?.marketValue;
      return `${intro} I'd anchor any salary conversation on data. ${mv ? `For your profile, the market range is roughly ${mv.currency} ${Math.round(mv.lowAnnual / 1000)}k–${Math.round(mv.highAnnual / 1000)}k.` : 'Research the range for your role and region first.'} Lead with your impact, ask for the top of the band, and always negotiate the whole package, not just base.`;
    }
    if (/interview|prepare|question/.test(q)) {
      return `${intro} the candidates who do best prepare 3–4 STAR stories that show measurable impact. Practice them out loud, and for ${target} make sure at least one story highlights ${input.analysis?.currentSkills[0] ?? 'your strongest skill'}. Want me to help you shape one?`;
    }
    if (/skill|learn|improve|study|gap/.test(q)) {
      const gap = input.analysis?.skillGaps[0]?.skill;
      return `${intro} I'd focus your energy, not spread it thin. ${gap ? `Right now, ${gap} is your highest-leverage gap for ${target}.` : `For ${target}, pick the one skill that unblocks the most opportunities.`} Learn it, then prove it with a small project you can point to.`;
    }
    if (/switch|change|transition|pivot|career/.test(q)) {
      return `${intro} career pivots work best when you bridge, not jump. Map which of your current skills transfer to ${target}, close the one or two critical gaps, and reframe your CV around the new direction. Small proof-of-work projects make recruiters take you seriously.`;
    }
    if (/resume|cv|application|cover letter/.test(q)) {
      return `${intro} your CV should read like a results sheet, not a job description. Every bullet: verb + what you did + the measurable outcome. Tailor the top third to ${target}, and cut anything older than ~10 years unless it's a standout.`;
    }
    return `${intro} good question. For ${target}, I'd focus on demonstrating impact and staying consistent. ${input.analysis ? `Given your background in ${input.analysis.detectedRole}, ` : ''}pick one concrete next step this week, do it well, and build momentum from there. What part feels most stuck right now?`;
  });
}
