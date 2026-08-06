import type { Metadata } from "next";
import InternshipBoard from "./InternshipBoard";
import { fetchOpenJobs } from "@/app/lib/jobsServer";
import { HOME_COUNTRY } from "@/app/lib/jobUtils";
import { SITE_URL as SITE } from "@/app/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  title: `Internships in ${HOME_COUNTRY} — Student & Graduate Openings`,
  description: `Find internships in ${HOME_COUNTRY}: NGO, UN, government and private sector placements for students and graduates in Banjul, Serrekunda and across the country, plus remote programmes open to Gambians.`,
  keywords: [
    "internships in The Gambia",
    "Gambia internship",
    "student placement Gambia",
    "graduate programme Gambia",
    "UTG internship",
    "NGO internship Banjul",
  ],
  alternates: { canonical: "/internships" },
  openGraph: {
    title: `Internships in ${HOME_COUNTRY} | CONNEKT`,
    description: `Curated internship opportunities across ${HOME_COUNTRY} for students and graduates.`,
    url: "/internships",
    type: "website",
  },
};

export default async function InternshipsPage() {
  const all = await fetchOpenJobs();
  const internships = all.filter((j) => j.employmentType === "internship");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Internships in ${HOME_COUNTRY}`,
            description: `Internship opportunities in ${HOME_COUNTRY} for students and graduates.`,
            url: `${SITE}/internships`,
            about: { "@type": "Country", name: HOME_COUNTRY },
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: internships.length,
              itemListElement: internships.slice(0, 25).map((job, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${SITE}/internships/${job.id}`,
                name: job.title,
              })),
            },
          }),
        }}
      />
      <InternshipBoard initialInternships={internships} />
    </>
  );
}
