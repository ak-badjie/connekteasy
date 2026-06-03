import { doc, getDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";
import type { InternshipSubscription } from "./types";

export const INTERNSHIP_PRICE_GMD = 200;
export const INTERNSHIP_PERIOD_LABEL = "30 days";

export async function getMyInternshipSubscription(
  uid: string
): Promise<InternshipSubscription | null> {
  const snap = await getDoc(doc(db, "subscriptions", uid));
  return snap.exists() ? (snap.data() as InternshipSubscription) : null;
}

export function subscribeToMyInternshipSubscription(
  uid: string,
  callback: (sub: InternshipSubscription | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "subscriptions", uid), (snap) => {
    callback(snap.exists() ? (snap.data() as InternshipSubscription) : null);
  });
}

export function isInternshipSubscriptionActive(
  sub: InternshipSubscription | null
): boolean {
  if (!sub) return false;
  if (sub.status !== "active") return false;
  const endMs = sub.currentPeriodEnd?.toMillis?.() ?? 0;
  return endMs > Date.now();
}

// ─── Job membership (same mechanism, plan-agnostic) ────────
export const JOB_MEMBERSHIP_PRICE_GMD = 200;
export const MEMBERSHIP_PERIOD_LABEL = "30 days";

// An active subscription unlocks the user's gated area regardless of plan,
// since roles already scope which area each user can reach.
export const getMySubscription = getMyInternshipSubscription;
export const subscribeToMySubscription = subscribeToMyInternshipSubscription;
export const isSubscriptionActive = isInternshipSubscriptionActive;
