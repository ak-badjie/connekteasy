"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobs } from "@/app/lib/firestore";
import JobListCard from "@/app/components/JobListCard";
import Pagination from "@/app/components/Pagination";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import {
  HOME_COUNTRY,
  PAGE_SIZE,
  matchesLocationFilter,
  toPlainJob,
  type LocationFilter,
  type PlainJob,
} from "@/app/lib/jobUtils";
import type { JobEmploymentType } from "@/app/lib/types";
import { Plus, SearchX } from "lucide-react";

const TYPE_FILTERS: { value: JobEmploymentType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "opportunity", label: "Opportunities" },
];

const LOCATION_FILTERS: { value: LocationFilter; label: string }[] = [
  { value: "all", label: "Everywhere" },
  { value: "local", label: `Local — ${HOME_COUNTRY}` },
  { value: "remote", label: "Remote" },
];

/**
 * The public board. It is handed server-rendered listings so the first paint
 * (and everything a crawler sees) already contains the jobs, then refreshes
 * from Firestore in the background to pick up anything posted since.
 */
export default function JobBoard({
  initialJobs,
  variant,
}: {
  initialJobs: PlainJob[];
  variant: "jobs" | "internships";
}) {
  const { user } = useAuth();
  const isInternships = variant === "internships";

  const [jobs, setJobs] = useState<PlainJob[]>(initialJobs);
  const [typeFilter, setTypeFilter] = useState<JobEmploymentType | "all">("all");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  // Refresh in the background — the server copy is cached for a few minutes.
  useEffect(() => {
    let cancelled = false;
    getJobs()
      .then((data) => {
        if (cancelled) return;
        const rows = data.map(toPlainJob).filter((j) =>
          isInternships ? j.employmentType === "internship" : j.employmentType !== "internship"
        );
        if (rows.length) setJobs(rows);
      })
      .catch(() => {
        /* keep the server-rendered listings */
      });
    return () => {
      cancelled = true;
    };
  }, [isInternships]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      const matchesType = isInternships || typeFilter === "all" || j.employmentType === typeFilter;
      const matchesLocation = matchesLocationFilter(j, locationFilter);
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q));
      return matchesType && matchesLocation && matchesSearch;
    });
  }, [jobs, typeFilter, locationFilter, searchQuery, isInternships]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Any filter change starts the reader at page one again.
  useEffect(() => {
    setPage(1);
  }, [typeFilter, locationFilter, searchQuery]);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pageCount));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const localCount = useMemo(
    () => jobs.filter((j) => matchesLocationFilter(j, "local")).length,
    [jobs]
  );

  const noun = isInternships ? "internship" : "job";

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
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                {isInternships
                  ? `Internships in ${HOME_COUNTRY}`
                  : `Jobs in ${HOME_COUNTRY}`}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 max-w-2xl">
                {isInternships
                  ? `Internships and graduate openings in ${HOME_COUNTRY}, plus remote programmes open to Gambians. Updated daily.`
                  : `Every open vacancy we can find in ${HOME_COUNTRY} — government, NGO, private sector — plus remote roles open to Gambians. ${localCount} local ${localCount === 1 ? "role" : "roles"} right now.`}
              </p>
            </div>
            <Link
              href={user ? "/dashboard/jobs/post" : "/auth/signin?redirect=/dashboard/jobs/post"}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm shrink-0"
            >
              <Plus size={16} /> Post a {isInternships ? "Internship" : "Job"}
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${noun}s by title, employer, town or skill…`}
                aria-label={`Search ${noun}s`}
                className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all"
              />
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
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
            </div>

            {!isInternships && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                {TYPE_FILTERS.map((f) => (
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
            )}
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {visible.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–
            {(currentPage - 1) * PAGE_SIZE + visible.length}
          </span>{" "}
          of <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? noun : `${noun}s`}
        </p>

        {filtered.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <SearchX size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">
              No {noun}s match
            </h3>
            <p className="text-xs text-gray-500">Try a different search or filter.</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              key={`${currentPage}-${typeFilter}-${locationFilter}`}
            >
              {visible.map((job) => (
                <motion.div key={job.id} variants={staggerItem}>
                  <JobListCard job={job} />
                </motion.div>
              ))}
            </motion.div>

            <Pagination
              page={currentPage}
              pageCount={pageCount}
              onChange={goToPage}
              className="mt-8"
            />
          </>
        )}
      </div>
    </div>
  );
}
