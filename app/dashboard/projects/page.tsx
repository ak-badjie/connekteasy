"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { projects } from "@/app/lib/data";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

// Simulate "my" posted projects
const myProjects = projects.slice(0, 4).map((p, i) => ({
    ...p,
    status: i === 0 ? ("open" as const) : i === 1 ? ("in-progress" as const) : i === 2 ? ("open" as const) : ("closed" as const),
    applicants: [12, 8, 5, 24][i],
}));

export default function MyProjectsPage() {
    return (
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Header */}
            <motion.div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
                variants={fadeInUp}
            >
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">My Projects</h1>
                    <p className="text-sm sm:text-base text-gray-500">Manage the projects you&apos;ve posted.</p>
                </div>
                <motion.div whileTap={{ scale: 0.96 }}>
                    <Link
                        href="/dashboard/post"
                        className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors shrink-0 w-full sm:w-auto"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8v8M8 12h8" />
                        </svg>
                        Post a Project
                    </Link>
                </motion.div>
            </motion.div>

            {/* Desktop Table — hidden on mobile */}
            <motion.div
                className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden"
                variants={staggerItem}
            >
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                    Project
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                    Status
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                    Applicants
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                    Budget
                                </th>
                                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {myProjects.map((project, i) => (
                                <motion.tr
                                    key={project.id}
                                    className="hover:bg-gray-50 transition-colors"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 + i * 0.06 }}
                                >
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{project.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{project.category} · {project.postedAt}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${project.status === "open"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : project.status === "in-progress"
                                                        ? "bg-amber-50 text-amber-700"
                                                        : "bg-gray-100 text-gray-500"
                                                }`}
                                        >
                                            {project.status === "open" ? "Open" : project.status === "in-progress" ? "In Progress" : "Closed"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-gray-700 font-medium">{project.applicants}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="text-sm text-gray-700">{project.budget}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <button className="px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                                                View
                                            </button>
                                            <button className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                                                Edit
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Mobile Card View — shown only on mobile */}
            <div className="sm:hidden space-y-3">
                {myProjects.map((project, i) => (
                    <motion.div
                        key={project.id}
                        className="bg-white rounded-xl border border-gray-200 p-4"
                        variants={staggerItem}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">{project.title}</h3>
                            <span
                                className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${project.status === "open"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : project.status === "in-progress"
                                            ? "bg-amber-50 text-amber-700"
                                            : "bg-gray-100 text-gray-500"
                                    }`}
                            >
                                {project.status === "open" ? "Open" : project.status === "in-progress" ? "In Progress" : "Closed"}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mb-3">{project.category} · {project.postedAt}</p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span><strong className="text-gray-700">{project.applicants}</strong> applicants</span>
                                <span>{project.budget}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <button className="px-2.5 py-1 text-[11px] font-medium text-teal-600 bg-teal-50 rounded-lg">
                                    View
                                </button>
                                <button className="px-2.5 py-1 text-[11px] font-medium text-gray-600 bg-gray-100 rounded-lg">
                                    Edit
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
