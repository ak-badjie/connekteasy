import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MapPin, Building2, Banknote, CalendarClock, Users } from "lucide-react";
import { fetchJob, fetchOpenJobs } from "@/app/lib/jobsServer";
import {
  EMPLOYMENT_LABELS,
  HOME_COUNTRY,
  formatLocation,
  isLocalJob,
  jobSummary,
  type PlainJob,
} from "@/app/lib/jobUtils";
import JobApplyPanel from "./JobApplyPanel";
import { SITE_URL as SITE } from "@/app/lib/site";

export const revalidate = 300;

/** Pre-render the current board so listings are instantly crawlable. */
export async function generateStaticParams() {
  const jobs = await fetchOpenJobs(200);
  return jobs
    .filter((j) => j.employmentType !== "internship")
    .map((j) => ({ id: j.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await fetchJob(id);
  if (!job) {
    return { title: "Job not found", robots: { index: false, follow: true } };
  }

  const where = formatLocation(job.location, 50) || HOME_COUNTRY;
  const title = `${job.title} at ${job.company} — ${where}`;
  const description = jobSummary(
    `${job.title} vacancy at ${job.company}, ${where}. ${job.description}`,
    300
  );

  return {
    title,
    description,
    keywords: [
      job.title,
      `${job.title} jobs`,
      `${job.title} ${HOME_COUNTRY}`,
      job.company,
      job.category,
      ...job.skills.slice(0, 5),
      `jobs in ${where}`,
    ],
    alternates: { canonical: `/jobs/${job.id}` },
    openGraph: {
      title: `${title} | CONNEKT`,
      description,
      url: `/jobs/${job.id}`,
      type: "article",
      publishedTime: new Date(job.createdAtMs).toISOString(),
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: job.status === "open", follow: true },
  };
}

/** Google's JobPosting schema — this is what puts a listing in Google Jobs. */
function jobPostingJsonLd(job: PlainJob) {
  const local = isLocalJob(job);
  const remote = !local;

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: job.company,
      value: job.id,
    },
    datePosted: new Date(job.createdAtMs).toISOString(),
    ...(job.deadlineMs
      ? { validThrough: new Date(job.deadlineMs).toISOString() }
      : {}),
    employmentType:
      job.employmentType === "part-time"
        ? "PART_TIME"
        : job.employmentType === "contract"
        ? "CONTRACTOR"
        : job.employmentType === "internship"
        ? "INTERN"
        : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
      sameAs: job.sourceUrl,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: local ? job.location.split(",")[0].trim() : "Banjul",
        addressCountry: "GM",
      },
    },
    ...(remote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: {
            "@type": "Country",
            name: HOME_COUNTRY,
          },
        }
      : {}),
    industry: job.category,
    skills: job.skills.join(", "),
    directApply: false,
    url: `${SITE}/jobs/${job.id}`,
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await fetchJob(id);
  if (!job) notFound();
  // Internships have their own section, with their own membership copy.
  if (job.employmentType === "internship") redirect(`/internships/${job.id}`);

  const local = isLocalJob(job);
  const posted = new Date(job.createdAtMs).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const closes = job.deadlineMs
    ? new Date(job.deadlineMs).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd(job)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: SITE },
              {
                "@type": "ListItem",
                position: 2,
                name: `Jobs in ${HOME_COUNTRY}`,
                item: `${SITE}/jobs`,
              },
              {
                "@type": "ListItem",
                position: 3,
                name: job.title,
                item: `${SITE}/jobs/${job.id}`,
              },
            ],
          }),
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <nav aria-label="Breadcrumb" className="mb-4">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={14} /> Back to jobs in {HOME_COUNTRY}
          </Link>
        </nav>

        <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6">
          <header className="mb-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-700">
                {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
              </span>
              {local && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-mustard-50 text-mustard-700">
                  In {HOME_COUNTRY}
                </span>
              )}
              {job.category && (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                  {job.category}
                </span>
              )}
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {job.title}
            </h1>
            <p className="text-base text-gray-600 inline-flex items-center gap-1.5">
              <Building2 size={15} className="text-gray-400" /> {job.company}
            </p>
          </header>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-gray-100 mb-6 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
                Location
              </dt>
              <dd className="text-gray-800 font-medium inline-flex items-center gap-1">
                <MapPin size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{formatLocation(job.location)}</span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
                Salary
              </dt>
              <dd className="text-gray-800 font-medium inline-flex items-center gap-1">
                <Banknote size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">
                  {job.salary && job.salary !== "Unspecified" ? job.salary : "Not stated"}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
                {closes ? "Closes" : "Posted"}
              </dt>
              <dd className="text-gray-800 font-medium inline-flex items-center gap-1">
                <CalendarClock size={13} className="text-gray-400 shrink-0" />
                <time dateTime={new Date(closes ? job.deadlineMs! : job.createdAtMs).toISOString()}>
                  {closes || posted}
                </time>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-gray-400 mb-0.5">
                Applicants
              </dt>
              <dd className="text-gray-800 font-medium inline-flex items-center gap-1">
                <Users size={13} className="text-gray-400 shrink-0" />
                {job.applicants || 0}
              </dd>
            </div>
          </dl>

          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
            {job.description}
          </div>

          {job.skills.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Skills</h2>
              <ul className="flex flex-wrap gap-2 list-none p-0">
                {job.skills.map((s) => (
                  <li
                    key={s}
                    className="px-3 py-1 text-xs font-medium bg-gray-50 text-gray-700 rounded-full border border-gray-200"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {job.sourceName && (
            <p className="text-xs text-gray-400 mb-6">
              Listing verified from{" "}
              <span className="font-semibold text-gray-500">{job.sourceName}</span>. Sign in
              and apply to be taken to the employer&apos;s application page.
            </p>
          )}

          <div className="pt-4 border-t border-gray-100">
            <JobApplyPanel job={job} />
          </div>
        </article>

        <p className="text-xs text-gray-400 text-center">
          Looking for something else?{" "}
          <Link href="/jobs" className="text-teal-600 font-semibold hover:underline">
            Browse all jobs in {HOME_COUNTRY}
          </Link>
        </p>
      </div>
    </div>
  );
}
