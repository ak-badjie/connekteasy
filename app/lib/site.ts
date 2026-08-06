/**
 * Canonical, public origin of the site.
 *
 * Deliberately separate from NEXT_PUBLIC_APP_URL, which points at localhost in
 * development — canonical tags, sitemaps and structured data must always carry
 * the production address or search engines index the wrong host.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://connekt.gm"
).replace(/\/$/, "");

export const SITE_NAME = "CONNEKT";
