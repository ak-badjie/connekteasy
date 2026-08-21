import type { JobEmploymentType } from "./types";
import type { PlainJob } from "./jobUtils";

/**
 * Server-side reads of the public `jobs` collection over the Firestore REST
 * API. Listings are world-readable (see firestore.rules), so the browser API
 * key is enough — no credentials to keep, and no client SDK on the server.
 *
 * This is what makes job pages crawlable: the HTML search engines receive
 * already contains the listing, instead of an empty shell that fetches later.
 */
const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "connekt-13630";
const API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  "AIzaSyDUgt3F7NaAn4e_L-8uu2U_a7WdFuqDaqs";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** Listings change slowly; a short cache keeps the boards fast. */
const REVALIDATE_SECONDS = 300;

type RestValue = Record<string, unknown>;

function plain(value: RestValue | undefined): unknown {
  if (!value) return undefined;
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return Date.parse(String(value.timestampValue));
  if ("arrayValue" in value) {
    const arr = (value.arrayValue as { values?: RestValue[] })?.values || [];
    return arr.map((v) => plain(v));
  }
  if ("nullValue" in value) return null;
  return undefined;
}

function toJob(doc: { name?: string; fields?: Record<string, RestValue> }): PlainJob | null {
  const fields = doc.fields;
  if (!fields || !doc.name) return null;
  const id = doc.name.split("/").pop() as string;
  const str = (k: string) => (plain(fields[k]) as string) || "";
  const num = (k: string) => (plain(fields[k]) as number) || 0;

  return {
    id,
    title: str("title"),
    company: str("company"),
    description: str("description"),
    location: str("location"),
    employmentType: (str("employmentType") || "full-time") as JobEmploymentType,
    salary: str("salary"),
    category: str("category"),
    skills: ((plain(fields.skills) as string[]) || []).filter(Boolean),
    postedBy: str("postedBy"),
    postedByName: str("postedByName"),
    postedByAvatar: str("postedByAvatar"),
    status: (str("status") || "open") as "open" | "closed",
    applicants: num("applicants"),
    createdAtMs: num("createdAt") || Date.now(),
    updatedAtMs: num("updatedAt") || undefined,
    sourceName: str("sourceName") || undefined,
    external:
      (plain(fields.external) as boolean) ??
      !!(str("applyUrl") || str("sourceUrl")),
    deadlineMs: num("deadline") || undefined,
  };
}

/**
 * Every open listing, newest first. `limit` caps the request; the boards page
 * through the result client-side so filters stay instant.
 */
export async function fetchOpenJobs(limit = 500): Promise<PlainJob[]> {
  try {
    const res = await fetch(`${BASE}:runQuery?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: "jobs" }],
          where: {
            fieldFilter: {
              field: { fieldPath: "status" },
              op: "EQUAL",
              value: { stringValue: "open" },
            },
          },
          orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
          limit,
        },
      }),
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return [];
    const rows = (await res.json()) as { document?: Parameters<typeof toJob>[0] }[];
    return rows
      .map((r) => (r.document ? toJob(r.document) : null))
      .filter((j): j is PlainJob => !!j);
  } catch {
    return [];
  }
}

/** A single listing, or null when it no longer exists. */
export async function fetchJob(id: string): Promise<PlainJob | null> {
  try {
    const res = await fetch(`${BASE}/jobs/${encodeURIComponent(id)}?key=${API_KEY}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    return toJob(await res.json());
  } catch {
    return null;
  }
}

/** Ids + last-modified for the sitemap. */
export async function fetchJobIndex(): Promise<
  { id: string; employmentType: JobEmploymentType; updatedAtMs: number }[]
> {
  const jobs = await fetchOpenJobs(1000);
  return jobs.map((j) => ({
    id: j.id,
    employmentType: j.employmentType,
    updatedAtMs: j.updatedAtMs || j.createdAtMs,
  }));
}
