import type {
  CvAnalysis,
  InterviewAnswerFeedback,
  InterviewQuestion,
  InterviewSession,
  JobApplication,
  Roadmap,
} from '@/lib/types';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const MODEL = 'gemini-1.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Export name retained so consuming screens need no changes; this is the Gemini client.
export class OpenAIError extends Error {}

interface ChatMessage {
  role: 'system' | 'user';
  content: string;
}

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

async function chatJson<T>(messages: ChatMessage[]): Promise<T> {
  if (!API_KEY) {
    throw new OpenAIError('Missing Gemini API key. Add EXPO_PUBLIC_GEMINI_API_KEY.');
  }

  const systemText = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n\n');
  const userText = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n');

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: systemText ? { parts: [{ text: systemText }] } : undefined,
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
        },
      }),
    });
  } catch {
    throw new OpenAIError('Network error reaching Gemini. Check your connection and try again.');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (response.status === 400 || response.status === 401 || response.status === 403)
      throw new OpenAIError('Invalid Gemini API key.');
    if (response.status === 429)
      throw new OpenAIError('Gemini rate limit reached. Try again shortly.');
    throw new OpenAIError(`Gemini request failed (${response.status}). ${text.slice(0, 120)}`);
  }

  const raw = (await response.json()) as unknown;

  let content: string | undefined;
  if (
    typeof raw === 'object' &&
    raw !== null &&
    'candidates' in raw &&
    Array.isArray(raw.candidates) &&
    raw.candidates.length > 0 &&
    typeof raw.candidates[0] === 'object' &&
    raw.candidates[0] !== null &&
    'content' in raw.candidates[0] &&
    typeof raw.candidates[0].content === 'object' &&
    raw.candidates[0].content !== null &&
    'parts' in raw.candidates[0].content &&
    Array.isArray(raw.candidates[0].content.parts) &&
    raw.candidates[0].content.parts.length > 0 &&
    typeof raw.candidates[0].content.parts[0] === 'object' &&
    raw.candidates[0].content.parts[0] !== null &&
    'text' in raw.candidates[0].content.parts[0] &&
    typeof raw.candidates[0].content.parts[0].text === 'string'
  ) {
    content = raw.candidates[0].content.parts[0].text;
  }
  if (!content) throw new OpenAIError('Gemini returned an empty response.');

  try {
    const parsed: unknown = JSON.parse(extractJson(content));
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- generic JSON deserializer; callers own the schema contract
    return parsed as T;
  } catch {
    throw new OpenAIError('Could not parse the analysis. Please try again.');
  }
}

const ANALYST_SYSTEM =
  'You are OfferLab, an expert career analyst, recruiter and salary benchmarking specialist. ' +
  'You always respond with strict, valid JSON matching the requested shape. ' +
  'Be realistic, specific and concrete. Never invent fields outside the schema.';

export async function analyzeCv(input: {
  rawText: string;
  targetRole: string;
  location: string;
}): Promise<CvAnalysis> {
  const messages: ChatMessage[] = [
    { role: 'system', content: ANALYST_SYSTEM },
    {
      role: 'user',
      content: `Analyze this CV for the target role "${input.targetRole || 'best fit role'}" in "${input.location || 'global market'}".

CV:
"""
${input.rawText.slice(0, 9000)}
"""

Return JSON exactly with this shape:
{
  "detectedRole": string,
  "seniority": string,
  "yearsExperience": number,
  "topStrengths": string[] (3-5),
  "weaknesses": string[] (2-4),
  "currentSkills": string[] (8-20 concrete skills),
  "overallScore": number (0-100 CV strength),
  "oneLineSummary": string,
  "marketValue": {
    "currency": string (ISO like USD/EUR),
    "lowAnnual": number, "midAnnual": number, "highAnnual": number (annual gross),
    "region": string, "seniority": string, "matchedRole": string,
    "summary": string,
    "factors": [{ "label": string, "impact": "positive"|"negative"|"neutral", "note": string }] (3-5)
  },
  "skillGaps": [{ "skill": string, "importance": "critical"|"high"|"medium"|"low", "currentLevel": "none"|"beginner"|"intermediate"|"advanced", "targetLevel": "none"|"beginner"|"intermediate"|"advanced", "reason": string }] (4-8)
}`,
    },
  ];
  return chatJson<CvAnalysis>(messages);
}

