import type { UserProfile } from "./types";

/**
 * Two tiers of staff access:
 *
 *   admin        — the /admin console: reviews, content, jobs, users.
 *   super admin  — all of the above, plus granting and revoking admin.
 *
 * Super admins are identified by email, not by a flag a user could write to
 * their own profile. The list is mirrored server-side in functions/src/staff.ts
 * and in firestore.rules, so nothing here is load-bearing for security — it
 * only decides what the UI offers.
 */
const SUPER_ADMIN_EMAILS = [
  "admin@connekt.gm",
  ...(process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
];

// Ordinary admins can also be added by email via NEXT_PUBLIC_ADMIN_EMAILS.
const ENV_ADMINS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function emailOf(profile?: UserProfile | null): string {
  return (profile?.email || "").trim().toLowerCase();
}

export function isSuperAdmin(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.isSuperAdmin) return true;
  const email = emailOf(profile);
  return !!email && SUPER_ADMIN_EMAILS.includes(email);
}

export function isAdmin(profile?: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.isAdmin) return true;
  if (isSuperAdmin(profile)) return true;
  const email = emailOf(profile);
  return !!email && ENV_ADMINS.includes(email);
}

/** Label for the badge shown next to a staff member's name. */
export function staffLabel(profile?: UserProfile | null): string | null {
  if (isSuperAdmin(profile)) return "Super Admin";
  if (isAdmin(profile)) return "Admin";
  return null;
}
