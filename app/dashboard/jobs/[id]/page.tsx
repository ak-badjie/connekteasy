"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getJob,
  hasAppliedToJob,
  createJobApplication,
} from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Briefcase, MapPin, CheckCircle, X, ArrowLeft } from "lucide-react";
import type { Job } from "@/app/lib/types";

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

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;
  const { user, userProfile } = useAuth();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);

  const [applyOpen, setApplyOpen] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [phone, setPhone] = useState("");
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId).then(setJob).finally(() => setLoading(false));
  }, [jobId]);

  useEffect(() => {
    if (jobId && user?.uid) {
      hasAppliedToJob(jobId, user.uid).then(setHasApplied);
    }
  }, [jobId, user?.uid]);

  const handleApply = async () => {
    if (!user || !userProfile || !job) return;
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
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading job...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">Job not found</h3>
        <p className="text-sm text-gray-500 mb-4">This job may have been removed.</p>
        <Link href="/dashboard/jobs" className="inline-flex px-4 py-2 text-xs font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm">
          Back to jobs
        </Link>
      </div>
    );
  }

  const isOwner = user?.uid === job.postedBy;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
      <motion.div variants={fadeInUp}>
        <Link href="/dashboard/jobs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Job Board
        </Link>
      </motion.div>

      <motion.div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6" variants={staggerItem}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
            <p className="text-base text-gray-600">{job.company}</p>
          </div>
          <span className="shrink-0 px-3 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 capitalize">
            {job.employmentType}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-6">
          <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location || "Remote"}</span>
          <span>·</span>
          <span>{job.salary || "Salary undisclosed"}</span>
          <span>·</span>
          <span>{job.applicants || 0} applicants</span>
          <span>·</span>
          <span className="text-gray-400">{job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : "Just now"}</span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
          {job.description}
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span key={s} className="px-3 py-1 text-xs font-medium bg-gray-50 text-gray-700 rounded-full border border-gray-200">{s}</span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100">
          {isOwner ? (
            <Link href="/dashboard/jobs/my-jobs" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
              You posted this job — View applicants
            </Link>
          ) : hasApplied ? (
            <div className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle size={16} /> You&apos;ve already applied
            </div>
          ) : job.status === "closed" ? (
            <div className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-xl">
              This job is closed
            </div>
          ) : (
            <button
              onClick={() => setApplyOpen(true)}
              disabled={!user}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition-colors shadow-sm"
            >
              Apply Now — Free
            </button>
          )}
        </div>
      </motion.div>

      {/* Apply Modal */}
      <AnimatePresence>
        {applyOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApplyOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-white w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <h2 className="font-display text-lg font-bold text-gray-900">Apply: {job.title}</h2>
                <button onClick={() => setApplyOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
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
                    placeholder="Tell the employer why you're a great fit..."
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSuccessOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative bg-white w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-emerald-600" />
              </div>
              <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Application Submitted</h3>
              <p className="text-sm text-gray-500 mb-5">The employer will review your application and reach out if there&apos;s a fit.</p>
              <button onClick={() => setSuccessOpen(false)} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl transition-colors">
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