export async function buildRoadmap(input: {
  analysis: CvAnalysis;
  goalRole: string;
}): Promise<Roadmap> {
  const gaps = input.analysis.skillGaps.map((g) => `${g.skill} (${g.importance})`).join(', ');
  const messages: ChatMessage[] = [
    { role: 'system', content: ANALYST_SYSTEM },
    {
      role: 'user',
      content: `Create a personalized learning roadmap to become a strong "${input.goalRole}".
Current role: ${input.analysis.detectedRole}. Skill gaps: ${gaps}.
Current skills: ${input.analysis.currentSkills.join(', ')}.

Return JSON exactly:
{
  "goalRole": string,
  "totalWeeks": number,
  "steps": [{
    "title": string,
    "skill": string,
    "description": string,
    "durationWeeks": number,
    "milestone": string,
    "resources": [{ "title": string, "type": "course"|"book"|"project"|"certification"|"practice", "provider": string, "estimatedHours": number }] (1-3)
  }] (4-7 ordered steps)
}`,
    },
  ];
  const raw = await chatJson<Omit<Roadmap, 'createdAt'> & { steps: unknown[] }>(messages);
  return {
    goalRole: raw.goalRole,
    totalWeeks: raw.totalWeeks,
    createdAt: Date.now(),
    steps: (raw.steps as Roadmap['steps']).map((step) => ({
      ...step,
      id: uid(),
      done: false,
    })),
  };
}

export async function tailorApplication(input: {
  analysis: CvAnalysis;
  rawCv: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
}): Promise<JobApplication> {
  const messages: ChatMessage[] = [
    { role: 'system', content: ANALYST_SYSTEM },
    {
      role: 'user',
      content: `Tailor an application for this job using the candidate CV.
Job title: ${input.jobTitle}
Company: ${input.company}
Job description:
"""
${input.jobDescription.slice(0, 5000)}
"""
Candidate CV:
"""
${input.rawCv.slice(0, 6000)}
"""

Return JSON exactly:
{
  "matchScore": number (0-100),
  "tailoredSummary": string (professional summary tailored to this role, 2-3 sentences),
  "coverLetter": string (concise, personalized, 3 short paragraphs),
  "highlightedSkills": string[] (5-8 most relevant skills the candidate has),
  "missingForRole": string[] (2-5 requirements the candidate lacks),
  "resumeBullets": string[] (4-6 achievement bullets rewritten for this role, start with action verbs)
}`,
    },
  ];
  const raw = await chatJson<{
    matchScore: number;
    tailoredSummary: string;
    coverLetter: string;
    highlightedSkills: string[];
    missingForRole: string[];
    resumeBullets: string[];
  }>(messages);
  return {
    id: uid(),
    jobTitle: input.jobTitle,
    company: input.company,
    jobDescription: input.jobDescription,
    status: 'draft',
    createdAt: Date.now(),
    ...raw,
  };
}

export async function generateInterview(input: {
  role: string;
  company: string;
  rawCv: string;
}): Promise<InterviewSession> {
  const messages: ChatMessage[] = [
    { role: 'system', content: ANALYST_SYSTEM },
    {
      role: 'user',
      content: `Generate an interview preparation set for role "${input.role}"${
        input.company ? ` at ${input.company}` : ''
      } given this candidate background:
"""
${input.rawCv.slice(0, 5000)}
"""

Return JSON exactly:
{
  "questions": [{
    "question": string,
    "category": "behavioral"|"technical"|"role-specific"|"company-fit",
    "difficulty": "easy"|"medium"|"hard",
    "whatTheyLookFor": string,
    "modelAnswerOutline": string
  }] (6-8 questions, mix categories)
}`,
    },
  ];
  const raw = await chatJson<{ questions: Omit<InterviewQuestion, 'id'>[] }>(messages);
  return {
    id: uid(),
    role: input.role,
    company: input.company,
    createdAt: Date.now(),
    feedback: [],
    questions: raw.questions.map((q) => ({ ...q, id: uid() })),
  };
}

export async function evaluateAnswer(input: {
  question: InterviewQuestion;
  answer: string;
  role: string;
}): Promise<InterviewAnswerFeedback> {
  const messages: ChatMessage[] = [
    { role: 'system', content: ANALYST_SYSTEM },
    {
      role: 'user',
      content: `Evaluate this interview answer for role "${input.role}".
Question (${input.question.category}, ${input.question.difficulty}): ${input.question.question}
What interviewers look for: ${input.question.whatTheyLookFor}
Candidate answer:
"""
${input.answer.slice(0, 3000)}
"""

Return JSON exactly:
{
  "score": number (0-100),
  "strengths": string[] (1-3),
  "improvements": string[] (2-4 specific, actionable),
  "suggestedAnswer": string (a strong example answer, using STAR where relevant)
}`,
    },
  ];
  const raw = await chatJson<{
    score: number;
    strengths: string[];
    improvements: string[];
    suggestedAnswer: string;
  }>(messages);
  return { questionId: input.question.id, userAnswer: input.answer, ...raw };
}
