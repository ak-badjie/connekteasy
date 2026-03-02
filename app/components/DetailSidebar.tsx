"use client";

import { Project } from "@/app/lib/data";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { slideInRight, backdropFade } from "@/app/lib/animations";

interface DetailSidebarProps {
    project: Project | null;
    isOpen: boolean;
    onClose: () => void;
}

export default function DetailSidebar({ project, isOpen, onClose }: DetailSidebarProps) {
    // Lock body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Close on ESC
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    if (!project) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px]"
                        variants={backdropFade}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    {/* Sidebar Panel — full width on mobile, 520px on desktop */}
                    <motion.div
                        className="fixed top-0 right-0 z-50 h-full w-full sm:w-[520px] bg-white shadow-2xl"
                        variants={slideInRight}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
                            <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Details</h2>
                            <motion.button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close"
                                whileTap={{ scale: 0.9 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto h-[calc(100%-57px)] sm:h-[calc(100%-73px)] px-4 sm:px-6 py-5 sm:py-6">
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15, duration: 0.3 }}
                            >
                                {/* Status */}
                                <span
                                    className={`inline-block px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full mb-3 sm:mb-4 ${project.status === "open"
                                            ? "bg-emerald-50 text-emerald-700"
                                            : "bg-amber-50 text-amber-700"
                                        }`}
                                >
                                    {project.status === "open" ? "Open" : "In Progress"}
                                </span>

                                {/* Title */}
                                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-2">{project.title}</h1>

                                {/* Meta */}
                                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
                                    <span>Posted {project.postedAt}</span>
                                    <span>•</span>
                                    <span>{project.applicants} applicants</span>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
                                    {[
                                        { label: "Budget", value: project.budget },
                                        { label: "Duration", value: project.duration },
                                        { label: "Location", value: project.location },
                                    ].map((stat) => (
                                        <div key={stat.label} className="bg-gray-50 rounded-xl p-3 sm:p-3.5 text-center">
                                            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{stat.label}</p>
                                            <p className="text-xs sm:text-sm font-bold text-gray-900">{stat.value}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* Description */}
                                <div className="mb-5 sm:mb-6">
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Description</h3>
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{project.description}</p>
                                </div>

                                {/* Skills & Tags */}
                                <div className="mb-5 sm:mb-6">
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Skills Required</h3>
                                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                        {project.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-teal-50 text-teal-700 rounded-full"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="mb-5 sm:mb-6">
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Category</h3>
                                    <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                                        {project.category}
                                    </span>
                                </div>

                                {/* Posted By */}
                                <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 bg-gray-50 rounded-xl">
                                    <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Posted By</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs sm:text-sm font-bold">
                                            {project.postedByAvatar}
                                        </div>
                                        <div>
                                            <p className="text-xs sm:text-sm font-semibold text-gray-900">{project.postedBy}</p>
                                            <p className="text-[10px] sm:text-xs text-gray-500">Business Owner</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* CTA */}
                            <motion.div
                                className="sticky bottom-0 bg-white pt-3 sm:pt-4 pb-2 border-t border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-auto"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25, duration: 0.3 }}
                            >
                                <motion.button
                                    className="w-full py-3 sm:py-3.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors shadow-sm"
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Apply to This Project
                                </motion.button>
                                <motion.button
                                    className="w-full py-2.5 sm:py-3 mt-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                                    whileTap={{ scale: 0.97 }}
                                >
                                    Save for Later
                                </motion.button>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
