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

// Lightweight local account (visual-only; no real auth).
export interface Account {
  name: string;
  email: string;
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

// A role the candidate already qualifies for, derived from their CV.
export interface QualifiedJob {
  role: string;
  matchScore: number; // 0-100 how well the CV fits this role
  reason: string;
  matchingSkills: string[];
  exampleTitles: string[]; // concrete job titles to search for
}

// Skills/certs the candidate should improve to be more competitive overall.
export interface SkillToImprove {
  skill: string;
  importance: 'critical' | 'high' | 'medium' | 'low';
  why: string;
  howToLearn: string;
}

// When the CV is a stronger fit for a different role than the target,
// this explains what's needed to reach the desired target role.
export interface TargetGapPlan {
  targetRole: string;
  readiness: number; // 0-100 readiness for the desired target role
  verdict: string; // one-line honest assessment
  certifications: { name: string; provider: string; why: string }[];
  skills: string[];
}

export interface JobMatchResult {
  bestFitRole: string; // role the CV is strongest for right now
  alignedWithTarget: boolean; // is bestFitRole ~ the user's target role?
  qualifiedJobs: QualifiedJob[];
  skillsToImprove: SkillToImprove[];
  targetGapPlan: TargetGapPlan | null; // present when target differs from best fit
  createdAt: number;
}

export interface RebuiltCvSection {
  heading: string;
  bullets: string[];
}

export interface RebuiltCv {
  headline: string; // e.g. "Senior Product Designer"
  summary: string;
  sections: RebuiltCvSection[]; // Experience, Skills, Education, etc.
  improvements: string[]; // what was fixed vs the original
  createdAt: number;
}

export interface Specialist {
  id: string;
  name: string;
  title: string;
  field: string;
  expertise: string[];
  bio: string;
  avatarColor: string; // tailwind bg class
  linkedinUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'specialist';
  text: string;
  createdAt: number;
}

// A snapshot of a past CV analysis, for the CV history list.
export interface CvHistoryEntry {
  id: string;
  detectedRole: string;
  seniority: string;
  targetRole: string; // empty string when none set
  overallScore: number;
  analysis: CvAnalysis;
  profile: CvProfile;
  createdAt: number;
}
