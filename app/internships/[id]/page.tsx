"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getJob,
  hasAppliedToJob,
  createJobApplication,
} from "@/app/lib/firestore";
import {
  subscribeToMyInternshipSubscription,
  isInternshipSubscriptionActive,
  INTERNSHIP_PRICE_GMD,
  INTERNSHIP_PERIOD_LABEL,
} from "@/app/lib/subscriptions";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import SaveJobButton from "@/app/components/SaveJobButton";
import {
  GraduationCap,
  MapPin,
  CheckCircle,
  X,
  ArrowLeft,
  LogIn,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Job, InternshipSubscription } from "@/app/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function PublicInternshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;
  const { user, userProfile, loading: authLoading } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  const [sub, setSub] = useState<InternshipSubscription | null>(null);
  const hasActiveSubscription = isInternshipSubscriptionActive(sub);

  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then((j) => {
        // Non-internship jobs live on /jobs — redirect there.
        if (j && j.employmentType !== "internship") {
          router.replace(`/jobs/${j.id}`);
          return;
        }
        setJob(j);
      })
      .finally(() => setLoading(false));
  }, [jobId, router]);

  useEffect(() => {
    if (jobId && user?.uid) {
      hasAppliedToJob(jobId, user.uid).then(setHasApplied);
    }
  }, [jobId, user?.uid]);

  useEffect(() => {
    if (!user) {
      setSub(null);
      return;
    }
    const unsub = subscribeToMyInternshipSubscription(user.uid, setSub);
    return unsub;
  }, [user]);

  const goSignInThenReturn = () => {
    router.push(`/auth/signin?redirect=${encodeURIComponent(`/internships/${jobId}`)}`);
  };

  const handleApply = async () => {
    if (!user || !userProfile || !job) return;
    if (!hasActiveSubscription) {
      setApplyError("Your membership is no longer active. Please renew to apply.");
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
        applicantAvatar: `${(userProfile.firstName || "")[0] || ""}${(userProfile.lastName || "")[0] || ""}`.toUpperCase(),
        phone: phone.trim(),
        coverLetter: coverLetter.trim(),
      });
      setHasApplied(true);
      setApplyOpen(false);
      setSuccessOpen(true);
      setCoverLetter("");
      setPhone("");
    } catch (err) {
      console.error("Apply failed:", err);
      setApplyError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading internship...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-sm">
          <GraduationCap size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Internship not found</h3>
          <p className="text-sm text-gray-500 mb-4">This internship may have been removed or closed.</p>
          <Link
            href="/internships"
            className="inline-flex px-4 py-2 text-xs font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm"
          >
            Back to internships
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === job.postedBy;

  const renderApplyButton = () => {
    if (isOwner) {
      return (
        <Link
          href="/dashboard/jobs/my-jobs"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
        >
          You posted this internship — View applicants
        </Link>
      );
    }
    if (hasApplied) {
      return (
        <div className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle size={16} /> You&apos;ve already applied
        </div>
      );
    }
    if (job.status === "closed") {
      return (
        <div className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
          This internship is closed
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
    if (!hasActiveSubscription) {
      return (
        <Link
          href="/dashboard/internships"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-gray-900 bg-mustard-500 hover:bg-mustard-600 rounded-xl transition-colors shadow-sm"
        >
          <Sparkles size={16} /> Subscribe to apply — {INTERNSHIP_PRICE_GMD} GMD / {INTERNSHIP_PERIOD_LABEL}
        </Link>
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
    <div className="min-h-screen bg-gray-50">
      <motion.div
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div variants={fadeInUp}>
          <Link href="/internships" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft size={14} /> Back to Internships
          </Link>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6"
          variants={staggerItem}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
              <p className="text-base text-gray-600">{job.company}</p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5">
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-mustard-500/10 text-mustard-700">
                Internship
              </span>
              <SaveJobButton jobId={job.id} redirectPath={`/internships/${job.id}`} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-6">
            <span className="inline-flex items-center gap-1">
              <MapPin size={12} /> {job.location || "Remote"}
            </span>
            <span>·</span>
            <span>{job.salary || "Stipend undisclosed"}</span>
            <span>·</span>
            <span>{job.applicants || 0} applicants</span>
            <span>·</span>
            <span className="text-gray-400">
              {job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : "Just now"}
            </span>
          </div>

          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
            {job.description}
          </div>

          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="px-3 py-1 text-xs font-medium bg-gray-50 text-gray-700 rounded-full border border-gray-200">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">{renderApplyButton()}</div>
        </motion.div>
      </motion.div>

      {/* Apply Modal */}
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
                <h2 className="font-display text-lg font-bold text-gray-900">Apply: {job.title}</h2>
                <button
                  onClick={() => setApplyOpen(false)}
                  className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +220 700 0000"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Letter</label>
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={6}
                    placeholder="Why are you a great fit for this internship?"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 resize-none"
                  />
                </div>
                {applyError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{applyError}</p>}
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
              <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Application Submitted</h3>
              <p className="text-sm text-gray-500 mb-5">The employer will review your application and reach out if there&apos;s a fit.</p>
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
    </div>
  );
}
