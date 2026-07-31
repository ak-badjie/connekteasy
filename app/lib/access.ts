import type { UserRole } from "./types";
import { planForRole } from "./subscriptions";

/**
 * Which dashboard routes a role can reach WITHOUT an active membership.
 * Everything else under /dashboard is gated by default, so a new page ships
 * locked unless it is deliberately listed here.
 */
interface FreeRoutes {
  /** Reachable on their own, but not their children. */
  exact: string[];
  /** Reachable along with everything nested beneath them. */
  prefix: string[];
}

// Account, billing and the browse lists stay open. Opening a listing,
// applying, messaging and the AI/CV tools are what the membership buys.
const SEEKER_FREE: FreeRoutes = {
  exact: ["/dashboard", "/dashboard/jobs", "/dashboard/internships"],
  prefix: ["/dashboard/profile", "/dashboard/settings", "/dashboard/membership"],
};

// Employers can set up their company and see what they already posted.
// Posting, applicants, talent search and hiring tools need Employer Pro.
const EMPLOYER_FREE: FreeRoutes = {
  exact: ["/dashboard"],
  prefix: [
    "/dashboard/profile",
    "/dashboard/settings",
    "/dashboard/membership",
    "/dashboard/jobs/my-jobs",
  ],
};

const FREE_BY_ROLE: Record<UserRole, FreeRoutes> = {
  student: SEEKER_FREE,
  job_seeker: SEEKER_FREE,
  client: EMPLOYER_FREE,
  // Freelancers pay through escrow fees, so nothing is membership-gated.
  va: { exact: [], prefix: ["/dashboard"] },
};

/**
 * Whether any part of this role's dashboard is membership-gated. Freelancers
 * may still subscribe in order to apply to jobs, but nothing of theirs is
 * locked, so they shouldn't be nagged to upgrade.
 */
export function roleHasGatedRoutes(role: UserRole | null | undefined): boolean {
  return role === "student" || role === "job_seeker" || role === "client";
}

/**
 * True when this route needs an active membership for this role.
 */
export function routeNeedsMembership(
  role: UserRole | null | undefined,
  pathname: string
): boolean {
  if (!role || !planForRole(role) || !roleHasGatedRoutes(role)) return false;
  if (!pathname.startsWith("/dashboard")) return false;

  const free = FREE_BY_ROLE[role];
  if (free.exact.includes(pathname)) return false;
  if (free.prefix.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }
  return true;
}
