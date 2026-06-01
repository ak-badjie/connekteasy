"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { createProject } from "@/app/lib/firestore";
import { escrowHold } from "@/app/lib/payment";
import { categories } from "@/app/lib/data";
import { CheckCircle } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

export default function PostProjectPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budgetType: "fixed",
    budgetMin: "",
    budgetMax: "",
    duration: "",
    skills: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setLoading(true);
    try {
      const bMin = parseFloat(formData.budgetMin) || 0;
      const bMax = parseFloat(formData.budgetMax) || 0;

      if (bMax <= 0 || bMax < bMin) {
        alert("Invalid budget range. Max budget must be greater than zero and greater than or equal to min budget.");
        setLoading(false);
        return;
      }

      // Step 1: Hold Escrow
      try {
        await escrowHold({ amount: bMax });
      } catch (escrowErr: unknown) {
        const msg = escrowErr instanceof Error ? escrowErr.message : "Failed to hold escrow";
        alert(`Escrow Error: ${msg}. Please deposit funds into your wallet.`);
        setLoading(false);
        return;
      }

      const budgetStr =
        formData.budgetType === "hourly"
          ? `${formData.budgetMin}-${formData.budgetMax} GMD/hr`
          : `${formData.budgetMin}-${formData.budgetMax} GMD`;

      // Step 2: Create Project with Escrow Meta
      await createProject({
        title: formData.title,
        description: formData.description,
        budget: budgetStr,
        budgetMin: bMin,
        budgetMax: bMax,
        budgetType: formData.budgetType as "fixed" | "hourly",
        category: formData.category,
        tags: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        duration: formData.duration,
        location: "Remote",
        status: "open",
        ownerId: user.uid,
        ownerName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
        ownerAvatar: `${(userProfile.firstName || "")[0] || ""}${(userProfile.lastName || "")[0] || ""}`.toUpperCase(),
        escrowAmount: bMax,
        escrowStatus: "held",
      });

      setSubmitted(true);
      setFormData({
        title: "",
        description: "",
        category: "",
        budgetType: "fixed",
        budgetMin: "",
        budgetMax: "",
        duration: "",
        skills: "",
      });
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      console.error("Failed to post project:", err);
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
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Post a Project</h1>
        <p className="text-sm sm:text-base text-gray-500">Describe your project and find the right virtual assistant.</p>
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
              <p className="text-sm sm:text-base font-semibold text-emerald-800">Project posted successfully!</p>
              <p className="text-xs sm:text-sm text-emerald-600">Your project is now live and visible to virtual assistants.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit}>
        <motion.div className={cardClasses} variants={staggerItem}>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">Project Details</h2>
          
          <div className="mb-5 sm:mb-6">
            <label className={labelClasses}>Project Title</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => handleChange("title", e.target.value)} 
              placeholder="e.g. Virtual Assistant for E-commerce Store Management" 
              className={inputClasses} 
              required 
            />
          </div>
          
          <div className="mb-5 sm:mb-6">
            <label className={labelClasses}>Description</label>
            <textarea 
              value={formData.description} 
              onChange={(e) => handleChange("description", e.target.value)} 
              rows={5} 
              placeholder="Describe the project scope..." 
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
                {categories.map((cat) => (<option key={cat.id} value={cat.name}>{cat.name}</option>))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Duration</label>
              <select 
                value={formData.duration} 
                onChange={(e) => handleChange("duration", e.target.value)} 
                className={`${inputClasses} cursor-pointer`} 
                required
              >
                <option value="">Select duration</option>
                <option value="Less than 1 month">Less than 1 month</option>
                <option value="1-3 months">1-3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="6+ months">6+ months</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className={labelClasses}>Required Skills</label>
            <input 
              type="text" 
              value={formData.skills} 
              onChange={(e) => handleChange("skills", e.target.value)} 
              placeholder="e.g. Shopify, Customer Service, Data Entry" 
              className={inputClasses} 
            />
            <p className="text-xs text-gray-500 mt-2">Separate skills with commas</p>
          </div>
        </motion.div>

        <motion.div className={cardClasses} variants={staggerItem}>
          <h2 className="font-display text-lg sm:text-xl font-semibold text-gray-900 mb-5 sm:mb-6">Budget</h2>
          
          <div className="flex gap-3 mb-5 sm:mb-6">
            {["fixed", "hourly"].map((type) => (
              <motion.button 
                key={type} 
                type="button" 
                onClick={() => handleChange("budgetType", type)}
                className={`px-5 py-2.5 text-sm font-medium rounded-xl border transition-colors ${
                  formData.budgetType === type 
                    ? "bg-teal-50 text-mustard-700 border-teal-300" 
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {type === "fixed" ? "Fixed Price" : "Hourly Rate"}
              </motion.button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className={labelClasses}>
                {formData.budgetType === "fixed" ? "Min Budget (GMD)" : "Min Rate (GMD/hr)"}
              </label>
              <input 
                type="number" 
                value={formData.budgetMin} 
                onChange={(e) => handleChange("budgetMin", e.target.value)} 
                placeholder="0" 
                className={inputClasses} 
              />
            </div>
            <div>
              <label className={labelClasses}>
                {formData.budgetType === "fixed" ? "Max Budget (GMD)" : "Max Rate (GMD/hr)"}
              </label>
              <input 
                type="number" 
                value={formData.budgetMax} 
                onChange={(e) => handleChange("budgetMax", e.target.value)} 
                placeholder="0" 
                className={inputClasses} 
              />
            </div>
          </div>
        </motion.div>

        <motion.div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4" variants={staggerItem}>
          <motion.button 
            type="submit" 
            disabled={loading} 
            className="px-8 py-3.5 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-50" 
            whileTap={{ scale: 0.97 }}
          >
            {loading ? "Holding Escrow & Posting..." : "Post Project & Hold Escrow"}
          </motion.button>
        </motion.div>
      </form>
    </motion.div>
  );
}
