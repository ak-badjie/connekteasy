"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { isAdmin } from "./admin";
import {
  planForRole,
  subscribeToMySubscription,
  isSubscriptionActive,
  type PlanDefinition,
} from "./subscriptions";
import type { InternshipSubscription } from "./types";

export interface Membership {
  sub: InternshipSubscription | null;
  /** The plan this user's role is expected to buy, or null if their role has none. */
  plan: PlanDefinition | null;
  /** They have paid and the period has not lapsed. */
  active: boolean;
  /** Their role has a plan at all. */
  required: boolean;
  /** Admins see everything without paying. */
  bypass: boolean;
  loading: boolean;
}

/** Live view of the signed-in user's membership. */
export function useMembership(): Membership {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [sub, setSub] = useState<InternshipSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setSub(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToMySubscription(user.uid, (s) => {
      setSub(s);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const plan = planForRole(userProfile?.role);

  return {
    sub,
    plan,
    active: isSubscriptionActive(sub),
    required: !!plan,
    bypass: isAdmin(userProfile),
    loading: loading || authLoading,
  };
}
