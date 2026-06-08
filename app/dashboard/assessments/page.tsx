"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { createAssessment, getAssessmentsByEmployer, deleteAssessment } from "@/app/lib/firestore";
import { useRoleGuard } from "@/app/lib/useRoleGuard";
import type { Assessment } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState } from "@/app/dashboard/_components/kit";
import { ClipboardList, Plus, X, Trash2 } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function AssessmentsPage() {
  const { allowed, checking } = useRoleGuard((c) => c.postJobs);
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", type: "Skills test", jobTitle: "", durationLabel: "" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAssessmentsByEmployer(user.uid)
      .then((a) => !cancelled && setAssessments(a))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.title) return;
    setBusy(true);
    try {
      await createAssessment({ employerId: user.uid, title: form.title, type: form.type, jobTitle: form.jobTitle, durationLabel: form.durationLabel });
      setForm({ title: "", type: "Skills test", jobTitle: "", durationLabel: "" });
      setOpen(false);
      const fresh = await getAssessmentsByEmployer(user.uid);
      setAssessments(fresh);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await deleteAssessment(id);
    setAssessments((p) => p.filter((x) => x.id !== id));
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Assessments</h1>
          <p className="text-sm text-gray-500 mt-1">Create assessments to evaluate candidates.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shrink-0">
          <Plus size={16} /> Create Assessment
        </button>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : assessments.length === 0 ? (
            <EmptyState icon={<ClipboardList size={22} />} title="No assessments yet" hint="Create one to start screening candidates." />
          ) : (
            <div className="space-y-2">
              {assessments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <ClipboardList size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.title}</p>
                    <p className="text-xs text-gray-500 truncate">{a.type}{a.jobTitle ? ` · ${a.jobTitle}` : ""}{a.durationLabel ? ` · ${a.durationLabel}` : ""}</p>
                  </div>
                  <button onClick={() => remove(a.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="font-display text-lg font-bold text-gray-900">Create Assessment</h2>
                <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full"><X size={18} /></button>
              </div>
              <form onSubmit={create} className="p-5 space-y-3">
                <input className={inputCls} placeholder="Assessment title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {["Skills test", "Coding", "Personality", "Aptitude", "Case study"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input className={inputCls} placeholder="Duration (e.g. 30 min)" value={form.durationLabel} onChange={(e) => setForm({ ...form, durationLabel: e.target.value })} />
                </div>
                <input className={inputCls} placeholder="For role (optional)" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                <button type="submit" disabled={busy} className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors">
                  {busy ? "Creating…" : "Create"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
