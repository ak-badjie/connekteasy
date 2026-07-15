"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createJob,
  getJobs,
  deleteJob,
} from "@/app/lib/firestore";
import { useAuth } from "@/app/lib/AuthContext";
import { categories } from "@/app/lib/data";
import type { Job, JobEmploymentType } from "@/app/lib/types";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Briefcase, GraduationCap, Sparkles, Trash2, Plus, ArrowRight, Building2, MapPin, DollarSign } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mustard-500 focus:border-mustard-500";

const TYPE_LABELS: Record<JobEmploymentType, string> = {
  "full-time": "Full-time Job",
  "part-time": "Part-time Job",
  contract: "Contract Job",
  internship: "Internship",
  opportunity: "Opportunity",
  "pr-opportunity": "PR Opportunity",
};

export default function AdminJobsPage() {
  const { user, userProfile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "jobs" | "internships" | "opportunities">("all");

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "Remote",
    employmentType: "full-time" as JobEmploymentType,
    salary: "",
    category: "Admin Support",
    skills: "",
    description: "",
  });

  const refresh = async () => {
    try {
      const data = await getJobs();
      setJobs(data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !form.description) return;
    setBusy(true);
    try {
      const skillsArray = form.skills
        ? form.skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      await createJob({
        title: form.title,
        company: form.company,
        description: form.description,
        location: form.location,
        employmentType: form.employmentType,
        salary: form.salary || "Unspecified",
        category: form.category,
        skills: skillsArray,
        postedBy: user?.uid || "admin",
        postedByName: userProfile?.displayName || "CONNEKT Admin",
        postedByAvatar: userProfile?.displayName ? userProfile.displayName.substring(0, 2).toUpperCase() : "AD",
        status: "open",
      });

      setForm({
        title: "",
        company: "",
        location: "Remote",
        employmentType: "full-time",
        salary: "",
        category: "Admin Support",
        skills: "",
        description: "",
      });

      await refresh();
    } catch (err) {
      console.error("Failed to create job:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this posting?")) return;
    try {
      await deleteJob(id);
      setJobs((prev) => p.filter((x) => x.id !== id));
      await refresh();
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "all") return true;
    if (activeTab === "jobs") {
      return ["full-time", "part-time", "contract"].includes(job.employmentType);
    }
    if (activeTab === "internships") {
      return job.employmentType === "internship";
    }
    if (activeTab === "opportunities") {
      return ["opportunity", "pr-opportunity"].includes(job.employmentType);
    }
    return true;
  });

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Manage Jobs & Opportunities</h1>
        <p className="text-sm text-gray-500 mt-1">Post and curate open jobs, internships, and PR opportunities across the platform.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Create a Job/Internship/Opportunity */}
        <motion.div variants={staggerItem} className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 h-fit">
          <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Plus size={18} className="text-mustard-600" /> Post New Opportunity
          </h2>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Opportunity Title</label>
              <input className={inputCls} placeholder="e.g. PR Specialist or Junior Accountant" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Company</label>
                <input className={inputCls} placeholder="e.g. Connekt Co" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Location</label>
                <input className={inputCls} placeholder="e.g. Remote or Banjul" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Opportunity Type</label>
                <select className={inputCls} value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value as JobEmploymentType })}>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Salary / Budget (GMD)</label>
                <input className={inputCls} placeholder="e.g. D15,000/mo or D500/hr" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
                <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Required Skills (Comma separated)</label>
              <input className={inputCls} placeholder="e.g. Public Relations, Copywriting, Canva" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
              <textarea className={`${inputCls} resize-none`} rows={4} placeholder="Describe the responsibilities and key requirements..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>

            <button type="submit" disabled={busy} className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-bold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 disabled:opacity-50 transition-colors shadow-sm">
              <Plus size={16} /> Post Opportunity
            </button>
          </form>
        </motion.div>

        {/* Right Section: Active Listings */}
        <motion.div variants={staggerItem} className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 flex flex-col min-h-[500px]">
          {/* Tabs */}
          <div className="flex border-b border-gray-100 pb-3 mb-4 gap-1 overflow-x-auto no-scrollbar">
            {(["all", "jobs", "internships", "opportunities"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full capitalize whitespace-nowrap transition-colors ${
                  activeTab === tab
                    ? "bg-mustard-50 text-mustard-700"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {tab === "all" ? "All Listings" : tab === "jobs" ? "Jobs" : tab === "internships" ? "Internships" : "Opportunities & PR"}
              </button>
            ))}
          </div>

          {/* Job listings list */}
          <div className="flex-1 space-y-3">
            {filteredJobs.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Briefcase size={36} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No postings found under this category.</p>
              </div>
            )}
            <AnimatePresence>
              {filteredJobs.map((job) => (
                <motion.div
                  key={job.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-mustard-200 hover:shadow-sm bg-gray-50/50 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-[9px] font-semibold rounded-full ${
                        job.employmentType === "internship"
                          ? "bg-purple-50 text-purple-700"
                          : ["opportunity", "pr-opportunity"].includes(job.employmentType)
                            ? "bg-blue-50 text-blue-700"
                            : "bg-teal-50 text-teal-700"
                      }`}>
                        {TYPE_LABELS[job.employmentType] || job.employmentType}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {job.createdAt?.toDate ? new Date(job.createdAt.toDate()).toLocaleDateString() : "Just now"}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 truncate">{job.title}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1"><Building2 size={12} className="text-gray-400" />{job.company}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-gray-400" />{job.location}</span>
                      <span className="flex items-center gap-1"><DollarSign size={12} className="text-gray-400" />{job.salary}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button onClick={() => handleDelete(job.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete posting">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
