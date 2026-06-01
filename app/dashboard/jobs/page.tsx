"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getJobs } from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Briefcase, MapPin, Plus, Folder } from "lucide-react";
import type { Job, JobEmploymentType } from "@/app/lib/types";

const EMPLOYMENT_FILTERS: { value: JobEmploymentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<JobEmploymentType | "all">("all");

  useEffect(() => {
    getJobs()
      .then((data) => setJobs(data))
      .catch((e) => console.error("Failed to load jobs:", e))
      .finally(() => setLoading(false));
  }, []);

  // Internships live behind a paid subscription, so they're surfaced only on
  // the dedicated /dashboard/internships page — never on the free Job Board.
  const visibleJobs = jobs.filter((j) => j.employmentType !== "internship");
  const filtered =
    typeFilter === "all"
      ? visibleJobs
      : visibleJobs.filter((j) => j.employmentType === typeFilter);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading jobs...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8" variants={fadeInUp}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-900 mb-1">Job Board</h1>
          <p className="text-sm sm:text-base text-gray-500">Browse opportunities posted by employers — free to apply.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/jobs/my-jobs" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            <Folder size={16} /> My Posted Jobs
          </Link>
          <Link href="/dashboard/jobs/post" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm">
            <Plus size={16} /> Post a Job
          </Link>
        </div>
      </motion.div>

      <motion.div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-1" variants={fadeInUp}>
        {EMPLOYMENT_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setTypeFilter(f.value)}
            className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-full border transition-colors ${
              typeFilter === f.value
                ? "bg-teal-50 text-teal-700 border-teal-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm" variants={staggerItem}>
          <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">No jobs match this filter</h3>
          <p className="text-xs text-gray-500">Try a different employment type or be the first to post one.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
            >
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold font-display text-gray-900 line-clamp-2">{job.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-teal-50 text-teal-700 capitalize">
                    {job.employmentType}
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location || "Remote"}</span>
                  <span>·</span>
                  <span>{job.salary || "Salary undisclosed"}</span>
                  <span>·</span>
                  <span>{job.applicants || 0} applicants</span>
                  <span className="ml-auto text-gray-400">{job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : "Just now"}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
