"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getSavedJobs } from "@/app/lib/firestore";
import type { Job } from "@/app/lib/types";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Bookmark, MapPin } from "lucide-react";
import SaveJobButton from "@/app/components/SaveJobButton";

export default function SavedPage() {
  const { user, userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const savedIds = userProfile?.savedJobs ?? [];

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (savedIds.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }
      const rows = await getSavedJobs(savedIds).catch(() => []);
      if (!cancelled) {
        setJobs(rows);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, savedIds.join(",")]);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-5xl mx-auto">
      <motion.div variants={fadeInUp} className="mb-6">
        <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-900">Saved Opportunities</h1>
        <p className="text-sm text-gray-500 mt-1">Roles you bookmarked. Tap a card to view and apply.</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : jobs.length === 0 ? (
        <motion.div variants={staggerItem} className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Bookmark size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Nothing saved yet</h3>
          <p className="text-xs text-gray-500 mb-4">Tap the bookmark on any job or internship to save it here.</p>
          <Link href="/dashboard/jobs" className="inline-flex px-4 py-2 text-xs font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors">
            Browse opportunities
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {jobs.map((job) => {
            const href = job.employmentType === "internship" ? `/internships/${job.id}` : `/jobs/${job.id}`;
            return (
              <motion.div key={job.id} variants={staggerItem}>
                <Link href={href} className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all h-full">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold font-display text-gray-900 line-clamp-2">{job.title}</h3>
                      <p className="text-sm text-gray-600 mt-1 truncate">{job.company}</p>
                    </div>
                    <SaveJobButton jobId={job.id} redirectPath="/dashboard/saved" />
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location || "Remote"}</span>
                    <span>·</span>
                    <span className="capitalize">{job.employmentType}</span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
