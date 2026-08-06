import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "./firebase";
import { isAdmin } from "./admin";
import type { UploadedFile, UserProfile, VaVerificationStatus } from "./types";

/** A freelancer must submit at least this many accreditation documents. */
export const VA_MIN_DOCUMENTS = 1;

export const VA_STATUS_LABELS: Record<VaVerificationStatus, string> = {
  not_submitted: "Not submitted",
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Changes requested",
};

/** Current review state of a freelancer's accreditation. */
export function vaVerificationStatus(
  profile?: UserProfile | null
): VaVerificationStatus {
  if (!profile) return "not_submitted";
  if (profile.vaVerificationStatus) return profile.vaVerificationStatus;
  // Accounts created before review existed: documents on file count as pending.
  return profile.vaCertificates?.length ? "pending" : "not_submitted";
}

/**
 * True while this freelancer still has to be cleared by an admin. Admins never
 * lock themselves out, and no other role is affected.
 */
export function vaAwaitingApproval(profile?: UserProfile | null): boolean {
  if (!profile || profile.role !== "va") return false;
  if (isAdmin(profile)) return false;
  return vaVerificationStatus(profile) !== "approved";
}

/**
 * Send accreditation documents for review. Puts the account into `pending`;
 * only an admin can move it on from there.
 */
export async function submitVaVerification(
  uid: string,
  documents: { name: string; url: string; description?: string }[]
): Promise<void> {
  const now = Timestamp.now();
  const files: UploadedFile[] = documents.map((d) => ({
    name: d.name,
    url: d.url,
    uploadedAt: now,
    description: d.description || "",
  }));

  await updateDoc(doc(db, "users", uid), {
    vaCertificates: files,
    vaVerificationStatus: "pending" as VaVerificationStatus,
    vaVerificationSubmittedAt: serverTimestamp(),
    vaVerificationNote: "",
    updatedAt: serverTimestamp(),
  });
}

// ─── Admin ─────────────────────────────────────────────────

export interface ReviewVaInput {
  uid: string;
  status: "approved" | "rejected";
  note?: string;
}

/**
 * Approve or reject a freelancer. Runs server-side so the reviewer identity
 * and timestamps can't be spoofed from the browser.
 */
export async function reviewVaVerification(input: ReviewVaInput): Promise<void> {
  const callable = httpsCallable<ReviewVaInput, { success: boolean }>(
    functions,
    "reviewVaVerification"
  );
  await callable(input);
}

/** Every freelancer account, newest submission first, for the review queue. */
export async function getVaVerificationQueue(): Promise<UserProfile[]> {
  const snap = await getDocs(
    query(collection(db, "users"), where("role", "==", "va"))
  );
  const rows = snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile));
  return rows.sort(
    (a, b) =>
      (b.vaVerificationSubmittedAt?.toMillis?.() ?? 0) -
      (a.vaVerificationSubmittedAt?.toMillis?.() ?? 0)
  );
}
