import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

/**
 * Where an imported listing is actually applied to.
 *
 * The link is deliberately not part of the job document the board renders:
 * "subscribe to apply" has to hold against someone reading the page source or
 * querying Firestore directly, not just against the button being hidden. It is
 * fetched here, one call, at the moment a paid member presses Apply.
 */
export interface JobApplyLink {
  applyUrl: string;
  sourceUrl: string;
  sourceName: string;
}

export class ApplyLinkError extends Error {
  /** "membership" when the caller simply has not paid, "other" otherwise. */
  readonly reason: "membership" | "missing" | "auth" | "other";

  constructor(message: string, reason: ApplyLinkError["reason"]) {
    super(message);
    this.name = "ApplyLinkError";
    this.reason = reason;
  }
}

const call = httpsCallable<{ jobId: string }, JobApplyLink>(
  functions,
  "getJobApplyLink"
);

export async function getJobApplyLink(jobId: string): Promise<JobApplyLink> {
  try {
    const res = await call({ jobId });
    const data = res.data;
    if (!data?.applyUrl) {
      throw new ApplyLinkError("This listing has no application link.", "missing");
    }
    return data;
  } catch (err: unknown) {
    if (err instanceof ApplyLinkError) throw err;
    const code = (err as { code?: string })?.code || "";
    const message =
      (err as { message?: string })?.message || "Could not open the application page.";
    if (code.includes("permission-denied")) {
      throw new ApplyLinkError(message, "membership");
    }
    if (code.includes("unauthenticated")) {
      throw new ApplyLinkError(message, "auth");
    }
    if (code.includes("not-found")) {
      throw new ApplyLinkError(message, "missing");
    }
    throw new ApplyLinkError(message, "other");
  }
}
