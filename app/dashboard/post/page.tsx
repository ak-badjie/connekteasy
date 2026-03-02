"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "@/app/lib/data";
import { CheckCircle } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

export default function PostProjectPage() {
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

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Header */}
            <motion.div className="mb-6 sm:mb-8" variants={fadeInUp}>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Post a Project</h1>
                <p className="text-sm sm:text-base text-gray-500">Describe your project and find the right virtual assistant.</p>
            </motion.div>

            {/* Success Banner */}
            <AnimatePresence>
                {submitted && (
                    <motion.div
                        className="mb-4 sm:mb-6 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 sm:gap-3"
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <CheckCircle size={18} className="text-emerald-600 shrink-0 sm:w-5 sm:h-5" />
                        <div>
                            <p className="text-xs sm:text-sm font-semibold text-emerald-800">Project posted successfully!</p>
                            <p className="text-[10px] sm:text-xs text-emerald-600">Your project is now live and visible to virtual assistants.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
                {/* Project Details */}
                <motion.div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6" variants={staggerItem}>
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4 sm:mb-5">Project Details</h2>

                    <div className="mb-4 sm:mb-5">
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Project Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="e.g. Virtual Assistant for E-commerce Store Management"
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                            required
                        />
                    </div>

                    <div className="mb-4 sm:mb-5">
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            rows={5}
                            placeholder="Describe the project scope, responsibilities, and requirements in detail..."
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 resize-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                        <div>
                            <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => handleChange("category", e.target.value)}
                                className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 cursor-pointer"
                                required
                            >
                                <option value="">Select a category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.name}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Duration</label>
                            <select
                                value={formData.duration}
                                onChange={(e) => handleChange("duration", e.target.value)}
                                className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 cursor-pointer"
                                required
                            >
                                <option value="">Select duration</option>
                                <option value="less-than-1-month">Less than 1 month</option>
                                <option value="1-3-months">1-3 months</option>
                                <option value="3-6-months">3-6 months</option>
                                <option value="6-plus-months">6+ months</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Required Skills</label>
                        <input
                            type="text"
                            value={formData.skills}
                            onChange={(e) => handleChange("skills", e.target.value)}
                            placeholder="e.g. Shopify, Customer Service, Data Entry"
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Separate skills with commas</p>
                    </div>
                </motion.div>

                {/* Budget */}
                <motion.div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6" variants={staggerItem}>
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4 sm:mb-5">Budget</h2>

                    {/* Budget Type Toggle */}
                    <div className="flex gap-2 mb-4 sm:mb-5">
                        {["fixed", "hourly"].map((type) => (
                            <motion.button
                                key={type}
                                type="button"
                                onClick={() => handleChange("budgetType", type)}
                                className={`px-3.5 sm:px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${formData.budgetType === type
                                        ? "bg-teal-50 text-teal-700 border-teal-300"
                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                    }`}
                                whileTap={{ scale: 0.95 }}
                            >
                                {type === "fixed" ? "Fixed Price" : "Hourly Rate"}
                            </motion.button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                            <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">
                                {formData.budgetType === "fixed" ? "Min Budget (USD)" : "Min Rate (USD/hr)"}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={formData.budgetMin}
                                    onChange={(e) => handleChange("budgetMin", e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-7 pr-3 sm:pr-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">
                                {formData.budgetType === "fixed" ? "Max Budget (USD)" : "Max Rate (USD/hr)"}
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                                <input
                                    type="number"
                                    value={formData.budgetMax}
                                    onChange={(e) => handleChange("budgetMax", e.target.value)}
                                    placeholder="0"
                                    className="w-full pl-7 pr-3 sm:pr-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Submit */}
                <motion.div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3" variants={staggerItem}>
                    <motion.button
                        type="submit"
                        className="px-8 py-3 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
                        whileTap={{ scale: 0.97 }}
                    >
                        Post Project
                    </motion.button>
                    <motion.button
                        type="button"
                        className="px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        whileTap={{ scale: 0.97 }}
                    >
                        Save as Draft
                    </motion.button>
                </motion.div>
            </form>
        </motion.div>
    );
}
