import type { UserProfile } from "./types";

// Admins are identified by an explicit profile flag OR an email allowlist set
// via NEXT_PUBLIC_ADMIN_EMAILS (comma-separated) in the environment.
const ENV_ADMINS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.isAdmin) return true;
  return !!profile.email && ENV_ADMINS.includes(profile.email.toLowerCase());
}
