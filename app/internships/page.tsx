"use client";

import { useEffect, useState, useMemo } from "react";
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
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { GraduationCap, MapPin, Plus, SearchX, ShieldCheck } from "lucide-react";
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

export default function PublicInternshipsPage() {
  const { user } = useAuth();
  const [internships, setInternships] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [sub, setSub] = useState<InternshipSubscription | null>(null);

  useEffect(() => {
    getJobs()
      .then((data) => setInternships(data.filter((j) => j.employmentType === "internship")))
      .catch((e) => console.error("Failed to load internships:", e))
      .finally(() => setLoading(false));
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
    if (!q) return internships;
    return internships.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.skills || []).some((s) => s.toLowerCase().includes(q))
    );
  }, [internships, searchQuery]);

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
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Internships</h1>
              <p className="text-sm sm:text-base text-gray-500 max-w-2xl">
                Curated internship opportunities across The Gambia. Browse freely —
                applying requires a {INTERNSHIP_PRICE_GMD} GMD / {INTERNSHIP_PERIOD_LABEL} membership.
              </p>
            </div>
            <Link
              href={user ? "/dashboard/jobs/post?type=internship" : "/auth/signin?redirect=/dashboard/jobs/post?type=internship"}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm shrink-0"
            >
              <Plus size={16} /> Post an Internship
            </Link>
          </div>

          {/* Membership status banner — only relevant when logged in */}
          {user && (
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

          <div className="mt-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search internships by title, company, skill…"
              className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all"
            />
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          Showing <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "internship" : "internships"}
        </p>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading internships...</p>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
          >
            <SearchX size={40} className="text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">
              {internships.length === 0 ? "No internships posted yet" : "No internships match your search"}
            </h3>
            <p className="text-xs text-gray-500">
              {internships.length === 0 ? "Check back soon — opportunities arrive frequently." : "Try different keywords."}
            </p>
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
                  href={`/internships/${job.id}`}
                  className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-mustard-200 hover:shadow-md transition-all h-full"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold font-display text-gray-900 line-clamp-2">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 truncate">{job.company}</p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-mustard-500/10 text-mustard-700">
                      Internship
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} /> {job.location || "Remote"}
                    </span>
                    <span>·</span>
                    <span className="truncate">{job.salary || "Stipend undisclosed"}</span>
                    <span className="ml-auto text-gray-400">
                      {job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : "Just now"}
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
