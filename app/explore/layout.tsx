import type { Metadata } from "next";
import { HOME_COUNTRY } from "@/app/lib/jobUtils";

export const metadata: Metadata = {
  title: `Explore Jobs, Projects & Talent in ${HOME_COUNTRY}`,
  description: `Search every open vacancy in ${HOME_COUNTRY}, freelance projects from local businesses, and verified virtual assistants — all in one place on CONNEKT.`,
  keywords: [
    `jobs in ${HOME_COUNTRY}`,
    "freelance projects Gambia",
    "hire virtual assistant Gambia",
    "Gambia talent search",
  ],
  alternates: { canonical: "/explore" },
  openGraph: {
    title: `Explore Jobs, Projects & Talent in ${HOME_COUNTRY} | CONNEKT`,
    description: `Search open vacancies, freelance projects and virtual assistants across ${HOME_COUNTRY}.`,
    url: "/explore",
    type: "website",
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
