"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

export default function ProfilePage() {
    const [formData, setFormData] = useState({
        firstName: "Alex",
        lastName: "Johnson",
        title: "Virtual Assistant",
        bio: "Experienced virtual assistant specializing in admin support, social media management, and customer service. Over 3 years of experience working with small businesses and startups.",
        hourlyRate: "20",
        skills: "Admin Support, Social Media, Customer Service, Data Entry, Email Management",
        location: "Remote",
        website: "",
        linkedin: "",
    });

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Header */}
            <motion.div className="mb-6 sm:mb-8" variants={fadeInUp}>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Profile</h1>
                <p className="text-sm sm:text-base text-gray-500">Manage your public profile and how clients see you.</p>
            </motion.div>

            {/* Avatar Section */}
            <motion.div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6" variants={staggerItem}>
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-5 text-center sm:text-left">
                    <motion.div
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0"
                        whileHover={{ scale: 1.05 }}
                    >
                        AJ
                    </motion.div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">Profile Photo</h3>
                        <p className="text-[11px] sm:text-xs text-gray-500 mb-3">JPG, PNG, or GIF. Max size 5MB.</p>
                        <div className="flex gap-2 justify-center sm:justify-start">
                            <motion.button
                                className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
                                whileTap={{ scale: 0.95 }}
                            >
                                Upload Photo
                            </motion.button>
                            <motion.button
                                className="px-3 sm:px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                whileTap={{ scale: 0.95 }}
                            >
                                Remove
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Form */}
            <motion.div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6" variants={staggerItem}>
                <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4 sm:mb-5">Personal Information</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5 sm:mb-6">
                    <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">First Name</label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleChange("firstName", e.target.value)}
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Last Name</label>
                        <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleChange("lastName", e.target.value)}
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="mb-4 sm:mb-5">
                    <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Professional Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange("title", e.target.value)}
                        placeholder="e.g. Virtual Assistant, Social Media Manager"
                        className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                    />
                </div>

                <div className="mb-4 sm:mb-5">
                    <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Bio</label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => handleChange("bio", e.target.value)}
                        rows={4}
                        placeholder="Tell clients about yourself, your experience, and what you specialize in..."
                        className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 resize-none"
                    />
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">{formData.bio.length}/500 characters</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-4 sm:mb-5">
                    <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Hourly Rate (USD)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
                            <input
                                type="number"
                                value={formData.hourlyRate}
                                onChange={(e) => handleChange("hourlyRate", e.target.value)}
                                className="w-full pl-7 pr-3 sm:pr-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Location</label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => handleChange("location", e.target.value)}
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>
                </div>

                <div className="mb-5 sm:mb-6">
                    <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Skills</label>
                    <input
                        type="text"
                        value={formData.skills}
                        onChange={(e) => handleChange("skills", e.target.value)}
                        placeholder="Separate skills with commas"
                        className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                    />
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Separate skills with commas</p>
                </div>

                <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-4 sm:mb-5 pt-4 border-t border-gray-100">Links</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-6 sm:mb-8">
                    <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={(e) => handleChange("website", e.target.value)}
                            placeholder="https://yourwebsite.com"
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] sm:text-xs font-medium text-gray-700 mb-1 sm:mb-1.5">LinkedIn</label>
                        <input
                            type="url"
                            value={formData.linkedin}
                            onChange={(e) => handleChange("linkedin", e.target.value)}
                            placeholder="https://linkedin.com/in/yourprofile"
                            className="w-full px-3 sm:px-3.5 py-2 sm:py-2.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Save */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                    <motion.button
                        className="px-6 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors"
                        whileTap={{ scale: 0.97 }}
                    >
                        Save Changes
                    </motion.button>
                    <motion.button
                        className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        whileTap={{ scale: 0.97 }}
                    >
                        Cancel
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
}
