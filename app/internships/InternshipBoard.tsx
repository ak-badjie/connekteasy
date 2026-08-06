"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobs } from "@/app/lib/firestore";
import {
  subscribeToMyInternshipSubscription,
  isInternshipSubscriptionActive,
  INTERNSHIP_PRICE_GMD,
  INTERNSHIP_PERIOD_LABEL,
} from "@/app/lib/subscriptions";
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
import { GraduationCap, Plus, SearchX, ShieldCheck } from "lucide-react";
import type { InternshipSubscription } from "@/app/lib/types";

const LOCATION_FILTERS: { value: LocationFilter; label: string }[] = [
  { value: "all", label: "Everywhere" },
  { value: "local", label: `Local — ${HOME_COUNTRY}` },
  { value: "remote", label: "Remote" },
];

export default function InternshipBoard({
  initialInternships,
}: {
  initialInternships: PlainJob[];
}) {
  const { user, userProfile } = useAuth();
  const isStudent = userProfile?.role === "student";
  const isEmployer = userProfile?.role === "client";

  const [internships, setInternships] = useState<PlainJob[]>(initialInternships);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<LocationFilter>("all");
  const [page, setPage] = useState(1);
  const [sub, setSub] = useState<InternshipSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    getJobs()
      .then((data) => {
        if (cancelled) return;
        const rows = data
          .map(toPlainJob)
          .filter((j) => j.employmentType === "internship");
        if (rows.length) setInternships(rows);
      })
      .catch(() => {
        /* keep the server-rendered listings */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setSub(null);
      return;
    }
    const unsub = subscribeToMyInternshipSubscription(user.uid, setSub);
    return unsub;
  }, [user]);

  const hasActiveSubscription = isInternshipSubscriptionActive(sub);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return internships.filter((j) => {
      const matchesLocation = matchesLocationFilter(j, locationFilter);
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.skills.some((s) => s.toLowerCase().includes(q));
      return matchesLocation && matchesSearch;
    });
  }, [internships, searchQuery, locationFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, locationFilter]);

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), pageCount));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-mustard-500/10 text-mustard-700 text-[11px] font-semibold rounded-full mb-3">
                <GraduationCap size={12} /> Internship Programme
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                Internships in {HOME_COUNTRY}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 max-w-2xl">
                Curated internship opportunities across {HOME_COUNTRY}. Browse freely —
                applying requires a {INTERNSHIP_PRICE_GMD} GMD / {INTERNSHIP_PERIOD_LABEL} membership.
              </p>
            </div>
            {!isStudent && (
              <Link
                href={
                  user
                    ? "/dashboard/jobs/post?type=internship"
                    : "/auth/signin?redirect=/dashboard/jobs/post?type=internship"
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm shrink-0"
              >
                <Plus size={16} /> Post an Internship
              </Link>
            )}
          </div>

          {/* Membership banner — only students subscribe to apply to internships */}
          {isStudent && (
            <div className="mt-6">
              {hasActiveSubscription ? (
                <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs sm:text-sm">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span className="font-semibold text-emerald-800">Membership active</span>
                  <span className="text-emerald-700">— apply with one click below</span>
                </div>
              ) : (
                <div className="inline-flex flex-wrap items-center gap-2 px-4 py-2 bg-mustard-500/10 border border-mustard-200 rounded-xl text-xs sm:text-sm">
                  <span className="font-semibold text-mustard-800">No active membership</span>
                  <span className="text-mustard-700">·</span>
                  <Link
                    href="/dashboard/internships"
                    className="font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2"
                  >
                    Subscribe for {INTERNSHIP_PRICE_GMD} GMD / {INTERNSHIP_PERIOD_LABEL}
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Employers manage their own postings rather than subscribe */}
          {isEmployer && (
            <div className="mt-6">
              <Link
                href="/dashboard/manage-internships"
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-xl text-xs sm:text-sm font-semibold text-teal-700 hover:bg-teal-100 transition-colors"
              >
                <GraduationCap size={15} /> Manage your internship postings
              </Link>
            </div>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search internships by title, organisation, town or skill…"
              aria-label="Search internships"
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
          {filtered.length === 1 ? "internship" : "internships"}
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
              {internships.length === 0
                ? "No internships posted yet"
                : "No internships match your search"}
            </h3>
            <p className="text-xs text-gray-500">
              {internships.length === 0
                ? "Check back soon — opportunities arrive frequently."
                : "Try different keywords or another location."}
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              key={`${currentPage}-${locationFilter}`}
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
