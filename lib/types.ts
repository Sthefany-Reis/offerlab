// Core domain types for OfferLab

export type SkillLevel = 'none' | 'beginner' | 'intermediate' | 'advanced';

export interface SkillGap {
  skill: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  currentLevel: SkillLevel;
  targetLevel: SkillLevel;
  reason: string;
}

export interface MarketValue {
  currency: string;
  lowAnnual: number;
  midAnnual: number;
  highAnnual: number;
  region: string;
  seniority: string;
  matchedRole: string;
  summary: string;
  factors: { label: string; impact: 'positive' | 'negative' | 'neutral'; note: string }[];
}

export interface CvAnalysis {
  detectedRole: string;
  seniority: string;
  yearsExperience: number;
  topStrengths: string[];
  weaknesses: string[];
  currentSkills: string[];
  marketValue: MarketValue;
  skillGaps: SkillGap[];
  overallScore: number; // 0-100 CV strength
  oneLineSummary: string;
}

export interface RoadmapResource {
  title: string;
  type: 'course' | 'book' | 'project' | 'certification' | 'practice';
  provider: string;
  estimatedHours: number;
}

export interface RoadmapStep {
  id: string;
  title: string;
  skill: string;
  description: string;
  durationWeeks: number;
  milestone: string;
  resources: RoadmapResource[];
  done: boolean;
}

export interface Roadmap {
  goalRole: string;
  totalWeeks: number;
  steps: RoadmapStep[];
  createdAt: number;
}

export type ApplicationStatus = 'draft' | 'applied' | 'interview' | 'offer' | 'rejected';

export interface JobApplication {
  id: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  matchScore: number; // 0-100
  tailoredSummary: string;
  coverLetter: string;
  highlightedSkills: string[];
  missingForRole: string[];
  resumeBullets: string[];
  status: ApplicationStatus;
  createdAt: number;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'behavioral' | 'technical' | 'role-specific' | 'company-fit';
  difficulty: 'easy' | 'medium' | 'hard';
  whatTheyLookFor: string;
  modelAnswerOutline: string;
}

export interface InterviewAnswerFeedback {
  questionId: string;
  userAnswer: string;
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  suggestedAnswer: string;
}

export interface InterviewSession {
  id: string;
  role: string;
  company: string;
  questions: InterviewQuestion[];
  feedback: InterviewAnswerFeedback[];
  createdAt: number;
}

export interface CvProfile {
  fullName: string;
  targetRole: string;
  location: string;
  rawText: string;
  sourceName: string; // file name or "Pasted text"
  updatedAt: number;
}
