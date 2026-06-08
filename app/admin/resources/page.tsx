"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createResource, getResources, deleteResource } from "@/app/lib/firestore";
import type { Resource } from "@/app/lib/types";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { BookMarked, Trash2, Plus, ExternalLink } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ title: "", category: "CV & Cover Letters", description: "", url: "" });

  const refresh = async () => {
    const r = await getResources().catch(() => []);
    setResources(r);
  };

  useEffect(() => {
    refresh();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.url) return;
    setBusy(true);
    try {
      await createResource({ title: form.title, category: form.category, description: form.description, url: form.url });
      setForm({ title: "", category: "CV & Cover Letters", description: "", url: "" });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    await deleteResource(id);
    setResources((p) => p.filter((x) => x.id !== id));
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Career Resources</h1>
        <p className="text-sm text-gray-500 mt-1">Guides and links surfaced to job seekers under Career Resources.</p>
      </motion.div>

      <motion.div variants={staggerItem} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
          <BookMarked size={18} className="text-teal-600" /> Add a resource
        </h2>
        <form onSubmit={add} className="space-y-3">
          <input className={inputCls} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {["CV & Cover Letters", "Interview Prep", "Skills & Learning", "Job Search", "Career Growth"].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <input className={inputCls} type="url" placeholder="https://…" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
          </div>
          <textarea className={`${inputCls} resize-none`} rows={2} placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors">
            <Plus size={15} /> Add Resource
          </button>
        </form>
      </motion.div>

      <motion.div variants={staggerItem} className="space-y-2">
        {resources.length === 0 && <p className="text-sm text-gray-400">No resources yet.</p>}
        {resources.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
              <p className="text-xs text-gray-500 truncate">{r.category} · {r.description}</p>
            </div>
            <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
              <ExternalLink size={15} />
            </a>
            <button onClick={() => remove(r.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
