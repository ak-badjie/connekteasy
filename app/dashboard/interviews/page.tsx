"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/app/lib/AuthContext";
import { createInterview, getInterviewsByEmployer, updateInterviewStatus } from "@/app/lib/firestore";
import { useRoleGuard } from "@/app/lib/useRoleGuard";
import type { Interview } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState, Avatar } from "@/app/dashboard/_components/kit";
import { CalendarClock, Plus, X, Check, Ban } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500";

function fmt(ms: number) {
  return new Date(ms).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function InterviewsPage() {
  const { allowed, checking } = useRoleGuard((c) => c.postJobs);
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ candidateName: "", jobTitle: "", mode: "Video call", scheduledAt: "" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getInterviewsByEmployer(user.uid)
      .then((i) => !cancelled && setInterviews(i))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const schedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.candidateName || !form.scheduledAt) return;
    setBusy(true);
    try {
      await createInterview({
        employerId: user.uid,
        candidateId: "",
        candidateName: form.candidateName,
        candidateAvatar: "",
        jobTitle: form.jobTitle,
        mode: form.mode,
        scheduledAt: Timestamp.fromDate(new Date(form.scheduledAt)),
        status: "scheduled",
      });
      setForm({ candidateName: "", jobTitle: "", mode: "Video call", scheduledAt: "" });
      setOpen(false);
      const fresh = await getInterviewsByEmployer(user.uid);
      setInterviews(fresh);
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: Interview["status"]) => {
    await updateInterviewStatus(id, status);
    setInterviews((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
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
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Interviews</h1>
          <p className="text-sm text-gray-500 mt-1">Schedule and track candidate interviews.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shrink-0">
          <Plus size={16} /> Schedule Interview
        </button>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : interviews.length === 0 ? (
            <EmptyState icon={<CalendarClock size={22} />} title="No interviews scheduled" hint="Schedule one to see it here." />
          ) : (
            <div className="space-y-3">
              {interviews.map((i) => (
                <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <Avatar name={i.candidateName} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{i.candidateName}</p>
                    <p className="text-xs text-gray-500 truncate">{i.jobTitle || "Interview"} · {i.mode}</p>
                    <p className="text-[11px] text-gray-400">{i.scheduledAt?.toMillis ? fmt(i.scheduledAt.toMillis()) : ""}</p>
                  </div>
                  {i.status === "scheduled" ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => setStatus(i.id, "completed")} title="Mark completed" className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                        <Check size={15} />
                      </button>
                      <button onClick={() => setStatus(i.id, "cancelled")} title="Cancel" className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <Ban size={15} />
                      </button>
                    </div>
                  ) : (
                    <span className={`shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full capitalize ${i.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
                      {i.status}
                    </span>
                  )}
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
                <h2 className="font-display text-lg font-bold text-gray-900">Schedule Interview</h2>
                <button onClick={() => setOpen(false)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-full"><X size={18} /></button>
              </div>
              <form onSubmit={schedule} className="p-5 space-y-3">
                <input className={inputCls} placeholder="Candidate name" value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} required />
                <input className={inputCls} placeholder="Role / job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <select className={inputCls} value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
                    {["Video call", "Phone", "In person"].map((m) => <option key={m}>{m}</option>)}
                  </select>
                  <input className={inputCls} type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
                </div>
                <button type="submit" disabled={busy} className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors">
                  {busy ? "Scheduling…" : "Schedule"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
