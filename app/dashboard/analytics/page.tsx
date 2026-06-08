"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getEarningsSummary,
  getProposalsByUser,
  getProjectsByHiredVa,
  getJobsByEmployer,
  getApplicationsByJob,
  type EarningsSummary,
} from "@/app/lib/firestore";
import type { JobApplication } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { StatCard, Panel, formatGMD } from "@/app/dashboard/_components/kit";
import { Wallet, Briefcase, Send, CheckCircle2, Users, FileText, Star, TrendingUp } from "lucide-react";

function MonthBars({ data, color }: { data: { label: string; amount: number }[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-2 h-40 pt-2">
      {data.map((m) => (
        <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full bg-gray-100 rounded-md flex items-end h-full">
            <div className={`w-full rounded-md ${color}`} style={{ height: `${(m.amount / max) * 100}%` }} />
          </div>
          <span className="text-[10px] text-gray-400">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role;
  const isEmployer = role === "client";

  const [earnings, setEarnings] = useState<EarningsSummary>({ total: 0, monthly: [] });
  const [proposals, setProposals] = useState({ total: 0, accepted: 0 });
  const [hired, setHired] = useState(0);
  const [empApps, setEmpApps] = useState<JobApplication[]>([]);
  const [activeJobs, setActiveJobs] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      if (isEmployer) {
        const jobs = await getJobsByEmployer(user.uid).catch(() => []);
        if (cancelled) return;
        setActiveJobs(jobs.filter((j) => j.status === "open").length);
        const arrays = await Promise.all(jobs.map((j) => getApplicationsByJob(j.id).catch(() => [])));
        if (cancelled) return;
        setEmpApps(arrays.flat());
      } else {
        const [e, p, h] = await Promise.allSettled([
          getEarningsSummary(user.uid),
          getProposalsByUser(user.uid),
          getProjectsByHiredVa(user.uid),
        ]);
        if (cancelled) return;
        if (e.status === "fulfilled") setEarnings(e.value);
        if (p.status === "fulfilled") setProposals({ total: p.value.length, accepted: p.value.filter((x) => x.status === "accepted").length });
        if (h.status === "fulfilled") setHired(h.value.length);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, isEmployer]);

  // Employer monthly applications
  const now = new Date();
  const empMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleString("en-GB", { month: "short" }), amount: 0 };
  });
  empApps.forEach((a) => {
    const t = a.createdAt?.toMillis?.();
    if (!t) return;
    const d = new Date(t);
    const ago = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (ago >= 0 && ago <= 5) empMonths[5 - ago].amount += 1;
  });

  const v = (n: number | string) => (loading ? "…" : n);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-5xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">{isEmployer ? "Your hiring performance at a glance." : "Your freelance performance at a glance."}</p>
      </motion.div>

      {isEmployer ? (
        <>
          <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<Briefcase size={20} />} value={v(activeJobs)} label="Active Jobs" accent="teal" />
            <StatCard icon={<Users size={20} />} value={v(empApps.length)} label="Total Applicants" accent="indigo" />
            <StatCard icon={<Star size={20} />} value={v(empApps.filter((a) => a.status === "shortlisted").length)} label="Shortlisted" accent="emerald" />
            <StatCard icon={<FileText size={20} />} value={v(empApps.filter((a) => a.status === "reviewed").length)} label="In Review" accent="mustard" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <Panel title="Applications over time">
              <MonthBars data={empMonths} color="bg-mustard-500" />
            </Panel>
          </motion.div>
        </>
      ) : (
        <>
          <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={<Wallet size={20} />} value={loading ? "…" : formatGMD(earnings.total)} label="Total Earnings" accent="emerald" />
            <StatCard icon={<Briefcase size={20} />} value={v(hired)} label="Projects" accent="teal" />
            <StatCard icon={<Send size={20} />} value={v(proposals.total)} label="Proposals Sent" accent="indigo" />
            <StatCard icon={<CheckCircle2 size={20} />} value={v(proposals.accepted)} label="Accepted" accent="mustard" />
          </motion.div>
          <motion.div variants={staggerItem}>
            <Panel title="Earnings over time">
              {earnings.total === 0 ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-8 justify-center">
                  <TrendingUp size={18} /> No earnings recorded yet.
                </div>
              ) : (
                <MonthBars data={earnings.monthly} color="bg-teal-600" />
              )}
            </Panel>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
