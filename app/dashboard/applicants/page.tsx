"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobsByEmployer, getApplicationsByJob, updateJobApplicationStatus } from "@/app/lib/firestore";
import { useRoleGuard } from "@/app/lib/useRoleGuard";
import type { JobApplication, JobApplicationStatus } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState, Avatar } from "@/app/dashboard/_components/kit";
import { Users, Mail, Phone } from "lucide-react";

const STATUS_LABELS: Record<JobApplicationStatus, { label: string; cls: string }> = {
  pending: { label: "New", cls: "bg-gray-100 text-gray-600" },
  reviewed: { label: "Reviewed", cls: "bg-blue-50 text-blue-600" },
  shortlisted: { label: "Shortlisted", cls: "bg-emerald-50 text-emerald-600" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-500" },
};

const FILTERS: { value: JobApplicationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
];

export default function ApplicantsPage() {
  const { allowed, checking } = useRoleGuard((c) => c.postJobs);
  const { user } = useAuth();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<JobApplicationStatus | "all">("all");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const jobs = await getJobsByEmployer(user.uid).catch(() => []);
      const arrays = await Promise.all(jobs.map((j) => getApplicationsByJob(j.id).catch(() => [] as JobApplication[])));
      if (cancelled) return;
      setApps(arrays.flat().sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const setStatus = async (id: string, status: JobApplicationStatus) => {
    await updateJobApplicationStatus(id, status);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const filtered = filter === "all" ? apps : apps.filter((a) => a.status === filter);

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
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Applicants</h1>
        <p className="text-sm text-gray-500 mt-1">Everyone who applied across your jobs and internships.</p>
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
            <EmptyState icon={<Users size={22} />} title="No applicants" hint="Applicants to your jobs will show up here." />
          ) : (
            <div className="space-y-3">
              {filtered.map((a) => (
                <div key={a.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <Avatar name={a.applicantName} src={a.applicantAvatar} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.applicantName}</p>
                      <p className="text-xs text-gray-500 truncate">{a.jobTitle}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${STATUS_LABELS[a.status].cls}`}>
                      {STATUS_LABELS[a.status].label}
                    </span>
                  </div>
                  {a.coverLetter && <p className="text-sm text-gray-700 bg-white rounded-lg border border-gray-100 p-3 mb-3 whitespace-pre-wrap line-clamp-4">{a.coverLetter}</p>}
                  <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
                    <a href={`mailto:${a.applicantEmail}`} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600"><Mail size={11} /> Email</a>
                    {a.phone && <a href={`tel:${a.phone}`} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md hover:bg-gray-100 text-gray-600"><Phone size={11} /> {a.phone}</a>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(["reviewed", "shortlisted", "rejected"] as JobApplicationStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(a.id, s)}
                        disabled={a.status === s}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                          a.status === s ? `${STATUS_LABELS[s].cls} border-current opacity-60 cursor-not-allowed` : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {STATUS_LABELS[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
