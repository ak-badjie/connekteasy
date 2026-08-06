import type { MetadataRoute } from "next";

import { SITE_URL as SITE } from "@/app/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/jobs", "/internships", "/explore", "/profile"],
        // Private and transactional areas have nothing to index.
        disallow: ["/dashboard", "/admin", "/auth/action", "/payment-callback", "/onboarding"],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
