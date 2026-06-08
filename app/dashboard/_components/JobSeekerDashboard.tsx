"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getApplicationsByUser, getJobs } from "@/app/lib/firestore";
import type { Job, JobApplication } from "@/app/lib/types";
import { staggerContainer, staggerItem } from "@/app/lib/animations";
import { greeting, deriveScore, StatCard, Panel, EmptyState, Ring, Avatar } from "./kit";
import SaveJobButton from "@/app/components/SaveJobButton";
import {
  FileText,
  Star,
  Eye,
  Search,
  FileEdit,
  Headphones,
  Target,
  Briefcase,
  ClipboardCheck,
  TrendingUp,
  Bell,
} from "lucide-react";

function matchPct(profileSkills: string[] = [], jobSkills: string[] = []): number {
  if (!jobSkills.length || !profileSkills.length) return 72;
  const set = new Set(profileSkills.map((s) => s.toLowerCase()));
  const overlap = jobSkills.filter((s) => set.has(s.toLowerCase())).length;
  return Math.min(98, 62 + Math.round((overlap / jobSkills.length) * 36));
}

function timeAgo(ms: number) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function JobSeekerDashboard() {
  const { user, userProfile } = useAuth();
  const [apps, setApps] = useState<JobApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [a, j] = await Promise.allSettled([getApplicationsByUser(user.uid), getJobs()]);
      if (cancelled) return;
      if (a.status === "fulfilled") setApps(a.value);
      if (j.status === "fulfilled") setJobs(j.value.filter((x) => x.employmentType !== "internship"));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const score = deriveScore(userProfile);
  const views = userProfile?.profileViews ?? 0;
  const reviewed = apps.filter((a) => a.status === "reviewed").length;
  const shortlisted = apps.filter((a) => a.status === "shortlisted").length;
  const recommended = jobs.slice(0, 3);

  // Salary insights from real posted-job salary strings
  const salaryNums = jobs
    .flatMap((j) => (j.salary || "").match(/[\d,]{3,}/g) || [])
    .map((n) => parseInt(n.replace(/,/g, ""), 10))
    .filter((n) => !isNaN(n) && n > 0);
  const salaryMin = salaryNums.length ? Math.min(...salaryNums) : 0;
  const salaryMax = salaryNums.length ? Math.max(...salaryNums) : 0;

  const tracker = [
    { label: "Applied", value: apps.length, color: "text-teal-600", Icon: FileText },
    { label: "In Review", value: reviewed, color: "text-blue-600", Icon: ClipboardCheck },
    { label: "Shortlisted", value: shortlisted, color: "text-mustard-600", Icon: Star },
    { label: "Offers", value: 0, color: "text-emerald-600", Icon: Briefcase },
  ];

  const aiTools = [
    { label: "CV Review", hint: "Get AI feedback on your CV", Icon: FileEdit, href: "/dashboard/profile" },
    { label: "Cover Letter Generator", hint: "Create personalized letters", Icon: FileText, href: "/dashboard/messages" },
    { label: "Interview Practice", hint: "Practice with AI mock interviews", Icon: Headphones, href: "/dashboard/messages" },
    { label: "Job Matcher", hint: "Find jobs that match your profile", Icon: Target, href: "/dashboard/jobs" },
  ];

  const quick = [
    { label: "Find Jobs", Icon: Search, href: "/dashboard/jobs" },
    { label: "Update CV", Icon: FileEdit, href: "/dashboard/profile" },
    { label: "Interview Practice", Icon: Headphones, href: "/dashboard/assistant" },
    { label: "Membership", Icon: ClipboardCheck, href: "/dashboard/membership" },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-5">
      {/* Header + match score */}
      <motion.div variants={staggerItem} className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            {greeting()}, {userProfile?.firstName || "there"}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">You&apos;re one step closer to your next big opportunity.</p>
        </div>
        <div className="lg:w-[320px] bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
          <Ring value={score} />
          <div>
            <p className="text-xs text-gray-500">Job Match Score</p>
            <p className="text-2xl font-bold text-gray-900">{score}%</p>
            <Link href="/dashboard/profile" className="text-xs font-semibold text-teal-600">
              Improve Match →
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<FileText size={20} />} value={loading ? "…" : apps.length} label="Applications" accent="teal" href="/dashboard/jobs" />
        <StatCard icon={<ClipboardCheck size={20} />} value={reviewed} label="In Review" accent="blue" href="/dashboard/jobs" />
        <StatCard icon={<Star size={20} />} value={shortlisted} label="Shortlisted" accent="mustard" href="/dashboard/jobs" />
        <StatCard icon={<Eye size={20} />} value={views} label="Profile Views" accent="indigo" href="/dashboard/profile" />
      </motion.div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recommended Jobs */}
        <motion.div variants={staggerItem}>
          <Panel title="Recommended Jobs" action="View all" actionHref="/dashboard/jobs">
            {recommended.length === 0 ? (
              <EmptyState icon={<Briefcase size={22} />} title="No jobs yet" hint="Roles matched to your profile will appear here." />
            ) : (
              <div className="space-y-3">
                {recommended.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="flex items-center gap-3 group">
                    <Avatar name={job.company} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700">{job.title}</p>
                      <p className="text-xs text-gray-500 truncate">{job.company} · {job.location || "Remote"}</p>
                    </div>
                    <span className="shrink-0 px-2 py-1 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600">
                      {matchPct(userProfile?.skills, job.skills)}% Match
                    </span>
                    <SaveJobButton jobId={job.id} redirectPath="/dashboard/jobs" />
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* AI Career Tools */}
        <motion.div variants={staggerItem}>
          <Panel title="AI Career Tools" action="Explore" actionHref="/dashboard/messages">
            <div className="space-y-1">
              {aiTools.map((t) => (
                <Link key={t.label} href={t.href} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <t.Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                    <p className="text-xs text-gray-400 truncate">{t.hint}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* Application Tracker */}
        <motion.div variants={staggerItem}>
          <Panel title="Application Tracker" action="View all" actionHref="/dashboard/jobs">
            <div className="space-y-2.5">
              {tracker.map((t) => (
                <div key={t.label} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
                  <span className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                    <t.Icon size={16} className={t.color} /> {t.label}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{t.value}</span>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Salary Insights */}
        <motion.div variants={staggerItem}>
          <Panel title="Salary Insights">
            {salaryNums.length === 0 ? (
              <EmptyState icon={<TrendingUp size={22} />} title="No salary data yet" hint="Insights are calculated from posted job salaries." />
            ) : (
              <div>
                <p className="text-xs text-gray-500 mb-1">Range across posted roles</p>
                <p className="text-xl font-bold text-gray-900">
                  GMD {salaryMin.toLocaleString()} – GMD {salaryMax.toLocaleString()}
                </p>
                <p className="text-xs text-gray-400 mt-2">Based on {salaryNums.length} data points from live listings.</p>
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={staggerItem}>
          <Panel title="Quick Actions">
            <div className="grid grid-cols-2 gap-2.5">
              {quick.map((q) => (
                <Link key={q.label} href={q.href} className="flex flex-col gap-2 p-3 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors">
                  <q.Icon size={18} className="text-teal-600" />
                  <span className="text-xs font-semibold text-gray-800">{q.label}</span>
                </Link>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={staggerItem}>
          <Panel title="Recent Activity" action="View all" actionHref="/dashboard/jobs">
            {apps.length === 0 ? (
              <EmptyState icon={<Bell size={22} />} title="No activity yet" hint="Your applications and updates appear here." />
            ) : (
              <div className="space-y-3">
                {apps.slice(0, 4).map((a) => (
                  <div key={a.id} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <FileText size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        You applied to <span className="font-semibold">{a.jobTitle}</span>
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
