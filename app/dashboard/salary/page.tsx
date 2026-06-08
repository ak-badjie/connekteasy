"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getJobs } from "@/app/lib/firestore";
import type { Job } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { StatCard, Panel, EmptyState, formatGMD } from "@/app/dashboard/_components/kit";
import { TrendingUp, ArrowDownWideNarrow, ArrowUpWideNarrow, Calculator } from "lucide-react";

function nums(salary: string): number[] {
  return (salary.match(/[\d,]{3,}/g) || []).map((n) => parseInt(n.replace(/,/g, ""), 10)).filter((n) => !isNaN(n) && n > 0);
}

export default function SalaryInsightsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getJobs()
      .then((j) => !cancelled && setJobs(j.filter((x) => x.employmentType !== "internship")))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const all = jobs.flatMap((j) => nums(j.salary || ""));
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 0;
  const avg = all.length ? Math.round(all.reduce((s, n) => s + n, 0) / all.length) : 0;

  // Per-category averages
  const byCat: Record<string, number[]> = {};
  jobs.forEach((j) => {
    const ns = nums(j.salary || "");
    if (ns.length) {
      const cat = j.category || "Other";
      byCat[cat] = (byCat[cat] || []).concat(ns);
    }
  });
  const catRows = Object.entries(byCat)
    .map(([cat, ns]) => ({ cat, avg: Math.round(ns.reduce((s, n) => s + n, 0) / ns.length) }))
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 6);
  const catMax = Math.max(1, ...catRows.map((r) => r.avg));

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Salary Insights</h1>
        <p className="text-sm text-gray-500 mt-1">Live ranges calculated from salaries on currently posted roles.</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : all.length === 0 ? (
        <Panel>
          <EmptyState icon={<TrendingUp size={22} />} title="No salary data yet" hint="Insights appear once employers post roles with salary ranges." />
        </Panel>
      ) : (
        <>
          <motion.div variants={staggerItem} className="grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard icon={<ArrowDownWideNarrow size={20} />} value={formatGMD(min)} label="Lowest" accent="blue" />
            <StatCard icon={<TrendingUp size={20} />} value={formatGMD(avg)} label="Average" accent="teal" />
            <StatCard icon={<ArrowUpWideNarrow size={20} />} value={formatGMD(max)} label="Highest" accent="emerald" />
          </motion.div>

          <motion.div variants={staggerItem}>
            <Panel title="Average by category">
              <div className="space-y-3">
                {catRows.map((r) => (
                  <div key={r.cat}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600 truncate">{r.cat}</span>
                      <span className="text-xs font-bold text-gray-900">{formatGMD(r.avg)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-teal-600" style={{ width: `${(r.avg / catMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Panel>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calculator size={18} className="text-teal-600" />
                Based on <strong className="text-gray-900">{all.length}</strong> salary data points from{" "}
                <strong className="text-gray-900">{jobs.length}</strong> live listings.
              </div>
            </Panel>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
