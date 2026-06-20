// Free, key-less job search via the Arbeitnow public job board API.
// Docs: https://www.arbeitnow.com/api/job-board-api  (CORS-enabled, works on web + native)

const API_URL = 'https://www.arbeitnow.com/api/job-board-api';

export type WorkType = 'any' | 'remote' | 'hybrid' | 'onsite';

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  workType: Exclude<WorkType, 'any'>;
  tags: string[];
  jobTypes: string[];
  description: string; // plain text, stripped of HTML
  url: string;
  createdAt: number; // epoch ms
}

export class JobSearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobSearchError';
  }
}

interface RawJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  location?: string;
  tags?: string[];
  job_types?: string[];
  url?: string;
  created_at?: number;
}

function stripHtml(html: string): string {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/\s*(p|div|li|h[1-6])\s*>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function deriveWorkType(raw: RawJob): Exclude<WorkType, 'any'> {
  if (raw.remote) return 'remote';
  const haystack = `${raw.title ?? ''} ${(raw.tags ?? []).join(' ')} ${(raw.job_types ?? []).join(
    ' ',
  )}`.toLowerCase();
  if (haystack.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

function mapJob(raw: RawJob, index: number): JobListing {
  return {
    id: raw.slug || `${raw.company_name ?? 'job'}-${index}`,
    title: (raw.title ?? '').trim() || 'Untitled role',
    company: (raw.company_name ?? '').trim() || 'Unknown company',
    location: (raw.location ?? '').trim(),
    remote: Boolean(raw.remote),
    workType: deriveWorkType(raw),
    tags: Array.isArray(raw.tags) ? raw.tags.filter(Boolean).slice(0, 8) : [],
    jobTypes: Array.isArray(raw.job_types) ? raw.job_types.filter(Boolean) : [],
    description: stripHtml(raw.description ?? ''),
    url: (raw.url ?? '').trim(),
    createdAt: typeof raw.created_at === 'number' ? raw.created_at * 1000 : Date.now(),
  };
}

interface SearchParams {
  query?: string;
  location?: string;
  workType?: WorkType;
  signal?: AbortSignal;
}

function matches(job: JobListing, query: string, location: string): boolean {
  if (query) {
    const haystack = `${job.title} ${job.company} ${job.tags.join(' ')}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (location) {
    if (!job.location.toLowerCase().includes(location)) return false;
  }
  return true;
}

export async function searchJobs(params: SearchParams = {}): Promise<JobListing[]> {
  const { query = '', location = '', workType = 'any', signal } = params;

  let res: Response;
  try {
    res = await fetch(API_URL, {
      headers: { Accept: 'application/json' },
      signal,
    });
  } catch {
    throw new JobSearchError('Could not reach the job board. Check your connection and try again.');
  }

  if (!res.ok) {
    throw new JobSearchError(`Job board returned an error (${res.status}). Try again shortly.`);
  }

  let payload: { data?: RawJob[] };
  try {
    const raw: unknown = await res.json();
    payload =
      raw !== null && typeof raw === 'object' && !Array.isArray(raw)
        ? (raw as { data?: RawJob[] })
        : {};
  } catch {
    throw new JobSearchError('Received an unexpected response from the job board.');
  }

  const all = Array.isArray(payload.data) ? payload.data.map(mapJob) : [];
  const q = query.trim().toLowerCase();
  const loc = location.trim().toLowerCase();

  return all
    .filter((job) => (workType === 'any' ? true : job.workType === workType))
    .filter((job) => matches(job, q, loc))
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Build a LinkedIn jobs search URL for a given role + company. */
export function linkedinJobUrl(title: string, company?: string): string {
  const keywords = [title, company].filter(Boolean).join(' ');
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keywords)}`;
}

/** Build an Indeed jobs search URL for a given role + company. */
export function indeedJobUrl(title: string, company?: string): string {
  const keywords = [title, company].filter(Boolean).join(' ');
  return `https://www.indeed.com/jobs?q=${encodeURIComponent(keywords)}`;
}
