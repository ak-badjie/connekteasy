"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobsByEmployer, getApplicationsByJob, getFreelancers } from "@/app/lib/firestore";
import type { Job, JobApplication, UserProfile } from "@/app/lib/types";
import { staggerContainer, staggerItem } from "@/app/lib/animations";
import { greeting, deriveScore, StatCard, Panel, EmptyState, Avatar } from "./kit";
import {
  Briefcase,
  Users,
  ClipboardCheck,
  Star,
  Plus,
  GraduationCap,
  Search,
  UserPlus,
  FileSpreadsheet,
  CalendarClock,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  reviewed: "bg-blue-50 text-blue-600",
  shortlisted: "bg-emerald-50 text-emerald-600",
  rejected: "bg-red-50 text-red-500",
};

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function EmployerDashboard() {
  const { user, userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [topTalent, setTopTalent] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const jobsR = await getJobsByEmployer(user.uid).catch(() => [] as Job[]);
      if (cancelled) return;
      setJobs(jobsR);

      const appsArrays = await Promise.all(
        jobsR.map((j) => getApplicationsByJob(j.id).catch(() => [] as JobApplication[]))
      );
      if (cancelled) return;
      const all = appsArrays.flat().sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setApps(all);

      const freelancers = await getFreelancers().catch(() => [] as UserProfile[]);
      if (cancelled) return;
      const best = [...freelancers].sort((a, b) => deriveScore(b) - deriveScore(a))[0] || null;
      setTopTalent(best);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeJobs = jobs.filter((j) => j.status === "open").length;
  const totalApplicants = jobs.reduce((s, j) => s + (j.applicants || 0), 0);
  const reviewed = apps.filter((a) => a.status === "reviewed").length;
  const shortlisted = apps.filter((a) => a.status === "shortlisted").length;

  const pipeline = [
    { label: "Applied", value: apps.length, w: 100 },
    { label: "Reviewed", value: reviewed, w: 70 },
    { label: "Shortlisted", value: shortlisted, w: 45 },
    { label: "Rejected", value: apps.filter((a) => a.status === "rejected").length, w: 25 },
  ];

  // Hiring analytics — applications per month (last 6)
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("en-GB", { month: "short" }), amount: 0 };
  });
  apps.forEach((a) => {
    const t = a.createdAt?.toMillis?.();
    if (!t) return;
    const d = new Date(t);
    const ago = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (ago >= 0 && ago <= 5) months[5 - ago].amount += 1;
  });
  const maxBar = Math.max(1, ...months.map((m) => m.amount));

  const quick = [
    { label: "Post a Job", Icon: Plus, href: "/dashboard/jobs/post" },
    { label: "Post an Internship", Icon: GraduationCap, href: "/dashboard/jobs/post" },
    { label: "Search Talent", Icon: Search, href: "/dashboard/talent" },
    { label: "Invite Candidates", Icon: UserPlus, href: "/dashboard/talent" },
    { label: "Create Assessment", Icon: FileSpreadsheet, href: "/dashboard/assessments" },
    { label: "Interview Scheduler", Icon: CalendarClock, href: "/dashboard/interviews" },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
          {greeting()}, {userProfile?.firstName || userProfile?.displayName || "there"}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Here&apos;s what&apos;s happening with your hiring today.</p>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Briefcase size={20} />} value={loading ? "…" : activeJobs} label="Active Jobs" accent="teal" href="/dashboard/jobs/my-jobs" />
        <StatCard icon={<Users size={20} />} value={totalApplicants} label="Total Applicants" accent="indigo" href="/dashboard/jobs/my-jobs" />
        <StatCard icon={<Star size={20} />} value={shortlisted} label="Shortlisted" accent="emerald" href="/dashboard/jobs/my-jobs" />
        <StatCard icon={<ClipboardCheck size={20} />} value={reviewed} label="In Review" accent="mustard" href="/dashboard/jobs/my-jobs" />
      </motion.div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* AI Candidate Match */}
        <motion.div variants={staggerItem}>
          <Panel title="AI Candidate Match" action="All talent" actionHref="/dashboard/talent">
            {!topTalent ? (
              <EmptyState icon={<Sparkles size={22} />} title="No candidates yet" hint="Top matched talent will appear here." />
            ) : (
              <div className="text-center">
                <div className="mx-auto w-fit mb-3">
                  <Avatar name={topTalent.displayName} src={topTalent.profilePhotoUrl} size={64} />
                </div>
                <p className="text-base font-bold text-gray-900">{topTalent.displayName}</p>
                <p className="text-xs text-gray-500 mb-2">{topTalent.title || "Virtual Assistant"}</p>
                <span className="inline-block px-2.5 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 mb-3">
                  {deriveScore(topTalent)}% match
                </span>
                <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                  {(topTalent.skills || []).slice(0, 4).map((s) => (
                    <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Link href={`/profile/${topTalent.uid}`} className="flex-1 text-center text-xs font-semibold text-white bg-teal-700 rounded-lg py-2 hover:bg-teal-800 transition-colors">
                    View Profile
                  </Link>
                  <Link href="/dashboard/messages" className="flex-1 text-center text-xs font-semibold text-teal-700 border border-teal-200 rounded-lg py-2 hover:bg-teal-50 transition-colors">
                    Invite
                  </Link>
                </div>
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Recent Applicants */}
        <motion.div variants={staggerItem}>
          <Panel title="Recent Applicants" action="View all" actionHref="/dashboard/jobs/my-jobs">
            {apps.length === 0 ? (
              <EmptyState icon={<Users size={22} />} title="No applicants yet" hint="Applicants to your jobs appear here." />
            ) : (
              <div className="space-y-3">
                {apps.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3">
                    <Avatar name={a.applicantName} src={a.applicantAvatar} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.applicantName}</p>
                      <p className="text-xs text-gray-500 truncate">{a.jobTitle}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full capitalize ${STATUS_BADGE[a.status] || STATUS_BADGE.pending}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Talent Pipeline */}
        <motion.div variants={staggerItem}>
          <Panel title="Talent Pipeline">
            <div className="space-y-3">
              {pipeline.map((p) => (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{p.label}</span>
                    <span className="text-xs font-bold text-gray-900">{p.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-teal-600" style={{ width: `${p.w}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      </div>

      {/* Active jobs + analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Active Jobs */}
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Panel title="Active Jobs" action="Post a Job" actionHref="/dashboard/jobs/post">
            {jobs.length === 0 ? (
              <EmptyState icon={<Briefcase size={22} />} title="No jobs posted" hint="Post your first job to start hiring." />
            ) : (
              <div className="space-y-2.5">
                {jobs.slice(0, 4).map((j) => (
                  <div key={j.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50">
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-teal-600 flex items-center justify-center shrink-0">
                      <Briefcase size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{j.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{j.employmentType} · {j.location || "Remote"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{j.applicants || 0}</p>
                      <p className="text-[10px] text-gray-400">applicants</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full ${j.status === "open" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      {j.status === "open" ? "Active" : "Closed"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Hiring Analytics */}
        <motion.div variants={staggerItem}>
          <Panel title="Hiring Analytics">
            {apps.length === 0 ? (
              <EmptyState icon={<TrendingUp size={22} />} title="No data yet" hint="Applications over time will chart here." />
            ) : (
              <div className="flex items-end gap-2 h-32 pt-2">
                {months.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-gray-100 rounded-md flex items-end h-full">
                      <div className="w-full bg-mustard-500 rounded-md" style={{ height: `${(m.amount / maxBar) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>
      </div>

      {/* Quick actions + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <motion.div variants={staggerItem} className="lg:col-span-2">
          <Panel title="Quick Actions">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {quick.map((q) => (
                <Link key={q.label} href={q.href} className="flex flex-col gap-2 p-3.5 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors">
                  <q.Icon size={18} className="text-teal-600" />
                  <span className="text-xs font-semibold text-gray-800">{q.label}</span>
                </Link>
              ))}
            </div>
          </Panel>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Panel title="Recent Activity">
            {apps.length === 0 ? (
              <EmptyState icon={<Users size={22} />} title="Nothing yet" hint="Hiring activity will appear here." />
            ) : (
              <div className="space-y-3">
                {apps.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <UserPlus size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 leading-snug">
                        <span className="font-semibold">{a.applicantName}</span> applied for{" "}
                        <span className="font-semibold">{a.jobTitle}</span>
                      </p>
                      <p className="text-xs text-gray-400">{a.createdAt?.toMillis ? timeAgo(a.createdAt.toMillis()) : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}
