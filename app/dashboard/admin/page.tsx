"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/app/lib/AuthContext";
import { isAdmin } from "@/app/lib/admin";
import {
  createEvent,
  getAllEvents,
  deleteEvent,
  createCourse,
  getAllCourses,
  deleteCourse,
} from "@/app/lib/firestore";
import type { PlatformEvent, Course } from "@/app/lib/types";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Calendar, BookOpen, Trash2, Plus, ShieldAlert } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function AdminContentPage() {
  const router = useRouter();
  const { userProfile, loading } = useAuth();
  const admin = isAdmin(userProfile);

  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [busy, setBusy] = useState(false);

  // Event form
  const [ev, setEv] = useState({ title: "", type: "Workshop", date: "", description: "" });
  // Course form
  const [co, setCo] = useState({ title: "", category: "", level: "Beginner", durationLabel: "" });

  useEffect(() => {
    if (loading) return;
    if (!admin) {
      router.replace("/dashboard");
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, admin]);

  const refresh = async () => {
    const [e, c] = await Promise.allSettled([getAllEvents(), getAllCourses()]);
    if (e.status === "fulfilled") setEvents(e.value);
    if (c.status === "fulfilled") setCourses(c.value);
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ev.title || !ev.date) return;
    setBusy(true);
    try {
      await createEvent({
        title: ev.title,
        type: ev.type,
        date: Timestamp.fromDate(new Date(ev.date)),
        description: ev.description,
      });
      setEv({ title: "", type: "Workshop", date: "", description: "" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const addCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!co.title || !co.category) return;
    setBusy(true);
    try {
      await createCourse({
        title: co.title,
        category: co.category,
        level: co.level,
        durationLabel: co.durationLabel,
      });
      setCo({ title: "", category: "", level: "Beginner", durationLabel: "" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const removeEvent = async (id: string) => {
    await deleteEvent(id);
    setEvents((p) => p.filter((x) => x.id !== id));
  };
  const removeCourse = async (id: string) => {
    await deleteCourse(id);
    setCourses((p) => p.filter((x) => x.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="max-w-md mx-auto text-center py-24">
        <ShieldAlert size={40} className="text-gray-300 mx-auto mb-3" />
        <h1 className="text-lg font-bold text-gray-900 mb-1">Admins only</h1>
        <p className="text-sm text-gray-500">You don&apos;t have access to this page.</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-5xl mx-auto space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Content Manager</h1>
        <p className="text-sm text-gray-500 mt-1">Publish platform events and learning courses. These appear on student & seeker dashboards.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events */}
        <motion.div variants={staggerItem} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Calendar size={18} className="text-teal-600" /> Events
          </h2>
          <form onSubmit={addEvent} className="space-y-3 mb-5">
            <input className={inputCls} placeholder="Event title" value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <select className={inputCls} value={ev.type} onChange={(e) => setEv({ ...ev, type: e.target.value })}>
                {["Workshop", "Masterclass", "Career Fair", "Bootcamp", "Webinar"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              <input className={inputCls} type="datetime-local" value={ev.date} onChange={(e) => setEv({ ...ev, date: e.target.value })} required />
            </div>
            <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Short description (optional)" value={ev.description} onChange={(e) => setEv({ ...ev, description: e.target.value })} />
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors">
              <Plus size={15} /> Add Event
            </button>
          </form>
          <div className="space-y-2">
            {events.length === 0 && <p className="text-sm text-gray-400">No events yet.</p>}
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
                  <p className="text-xs text-gray-500">{e.type} · {e.date?.toMillis ? new Date(e.date.toMillis()).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : ""}</p>
                </div>
                <button onClick={() => removeEvent(e.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Courses */}
        <motion.div variants={staggerItem} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
            <BookOpen size={18} className="text-mustard-600" /> Learning Courses
          </h2>
          <form onSubmit={addCourse} className="space-y-3 mb-5">
            <input className={inputCls} placeholder="Course title" value={co.title} onChange={(e) => setCo({ ...co, title: e.target.value })} required />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Category" value={co.category} onChange={(e) => setCo({ ...co, category: e.target.value })} required />
              <select className={inputCls} value={co.level} onChange={(e) => setCo({ ...co, level: e.target.value })}>
                {["Beginner", "Intermediate", "Advanced"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <input className={inputCls} placeholder="Duration (e.g. 4 weeks)" value={co.durationLabel} onChange={(e) => setCo({ ...co, durationLabel: e.target.value })} />
            <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 disabled:opacity-50 transition-colors">
              <Plus size={15} /> Add Course
            </button>
          </form>
          <div className="space-y-2">
            {courses.length === 0 && <p className="text-sm text-gray-400">No courses yet.</p>}
            {courses.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.title}</p>
                  <p className="text-xs text-gray-500">{c.category}{c.level ? ` · ${c.level}` : ""}{c.durationLabel ? ` · ${c.durationLabel}` : ""}</p>
                </div>
                <button onClick={() => removeCourse(c.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
