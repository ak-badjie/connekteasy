"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { hasAppliedToJob, createJobApplication } from "@/app/lib/firestore";
import {
  subscribeToMySubscription,
  isSubscriptionActive,
  JOB_MEMBERSHIP_PRICE_GMD,
  MEMBERSHIP_PERIOD_LABEL,
} from "@/app/lib/subscriptions";
import SaveJobButton from "@/app/components/SaveJobButton";
import { getJobApplyLink, ApplyLinkError } from "@/app/lib/jobLinks";
import type { PlainJob } from "@/app/lib/jobUtils";
import type { InternshipSubscription } from "@/app/lib/types";
import {
  CheckCircle,
  X,
  LogIn,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

/**
 * Everything interactive on a listing page: saving, and the apply chain.
 *
 * Listings we imported from another board are applied to on that board — but
 * only after the candidate has signed in and their membership is active. The
 * source link never reaches the browser before that point: it is not in the
 * job document, not in the page source, and not readable from Firestore
 * without a live subscription. Pressing Apply asks the server for it, records
 * the application on CONNEKT, and then hands the candidate over.
 */
export default function JobApplyPanel({
  job,
  variant = "job",
}: {
  job: PlainJob;
  variant?: "job" | "internship";
}) {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();

  const [hasApplied, setHasApplied] = useState(false);
  const [sub, setSub] = useState<InternshipSubscription | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  // Only ever populated after the server has checked the membership.
  const [externalUrl, setExternalUrl] = useState("");

  const hasMembership = isSubscriptionActive(sub);
  const isExternal = !!job.external;
  const path = variant === "internship" ? `/internships/${job.id}` : `/jobs/${job.id}`;
  const noun = variant === "internship" ? "internship" : "job";

  useEffect(() => {
    if (user?.uid) hasAppliedToJob(job.id, user.uid).then(setHasApplied);
  }, [job.id, user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setSub(null);
      return;
    }
    return subscribeToMySubscription(user.uid, setSub);
  }, [user?.uid]);

  const goSignInThenReturn = () => {
    router.push(`/auth/signin?redirect=${encodeURIComponent(path)}`);
  };

  /**
   * Imported listing: ask the server for the destination (it re-checks the
   * membership), log the application on CONNEKT, then hand over.
   */
  const handleExternalApply = async () => {
    setApplyLoading(true);
    setApplyError(null);
    try {
      const link = await getJobApplyLink(job.id);
      setExternalUrl(link.applyUrl);

      if (user && userProfile && !hasApplied) {
        await createJobApplication({
          jobId: job.id,
          jobTitle: job.title,
          applicantId: user.uid,
          applicantName:
            userProfile.displayName ||
            `${userProfile.firstName} ${userProfile.lastName}`.trim(),
          applicantEmail: userProfile.email,
          applicantAvatar: `${(userProfile.firstName || "")[0] || ""}${
            (userProfile.lastName || "")[0] || ""
          }`.toUpperCase(),
          phone: "",
          coverLetter: `Applied via ${job.sourceName || "the employer's site"} — the candidate was handed over to the original posting.`,
        }).catch(() => null);
        setHasApplied(true);
      }

      window.open(link.applyUrl, "_blank", "noopener,noreferrer");
      setHandoffOpen(true);
    } catch (err) {
      setApplyError(
        err instanceof ApplyLinkError
          ? err.message
          : "Could not open the application page. Please try again."
      );
    } finally {
      setApplyLoading(false);
    }
  };

  /** Re-open the original posting for someone who already applied. */
  const handleReopen = async () => {
    setApplyLoading(true);
    setApplyError(null);
    try {
      const link = await getJobApplyLink(job.id);
      setExternalUrl(link.applyUrl);
      window.open(link.applyUrl, "_blank", "noopener,noreferrer");
      setHandoffOpen(true);
    } catch (err) {
      setApplyError(
        err instanceof ApplyLinkError
          ? err.message
          : "Could not open the application page. Please try again."
      );
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user || !userProfile) return;
    if (!hasMembership) {
      setApplyError("An active membership is required to apply.");
      return;
    }
    if (!coverLetter.trim()) {
      setApplyError("Please write a brief cover letter.");
      return;
    }
    setApplyLoading(true);
    setApplyError(null);
    try {
      await createJobApplication({
        jobId: job.id,
        jobTitle: job.title,
        applicantId: user.uid,
        applicantName:
          userProfile.displayName ||
          `${userProfile.firstName} ${userProfile.lastName}`.trim(),
        applicantEmail: userProfile.email,
        applicantAvatar: `${(userProfile.firstName || "")[0] || ""}${
          (userProfile.lastName || "")[0] || ""
        }`.toUpperCase(),
        phone: phone.trim(),
        coverLetter: coverLetter.trim(),
      });
      setHasApplied(true);
      setApplyOpen(false);
      setSuccessOpen(true);
      setCoverLetter("");
      setPhone("");
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setApplyLoading(false);
    }
  };

  const isOwner = user?.uid === job.postedBy;

  const action = () => {
    // Employers manage their own internship pipeline rather than apply.
    if (variant === "internship" && userProfile?.role === "client" && !isOwner) {
      return (
        <Link
          href="/dashboard/manage-internships"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
        >
          <ShieldCheck size={16} /> Manage your internship postings
        </Link>
      );
    }
    if (isOwner) {
      return (
        <Link
          href="/dashboard/jobs/my-jobs"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
        >
          You posted this {noun} — View applicants
        </Link>
      );
    }
    if (hasApplied) {
      return (
        <div className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle size={16} /> You&apos;ve already applied
          {isExternal && hasMembership && (
            <button
              onClick={handleReopen}
              disabled={applyLoading}
              className="underline underline-offset-2 hover:text-emerald-800 disabled:opacity-60"
            >
              {applyLoading ? "Opening…" : "Open the posting again"}
            </button>
          )}
        </div>
      );
    }
    if (job.status === "closed") {
      return (
        <div className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
          This {noun} is closed
        </div>
      );
    }
    if (authLoading) {
      return (
        <button
          disabled
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600/60 rounded-xl"
        >
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading…
        </button>
      );
    }
    if (!user) {
      return (
        <button
          onClick={goSignInThenReturn}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
        >
          <LogIn size={16} /> Sign in to apply
        </button>
      );
    }
    if (!hasMembership) {
      return (
        <Link
          href="/dashboard/membership"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-gray-900 bg-mustard-500 hover:bg-mustard-600 rounded-xl transition-colors shadow-sm"
        >
          <Sparkles size={16} /> Subscribe to apply — {JOB_MEMBERSHIP_PRICE_GMD} GMD /{" "}
          {MEMBERSHIP_PERIOD_LABEL}
        </Link>
      );
    }
    if (isExternal) {
      return (
        <button
          onClick={handleExternalApply}
          disabled={applyLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm disabled:opacity-60"
        >
          <ShieldCheck size={16} />
          {applyLoading ? "Opening…" : "Apply for this job"}
          <ExternalLink size={15} />
        </button>
      );
    }
    return (
      <button
        onClick={() => setApplyOpen(true)}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
      >
        <ShieldCheck size={16} /> Apply with Membership
      </button>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        {action()}
        <SaveJobButton jobId={job.id} redirectPath={path} />
      </div>
      {applyError && !applyOpen && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {applyError}
        </p>
      )}

      {/* Apply modal — CONNEKT-hosted listings only */}
      <AnimatePresence>
        {applyOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setApplyOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="relative bg-white w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-display text-lg font-bold text-gray-900">
                  Apply: {job.title}
                </h2>
                <button
                  onClick={() => setApplyOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +220 700 0000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cover Letter
                  </label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={6}
                    placeholder="Tell the employer why you're a great fit..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 resize-none"
                  />
                </div>
                {applyError && (
                  <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">
                    {applyError}
                  </p>
                )}
                <button
                  onClick={handleApply}
                  disabled={applyLoading || !coverLetter.trim()}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  {applyLoading ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submitted on CONNEKT */}
      <AnimatePresence>
        {successOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSuccessOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                Application Submitted
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                The employer will review your application and reach out if there&apos;s a fit.
              </p>
              <button
                onClick={() => setSuccessOpen(false)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Handed over to the original posting */}
      <AnimatePresence>
        {handoffOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setHandoffOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6 text-center"
            >
              <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExternalLink size={26} className="text-teal-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 mb-1">
                Finish on {job.sourceName || "the employer's site"}
              </h3>
              <p className="text-sm text-gray-500 mb-5">
                We opened the original posting in a new tab and saved this {noun} to your
                applications. If the tab didn&apos;t open, use the button below.
              </p>
              {externalUrl && (
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors mb-2"
                >
                  Open the posting
                </a>
              )}
              <button
                onClick={() => setHandoffOpen(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
