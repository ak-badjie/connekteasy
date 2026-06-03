"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthContext";
import { caps, homeRouteForRole, type RoleCapabilities } from "./roles";
import type { UserRole } from "./types";

/**
 * Guards a dashboard page behind a capability predicate. Any signed-in user
 * whose role fails the predicate is bounced to their role's home route.
 *
 *   const { allowed, checking } = useRoleGuard((c) => c.postProject);
 *   if (checking) return <Spinner/>;
 *   if (!allowed) return null;  // redirect already in flight
 */
export function useRoleGuard(
  allow: (capabilities: RoleCapabilities, role: UserRole | null | undefined) => boolean
) {
  const { userProfile, loading } = useAuth();
  const router = useRouter();
  const role = userProfile?.role;
  const ok = allow(caps(role), role);

  useEffect(() => {
    if (loading) return;
    if (userProfile && !ok) {
      router.replace(homeRouteForRole(role));
    }
  }, [loading, userProfile, ok, role, router]);

  return {
    allowed: !!userProfile && ok,
    checking: loading || !userProfile,
  };
}
