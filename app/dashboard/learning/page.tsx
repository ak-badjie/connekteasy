"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getCourses, updateUserProfile } from "@/app/lib/firestore";
import type { Course } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState, Bar } from "@/app/dashboard/_components/kit";
import { BookOpen, Play } from "lucide-react";

export default function LearningHubPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const progress = userProfile?.courseProgress ?? {};

  useEffect(() => {
    let cancelled = false;
    getCourses(24)
      .then((c) => !cancelled && setCourses(c))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const advance = async (courseId: string) => {
    if (!user) return;
    const current = progress[courseId] ?? 0;
    const next = Math.min(100, current + 25);
    setSavingId(courseId);
    try {
      await updateUserProfile(user.uid, { courseProgress: { ...progress, [courseId]: next } });
      await refreshProfile();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-5xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Learning Hub</h1>
        <p className="text-sm text-gray-500 mt-1">Build job-ready skills. Track your progress as you go.</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : courses.length === 0 ? (
        <Panel>
          <EmptyState icon={<BookOpen size={22} />} title="No courses yet" hint="Learning tracks will appear here once published by the team." />
        </Panel>
      ) : (
        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((c) => {
            const p = progress[c.id] ?? 0;
            const done = p >= 100;
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-mustard-50 text-mustard-600 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{c.title}</h3>
                    <p className="text-xs text-gray-500">{c.category}{c.level ? ` · ${c.level}` : ""}{c.durationLabel ? ` · ${c.durationLabel}` : ""}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-semibold text-gray-700">{p}%</span>
                </div>
                <Bar value={p} color="bg-mustard-500" />
                <button
                  onClick={() => advance(c.id)}
                  disabled={done || savingId === c.id}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 transition-colors"
                >
                  <Play size={13} /> {done ? "Completed" : p > 0 ? "Continue" : "Start"}
                </button>
              </div>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
}
