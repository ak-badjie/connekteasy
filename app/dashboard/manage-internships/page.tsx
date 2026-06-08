"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobsByEmployer, closeJob } from "@/app/lib/firestore";
import { useRoleGuard } from "@/app/lib/useRoleGuard";
import type { Job } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState } from "@/app/dashboard/_components/kit";
import { GraduationCap, Plus } from "lucide-react";

export default function ManageInternshipsPage() {
  const { allowed, checking } = useRoleGuard((c) => c.postJobs);
  const { user } = useAuth();
  const [internships, setInternships] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getJobsByEmployer(user.uid)
      .then((jobs) => !cancelled && setInternships(jobs.filter((j) => j.employmentType === "internship")))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleClose = async (job: Job) => {
    if (!confirm(`Close "${job.title}"?`)) return;
    await closeJob(job.id);
    setInternships((p) => p.map((j) => (j.id === job.id ? { ...j, status: "closed" } : j)));
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!allowed) return null;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Internships</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the internship positions you&apos;ve posted.</p>
        </div>
        <Link href="/dashboard/jobs/post" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shrink-0">
          <Plus size={16} /> Post an Internship
        </Link>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : internships.length === 0 ? (
            <EmptyState icon={<GraduationCap size={22} />} title="No internships yet" hint="Post an internship to start receiving student applications." />
          ) : (
            <div className="divide-y divide-gray-50">
              {internships.map((j) => (
                <div key={j.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-lg bg-mustard-50 text-mustard-600 flex items-center justify-center shrink-0">
                    <GraduationCap size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{j.title}</p>
                    <p className="text-xs text-gray-500"><strong className="text-gray-700">{j.applicants || 0}</strong> applicants · {j.location || "Remote"}</p>
                  </div>
                  <Link href={`/internships/${j.id}`} className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    View
                  </Link>
                  {j.status === "open" ? (
                    <button onClick={() => handleClose(j)} className="shrink-0 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                      Close
                    </button>
                  ) : (
                    <span className="shrink-0 px-3 py-1.5 text-xs font-medium text-gray-400">Closed</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
