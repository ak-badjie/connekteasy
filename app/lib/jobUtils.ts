import type { Job, JobEmploymentType } from "./types";

/**
 * A job flattened into plain JSON so it can cross the server → client boundary
 * (Firestore Timestamps cannot). Dates become epoch milliseconds.
 */
export interface PlainJob {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  employmentType: JobEmploymentType;
  salary: string;
  category: string;
  skills: string[];
  postedBy: string;
  postedByName: string;
  postedByAvatar: string;
  status: "open" | "closed";
  applicants: number;
  createdAtMs: number;
  updatedAtMs?: number;
  sourceName?: string;
  /**
   * The listing is applied to on the source board. The URL itself is never
   * part of this object: it lives in jobLinks/{id}, which only paid members
   * can read, so it cannot leak through the server-rendered page either.
   */
  external?: boolean;
  deadlineMs?: number;
}

/** Firestore-shaped job (client SDK) → plain job. */
export function toPlainJob(job: Job): PlainJob {
  return {
    id: job.id,
    title: job.title || "",
    company: job.company || "",
    description: job.description || "",
    location: job.location || "",
    employmentType: job.employmentType,
    salary: job.salary || "",
    category: job.category || "",
    skills: job.skills || [],
    postedBy: job.postedBy || "",
    postedByName: job.postedByName || "",
    postedByAvatar: job.postedByAvatar || "",
    status: job.status,
    applicants: job.applicants || 0,
    createdAtMs: job.createdAt?.toMillis?.() ?? Date.now(),
    updatedAtMs: job.updatedAt?.toMillis?.(),
    sourceName: job.sourceName,
    external: job.external ?? !!(job.applyUrl || job.sourceUrl),
    deadlineMs: job.deadline?.toMillis?.(),
  };
}

// ─── Where the job actually is ─────────────────────────────
// The board mixes vacancies inside the country with remote roles that are
// merely open to people here, and job seekers care a lot about the difference.

export const HOME_COUNTRY = "The Gambia";

const GAMBIA_PLACES =
  /\b(gambia|banjul|serekunda|serrekunda|kanifing|bakau|bakoteh|brikama|bijilo|kotu|fajara|abuko|lamin|sukuta|farafenni|basse|soma|barra|brufut|gunjur|janjanbureh|kerewan|mansakonko|kartong|tanji|sanyang|bwiam|essau|kuntaur)\b/i;

const REMOTE_HINTS = /\b(remote|anywhere|worldwide|work from home|wfh|emea|apac|latam|global)\b/i;

/** True when the vacancy is physically in the home country. */
export function isLocalJob(job: Pick<PlainJob, "location">): boolean {
  const location = job.location || "";
  if (GAMBIA_PLACES.test(location)) {
    // "Remote — EMEA, Gambia" is remote work, not a job in the country.
    return !/^remote/i.test(location.trim());
  }
  return false;
}

/** True when the role is done remotely, wherever the worker sits. */
export function isRemoteJob(job: Pick<PlainJob, "location">): boolean {
  return REMOTE_HINTS.test(job.location || "") && !isLocalJob(job);
}

export type LocationFilter = "all" | "local" | "remote";

export function matchesLocationFilter(
  job: Pick<PlainJob, "location">,
  filter: LocationFilter
): boolean {
  if (filter === "local") return isLocalJob(job);
  if (filter === "remote") return isRemoteJob(job);
  return true;
}

// ─── Presentation ──────────────────────────────────────────

/**
 * Some boards publish eligibility as a list of every country they hire in,
 * which runs to thousands of characters. Show the useful part.
 */
export function formatLocation(location = "", maxChars = 60): string {
  const value = location.replace(/\s+/g, " ").trim();
  if (!value) return "Remote";
  if (value.length <= maxChars) return value;

  const remote = /^remote\s*[—-]\s*/i.test(value);
  const body = value.replace(/^remote\s*[—-]\s*/i, "");
  const parts = body.split(",").map((p) => p.trim()).filter(Boolean);

  // A long list that names The Gambia is really "open to us, among others".
  if (parts.length > 4 && parts.some((p) => /gambia/i.test(p))) {
    return `Remote — open to ${HOME_COUNTRY} (+${parts.length - 1} countries)`;
  }

  const kept: string[] = [];
  for (const part of parts) {
    if (kept.join(", ").length + part.length > maxChars) break;
    kept.push(part);
  }
  const rest = parts.length - kept.length;
  const head = kept.join(", ") || body.slice(0, maxChars);
  return `${remote ? "Remote — " : ""}${head}${rest > 0 ? ` +${rest} more` : ""}`;
}

/** Internships live on their own route; everything else is a job. */
export function jobHref(job: Pick<PlainJob, "id" | "employmentType">): string {
  return job.employmentType === "internship"
    ? `/internships/${job.id}`
    : `/jobs/${job.id}`;
}

export const EMPLOYMENT_LABELS: Record<JobEmploymentType, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  internship: "Internship",
  opportunity: "Opportunity",
  "pr-opportunity": "PR Opportunity",
};

export function timeAgo(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ms).toLocaleDateString("en-GB");
}

/** Short, clean summary for cards, meta descriptions and structured data. */
export function jobSummary(description: string, maxChars = 160): string {
  const flat = (description || "").replace(/\s+/g, " ").trim();
  if (flat.length <= maxChars) return flat;
  return `${flat.slice(0, maxChars).trimEnd()}…`;
}

/** How many listings a visitor sees before paging. */
export const PAGE_SIZE = 25;
