"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getApplicationsByUser } from "@/app/lib/firestore";
import type { JobApplication, JobApplicationStatus } from "@/app/lib/types";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Panel, EmptyState } from "@/app/dashboard/_components/kit";
import { FileText } from "lucide-react";

const STATUS: Record<JobApplicationStatus, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-gray-100 text-gray-600" },
  reviewed: { label: "In Review", cls: "bg-blue-50 text-blue-600" },
  shortlisted: { label: "Shortlisted", cls: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "Not selected", cls: "bg-red-50 text-red-500" },
};

const FILTERS: { value: JobApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "In Review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Not selected" },
];

function fmt(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JobApplicationStatus | "all">("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getApplicationsByUser(user.uid)
      .then((a) => !cancelled && setApps(a))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">My Applications</h1>
        <p className="text-sm text-gray-500 mt-1">Track the status of every role you&apos;ve applied to.</p>
      </motion.div>

      <motion.div variants={staggerItem} className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 px-4 py-2 text-xs font-semibold rounded-full border transition-colors ${
              filter === f.value ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={<FileText size={22} />} title="No applications yet" hint="Apply to jobs and internships and they'll show up here." />
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((a) => (
                <Link key={a.id} href={`/jobs/${a.jobId}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <FileText size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700">{a.jobTitle}</p>
                    <p className="text-xs text-gray-400">Applied {a.createdAt?.toMillis ? fmt(a.createdAt.toMillis()) : "recently"}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full ${STATUS[a.status]?.cls || STATUS.pending.cls}`}>
                    {STATUS[a.status]?.label || a.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
