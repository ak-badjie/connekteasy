import { doc, getDoc, onSnapshot, updateDoc, serverTimestamp, type Unsubscribe } from "firebase/firestore";
import { db } from "./firebase";
import type { InternshipSubscription, MembershipPlan, UserRole } from "./types";

export const MEMBERSHIP_PERIOD_LABEL = "30 days";

// ─── Plans ─────────────────────────────────────────────────
// One subscription document per user. The plan records what they bought;
// the role decides which gated area that unlocks.
export interface PlanDefinition {
  plan: MembershipPlan;
  /** Payment type sent to Modem Pay. The webhook keys off the `_subscription` suffix. */
  paymentType: string;
  priceGMD: number;
  name: string;
  tagline: string;
  benefits: string[];
}

export const SEEKER_PLAN: PlanDefinition = {
  plan: "job",
  paymentType: "job_subscription",
  priceGMD: 200,
  name: "Seeker Membership",
  tagline: "Open and apply to every job, internship and opportunity on CONNEKT.",
  benefits: [
    "Open full job, internship and opportunity listings",
    "Apply with one click using your profile",
    "Message employers directly",
    "CV tools and AI career coaching",
    "Save jobs and track your applications",
  ],
};

export const EMPLOYER_PLAN: PlanDefinition = {
  plan: "employer",
  paymentType: "employer_subscription",
  priceGMD: 1000,
  name: "Employer Pro",
  tagline: "Post roles and reach the right candidates.",
  benefits: [
    "Post unlimited jobs and internships",
    "Talent Search — browse and contact candidates",
    "Full applicant profiles and CV downloads",
    "Schedule interviews and send assessments",
    "Hiring analytics for your listings",
  ],
};

/** The plan a given role can buy, or null if the role has no membership. */
export function planForRole(role?: UserRole | null): PlanDefinition | null {
  switch (role) {
    case "student":
    case "job_seeker":
      return SEEKER_PLAN;
    case "client":
      return EMPLOYER_PLAN;
    case "va":
      // Freelancers earn through escrow, so their own tools are never gated —
      // but they could always subscribe to apply to jobs, and still can.
      return SEEKER_PLAN;
    default:
      return null;
  }
}

// Kept for the pages that reference the seeker price directly.
export const INTERNSHIP_PRICE_GMD = SEEKER_PLAN.priceGMD;
export const JOB_MEMBERSHIP_PRICE_GMD = SEEKER_PLAN.priceGMD;
export const INTERNSHIP_PERIOD_LABEL = MEMBERSHIP_PERIOD_LABEL;

// ─── Reads ─────────────────────────────────────────────────
export async function getMySubscription(
  uid: string
): Promise<InternshipSubscription | null> {
  const snap = await getDoc(doc(db, "subscriptions", uid));
  return snap.exists() ? (snap.data() as InternshipSubscription) : null;
}

export function subscribeToMySubscription(
  uid: string,
  callback: (sub: InternshipSubscription | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "subscriptions", uid), (snap) => {
    callback(snap.exists() ? (snap.data() as InternshipSubscription) : null);
  });
}

export function isSubscriptionActive(
  sub: InternshipSubscription | null
): boolean {
  if (!sub) return false;
  if (sub.status === "expired") return false;
  // A cancelled membership keeps access until the paid period ends.
  const endMs = sub.currentPeriodEnd?.toMillis?.() ?? 0;
  return endMs > Date.now();
}

// Cancel: stop renewals. Access continues until the current period ends.
export async function cancelSubscription(uid: string): Promise<void> {
  await updateDoc(doc(db, "subscriptions", uid), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });
}

// Older names kept so existing imports keep compiling.
export const getMyInternshipSubscription = getMySubscription;
export const subscribeToMyInternshipSubscription = subscribeToMySubscription;
export const isInternshipSubscriptionActive = isSubscriptionActive;
