/**
 * Canonical, public origin of the site.
 *
 * Deliberately separate from NEXT_PUBLIC_APP_URL, which points at localhost in
 * development — canonical tags, sitemaps and structured data must always carry
 * the production address or search engines index the wrong host.
 */
// The app is served from www.connekt.africa; connekt.gm currently hosts a
// separate marketing site. Pointing canonicals at a host that does not serve
// this content would keep the listings out of the index — so if the app moves
// to connekt.gm, set NEXT_PUBLIC_SITE_URL in Vercel and nothing else changes.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.connekt.africa"
).replace(/\/$/, "");

export const SITE_NAME = "CONNEKT";
