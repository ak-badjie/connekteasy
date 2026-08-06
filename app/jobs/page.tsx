import type { Metadata } from "next";
import JobBoard from "./JobBoard";
import { fetchOpenJobs } from "@/app/lib/jobsServer";
import { HOME_COUNTRY } from "@/app/lib/jobUtils";
import { SITE_URL as SITE } from "@/app/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Jobs in ${HOME_COUNTRY} — Latest Vacancies`,
  description: `Browse the latest job vacancies in ${HOME_COUNTRY}: government, NGO, UN, banking, ICT and private sector roles in Banjul, Serrekunda, Kanifing and beyond, plus remote jobs open to Gambians. Updated daily on CONNEKT.`,
  keywords: [
    "jobs in The Gambia",
    "Gambia jobs",
    "vacancies in The Gambia",
    "Banjul jobs",
    "Serrekunda jobs",
    "government jobs Gambia",
    "NGO jobs Gambia",
    "remote jobs for Gambians",
    "job vacancies Gambia 2026",
  ],
  alternates: { canonical: "/jobs" },
  openGraph: {
    title: `Jobs in ${HOME_COUNTRY} — Latest Vacancies | CONNEKT`,
    description: `Every open vacancy we can find in ${HOME_COUNTRY}, plus remote roles open to Gambians.`,
    url: "/jobs",
    type: "website",
  },
};

export default async function JobsPage() {
  const all = await fetchOpenJobs();
  const jobs = all.filter((j) => j.employmentType !== "internship");

  return (
    <>
      {/* Structured data: the board itself, so search engines understand the
          page is a list of vacancies and can surface the individual jobs. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Jobs in ${HOME_COUNTRY}`,
            description: `Open job vacancies in ${HOME_COUNTRY} and remote roles open to Gambians.`,
            url: `${SITE}/jobs`,
            about: { "@type": "Country", name: HOME_COUNTRY },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: jobs.length,
              itemListElement: jobs.slice(0, 25).map((job, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE}/jobs/${job.id}`,
                name: job.title,
              })),
            },
          }),
        }}
      />
      <JobBoard initialJobs={jobs} variant="jobs" />
    </>
  );
}
