"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getProjectsByHiredVa } from "@/app/lib/firestore";
import type { FirestoreProject } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { StatCard, Panel, EmptyState, formatGMD } from "@/app/dashboard/_components/kit";
import { Briefcase, CheckCircle2, Loader, MessageSquare } from "lucide-react";

export default function MyWorkPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProjectsByHiredVa(user.uid)
      .then((p) => !cancelled && setProjects(p))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const active = projects.filter((p) => p.status === "in-progress").length;
  const completed = projects.filter((p) => p.status === "closed").length;
  const earned = projects.reduce((s, p) => s + (p.vaPayout || 0), 0);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">My Projects</h1>
        <p className="text-sm text-gray-500 mt-1">Projects you&apos;ve been hired on.</p>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard icon={<Loader size={20} />} value={loading ? "…" : active} label="Active" accent="teal" />
        <StatCard icon={<CheckCircle2 size={20} />} value={completed} label="Completed" accent="emerald" />
        <StatCard icon={<Briefcase size={20} />} value={formatGMD(earned)} label="Earned" accent="mustard" />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : projects.length === 0 ? (
            <EmptyState icon={<Briefcase size={22} />} title="No projects yet" hint="When a client hires you, the project appears here." />
          ) : (
            <div className="divide-y divide-gray-50">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Briefcase size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500 truncate">{p.ownerName} · {p.budget}</p>
                  </div>
                  <span className={`shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full ${
                    p.status === "closed" ? "bg-gray-100 text-gray-500" : "bg-emerald-50 text-emerald-600"
                  }`}>
                    {p.status === "closed" ? "Completed" : "In progress"}
                  </span>
                  <Link href="/dashboard/messages" className="shrink-0 p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                    <MessageSquare size={16} />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
