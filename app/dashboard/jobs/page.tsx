"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobs } from "@/app/lib/firestore";
import { caps } from "@/app/lib/roles";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import Pagination from "@/app/components/Pagination";
import {
  EMPLOYMENT_LABELS,
  HOME_COUNTRY,
  PAGE_SIZE,
  formatLocation,
  isLocalJob,
  matchesLocationFilter,
  timeAgo,
  toPlainJob,
  type LocationFilter,
  type PlainJob,
} from "@/app/lib/jobUtils";
import { Briefcase, MapPin, Plus, Folder } from "lucide-react";
import type { JobEmploymentType } from "@/app/lib/types";

const EMPLOYMENT_FILTERS: { value: JobEmploymentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
];

const LOCATION_FILTERS: { value: LocationFilter; label: string }[] = [
  { value: "all", label: "Everywhere" },
  { value: "local", label: `Local — ${HOME_COUNTRY}` },
  { value: "remote", label: "Remote" },
];

export default function JobsPage() {
  const { userProfile } = useAuth();
  const canPostJobs = caps(userProfile?.role).postJobs;
  const [jobs, setJobs] = useState<PlainJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<JobEmploymentType | "all">("all");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    getJobs()
      .then((data) => setJobs(data.map(toPlainJob)))
      .catch((e) => console.error("Failed to load jobs:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, locationFilter]);

  // Internships live behind a paid subscription, so they're surfaced only on
  // the dedicated /dashboard/internships page — never on the free Job Board.
  const filtered = useMemo(
    () =>
      jobs.filter(
        (j) =>
          j.employmentType !== "internship" &&
          (typeFilter === "all" || j.employmentType === typeFilter) &&
          matchesLocationFilter(j, locationFilter)
      ),
    [jobs, typeFilter, locationFilter]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pageCount));
    document
      .querySelector<HTMLElement>("[data-scroll-container]")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      <motion.div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
        variants={fadeInUp}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-900 mb-1">Job Board</h1>
          <p className="text-sm sm:text-base text-gray-500">
            Vacancies in {HOME_COUNTRY} and remote roles open to Gambians.
          </p>
        </div>
        {canPostJobs && (
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/jobs/my-jobs"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Folder size={16} /> My Posted Jobs
            </Link>
            <Link
              href="/dashboard/jobs/post"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm"
            >
              <Plus size={16} /> Post a Job
            </Link>
          </div>
        )}
      </motion.div>

      <motion.div className="flex flex-col gap-2 mb-4" variants={fadeInUp}>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {LOCATION_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setLocationFilter(f.value)}
              className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-full border transition-colors ${
                locationFilter === f.value
                  ? "bg-mustard-500 text-gray-900 border-mustard-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-mustard-300 hover:text-mustard-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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
      </motion.div>

      <p className="text-xs text-gray-500 mb-4">
        Showing{" "}
        <span className="font-semibold text-gray-900">
          {visible.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
          {(currentPage - 1) * PAGE_SIZE + visible.length}
        </span>{" "}
        of <span className="font-semibold text-gray-900">{filtered.length}</span> jobs
      </p>

      {filtered.length === 0 ? (
        <motion.div
          className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"
          variants={staggerItem}
        >
          <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">
            No jobs match this filter
          </h3>
          <p className="text-xs text-gray-500">
            Try a different employment type or location.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visible.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
              >
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="block h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold font-display text-gray-900 line-clamp-2">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-teal-50 text-teal-700">
                        {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
                      </span>
                      {isLocalJob(job) && (
                        <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-mustard-50 text-mustard-700">
                          Local
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {formatLocation(job.location, 40)}
                    </span>
                    <span>·</span>
                    <span className="truncate max-w-[160px]">
                      {job.salary && job.salary !== "Unspecified"
                        ? job.salary
                        : "Salary undisclosed"}
                    </span>
                    <span className="ml-auto text-gray-400">{timeAgo(job.createdAtMs)}</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <Pagination
            page={currentPage}
            pageCount={pageCount}
            onChange={goToPage}
            className="mt-8"
          />
        </>
      )}
    </motion.div>
  );
}
