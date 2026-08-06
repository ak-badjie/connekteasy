import type { MetadataRoute } from "next";
import { fetchJobIndex } from "@/app/lib/jobsServer";
import { SITE_URL as SITE } from "@/app/lib/site";

/** Rebuilt hourly so new vacancies reach search engines the day they land. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/jobs`, lastModified: now, changeFrequency: "hourly", priority: 0.95 },
    { url: `${SITE}/internships`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/explore`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/auth/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE}/auth/signin`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const listings = await fetchJobIndex();
  const jobRoutes: MetadataRoute.Sitemap = listings.map((job) => ({
    url:
      job.employmentType === "internship"
        ? `${SITE}/internships/${job.id}`
        : `${SITE}/jobs/${job.id}`,
    lastModified: new Date(job.updatedAtMs),
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...jobRoutes];
}
