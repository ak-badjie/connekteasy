import type { Metadata } from "next";
import { Inter, Poppins, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./lib/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

import { SITE_URL } from "./lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "CONNEKT — Jobs in The Gambia | The Gambia's Job Search",
    // Every page reads as a Gambian job search result in the SERP.
    template: "%s | CONNEKT — Jobs in The Gambia",
  },
  description:
    "CONNEKT is The Gambia's job search: browse the latest vacancies in Banjul, Serrekunda, Kanifing and across the country — government, NGO, UN, banking, ICT and private sector — plus internships, freelance projects and remote jobs open to Gambians.",
  applicationName: "CONNEKT",
  keywords: [
    "jobs in The Gambia",
    "Gambia jobs",
    "Gambia job search",
    "vacancies in The Gambia",
    "Banjul jobs",
    "Serrekunda jobs",
    "Gambia government jobs",
    "NGO jobs Gambia",
    "UN jobs Gambia",
    "internships in The Gambia",
    "remote jobs for Gambians",
    "virtual assistants Gambia",
  ],
  authors: [{ name: "CONNEKT" }],
  creator: "CONNEKT",
  publisher: "CONNEKT",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_GM",
    url: SITE_URL,
    siteName: "CONNEKT",
    title: "CONNEKT — Jobs in The Gambia",
    description:
      "The Gambia's job search. Browse the latest jobs, internships and remote roles open to Gambians, and apply in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CONNEKT — Jobs in The Gambia",
    description:
      "The Gambia's job search. Jobs, internships and remote roles open to Gambians.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  category: "Employment",
  icons: {
    icon: "/connekt-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} font-sans antialiased overflow-x-hidden flex flex-col min-h-screen`} suppressHydrationWarning>
        {/* Organisation + site search, so the brand and the job search show up
            as one entity to crawlers. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": `${SITE_URL}/#organization`,
                  name: "CONNEKT",
                  url: SITE_URL,
                  description:
                    "The Gambia's job search — jobs, internships and remote roles open to Gambians.",
                  areaServed: { "@type": "Country", name: "The Gambia" },
                },
                {
                  "@type": "WebSite",
                  "@id": `${SITE_URL}/#website`,
                  url: SITE_URL,
                  name: "CONNEKT — Jobs in The Gambia",
                  publisher: { "@id": `${SITE_URL}/#organization` },
                  inLanguage: "en-GM",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: `${SITE_URL}/explore?mode=jobs&q={search_term_string}`,
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <AuthProvider>
          <ScrollToTop />
          <Navbar />
          <main className="flex-1 flex flex-col min-h-0">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
