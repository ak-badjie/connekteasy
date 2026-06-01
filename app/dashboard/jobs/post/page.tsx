"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { createJob } from "@/app/lib/firestore";
import { categories } from "@/app/lib/data";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { CheckCircle } from "lucide-react";
import type { JobEmploymentType } from "@/app/lib/types";

const EMPLOYMENT_TYPES: { value: JobEmploymentType; label: string }[] = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export default function PostJobPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    category: "",
    employmentType: "full-time" as JobEmploymentType,
    location: "Remote",
    salary: "",
    skills: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;
    setLoading(true);
    try {
      const id = await createJob({
        title: formData.title,
        company: formData.company,
        description: formData.description,
        category: formData.category,
        employmentType: formData.employmentType,
        location: formData.location,
        salary: formData.salary,
        skills: formData.skills.split(",").map((s) => s.trim()).filter(Boolean),
        postedBy: user.uid,
        postedByName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
        postedByAvatar: `${(userProfile.firstName || "")[0] || ""}${(userProfile.lastName || "")[0] || ""}`.toUpperCase(),
        status: "open",
      });
      setSubmitted(true);
      setTimeout(() => router.push(`/dashboard/jobs/${id}`), 1200);
    } catch (err) {
      console.error("Failed to post job:", err);
      alert("Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-mustard-500/20 focus:border-mustard-500 transition-all";
  const labelClasses = "block text-sm font-medium text-gray-900 mb-1.5";
  const cardClasses = "bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6 sm:mb-8";

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
      <motion.div className="mb-6 sm:mb-8" variants={fadeInUp}>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Post a Job</h1>
        <p className="text-sm sm:text-base text-gray-500">Reach qualified candidates across The Gambia and beyond. Free to post, free to apply.</p>
      </motion.div>

      <AnimatePresence>
        {submitted && (
          <motion.div
            className="mb-4 sm:mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3"
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm sm:text-base font-semibold text-emerald-800">Job posted successfully!</p>
              <p className="text-xs sm:text-sm text-emerald-600">Redirecting to your job listing...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <motion.div className={cardClasses} variants={staggerItem}>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">Job Details</h2>

          <div className="mb-5 sm:mb-6">
            <label className={labelClasses}>Job Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Customer Service Specialist"
              className={inputClasses}
              required
            />
          </div>

          <div className="mb-5 sm:mb-6">
            <label className={labelClasses}>Company</label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Your company name"
              className={inputClasses}
              required
            />
          </div>

          <div className="mb-5 sm:mb-6">
            <label className={labelClasses}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={6}
              placeholder="Describe the role, responsibilities, and what you're looking for..."
              className={`${inputClasses} resize-none`}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-5 sm:mb-6">
            <div>
              <label className={labelClasses}>Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className={`${inputClasses} cursor-pointer`}
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleChange("employmentType", e.target.value)}
                className={`${inputClasses} cursor-pointer`}
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-5 sm:mb-6">
            <div>
              <label className={labelClasses}>Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder="Remote, Banjul, etc."
                className={inputClasses}
              />
            </div>
            <div>
              <label className={labelClasses}>Salary (optional)</label>
              <input
                type="text"
                value={formData.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
                placeholder="e.g. 8,000-12,000 GMD/month"
                className={inputClasses}
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Required Skills</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => handleChange("skills", e.target.value)}
              placeholder="e.g. Communication, Excel, Customer Service"
              className={inputClasses}
            />
            <p className="text-xs text-gray-500 mt-2">Separate skills with commas</p>
          </div>
        </motion.div>

        <motion.div variants={staggerItem}>
          <motion.button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-50"
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Posting..." : "Post Job"}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
