"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getJobsByEmployer,
  getApplicationsByJob,
  closeJob,
  updateJobApplicationStatus,
} from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Briefcase, X, Plus, Mail, Phone } from "lucide-react";
import type { Job, JobApplication, JobApplicationStatus } from "@/app/lib/types";

const STATUS_LABELS: Record<JobApplicationStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-gray-100 text-gray-700" },
  reviewed: { label: "Reviewed", classes: "bg-teal-50 text-teal-700" },
  shortlisted: { label: "Shortlisted", classes: "bg-emerald-50 text-emerald-700" },
  rejected: { label: "Rejected", classes: "bg-red-50 text-red-700" },
};

export default function MyJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const [drawerJob, setDrawerJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getJobsByEmployer(user.uid)
      .then(setJobs)
      .catch((e) => console.error("Failed to load my jobs:", e))
      .finally(() => setLoading(false));
  }, [user]);

  const openDrawer = async (job: Job) => {
    setDrawerJob(job);
    setAppsLoading(true);
    try {
      const apps = await getApplicationsByJob(job.id);
      setApplications(apps);
    } catch (e) {
      console.error("Failed to load applications:", e);
    } finally {
      setAppsLoading(false);
    }
  };

  const handleCloseJob = async (job: Job) => {
    if (!confirm(`Close "${job.title}"? Candidates will no longer be able to apply.`)) return;
    await closeJob(job.id);
    setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: "closed" } : j)));
  };

  const handleStatus = async (appId: string, status: JobApplicationStatus) => {
    await updateJobApplicationStatus(appId, status);
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading your jobs...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8" variants={fadeInUp}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-900 mb-1">My Posted Jobs</h1>
          <p className="text-sm sm:text-base text-gray-500">Manage your job postings and review applicants.</p>
        </div>
        <Link href="/dashboard/jobs/post" className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shrink-0 w-full sm:w-auto shadow-sm">
          <Plus size={16} /> Post a Job
        </Link>
      </motion.div>

      {jobs.length === 0 ? (
        <motion.div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm" variants={staggerItem}>
          <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">No jobs posted yet</h3>
          <p className="text-xs text-gray-500 mb-4">Post your first job to start attracting candidates.</p>
          <Link href="/dashboard/jobs/post" className="inline-flex px-4 py-2 text-xs font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm">
            Post a Job
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {jobs.map((job) => (
            <motion.div
              key={job.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              variants={staggerItem}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2 mb-1">
                  <h3 className="text-base font-semibold font-display text-gray-900 line-clamp-1 flex-1">{job.title}</h3>
                  <span className={`shrink-0 px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${job.status === "open" ? "bg-teal-50 text-teal-700" : "bg-gray-100 text-gray-500"}`}>
                    {job.status === "open" ? "Open" : "Closed"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {job.company} · {job.employmentType} · <strong className="text-gray-700">{job.applicants || 0}</strong> applicants
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/jobs/${job.id}`} className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                  View
                </Link>
                <button onClick={() => openDrawer(job)} className="px-3 py-1.5 text-xs font-medium text-teal-700 bg-teal-50 border border-teal-100 rounded-xl hover:bg-teal-100 transition-colors">
                  Applicants
                </button>
                {job.status === "open" && (
                  <button onClick={() => handleCloseJob(job)} className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {drawerJob && (
          <div className="fixed inset-0 z-[110] flex">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerJob(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="min-w-0">
                  <h2 className="font-display text-lg font-bold text-gray-900 truncate">{drawerJob.title}</h2>
                  <p className="text-xs text-gray-500">{applications.length} applicant{applications.length === 1 ? "" : "s"}</p>
                </div>
                <button onClick={() => setDrawerJob(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {appsLoading ? (
                  <div className="text-center py-10">
                    <div className="w-6 h-6 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : applications.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-10">No applicants yet.</p>
                ) : (
                  applications.map((app) => (
                    <div key={app.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                            {app.applicantAvatar || app.applicantName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{app.applicantName}</p>
                            <p className="text-xs text-gray-500 truncate">{app.applicantEmail}</p>
                          </div>
                        </div>
                        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_LABELS[app.status].classes}`}>
                          {STATUS_LABELS[app.status].label}
                        </span>
                      </div>
                      {app.coverLetter && (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2 mb-3 bg-white p-3 rounded-lg border border-gray-100">
                          {app.coverLetter}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-3">
                        <a href={`mailto:${app.applicantEmail}`} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-100">
                          <Mail size={11} /> Email
                        </a>
                        {app.phone && (
                          <a href={`tel:${app.phone}`} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-100">
                            <Phone size={11} /> {app.phone}
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(["reviewed", "shortlisted", "rejected"] as JobApplicationStatus[]).map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatus(app.id, s)}
                            disabled={app.status === s}
                            className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                              app.status === s
                                ? `${STATUS_LABELS[s].classes} border-current opacity-50 cursor-not-allowed`
                                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            Mark {STATUS_LABELS[s].label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
