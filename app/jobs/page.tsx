"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobs } from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Briefcase, MapPin, Plus, SearchX } from "lucide-react";
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

export default function PublicJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<JobEmploymentType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    getJobs()
      .then((data) => setJobs(data.filter((j) => j.employmentType !== "internship")))
      .catch((e) => console.error("Failed to load jobs:", e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchesType = typeFilter === "all" || j.employmentType === typeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.skills || []).some((s) => s.toLowerCase().includes(q));
      return matchesType && matchesSearch;
    });
  }, [jobs, typeFilter, searchQuery]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <motion.div
        className="bg-white border-b border-gray-200"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Job Board</h1>
              <p className="text-sm sm:text-base text-gray-500">
                Browse opportunities posted by employers — free to apply.
              </p>
            </div>
            <Link
              href={user ? "/dashboard/jobs/post" : "/auth/signin?redirect=/dashboard/jobs/post"}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm shrink-0"
            >
              <Plus size={16} /> Post a Job
            </Link>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, company, skill…"
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all"
            />
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
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
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "job" : "jobs"}
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading jobs...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <SearchX size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">No jobs match</h3>
            <p className="text-xs text-gray-500">Try a different search or filter.</p>
          </motion.div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {filtered.map((job) => (
              <motion.div key={job.id} variants={staggerItem}>
                <Link
                  href={`/jobs/${job.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all h-full"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold font-display text-gray-900 line-clamp-2">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 truncate">{job.company}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-teal-50 text-teal-700 capitalize">
                      {job.employmentType}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {job.location || "Remote"}
                    </span>
                    <span>·</span>
                    <span className="truncate">{job.salary || "Salary undisclosed"}</span>
                    <span className="ml-auto text-gray-400">
                      {job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : "Just now"}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {!loading && filtered.length === 0 && jobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">No jobs posted yet</h3>
            <p className="text-xs text-gray-500">Be the first to post one — it&apos;s free.</p>
          </div>
        )}
      </div>
    </div>
  );
}
