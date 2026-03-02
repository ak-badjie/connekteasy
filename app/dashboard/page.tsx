"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    FolderOpen,
    Send,
    MessageSquare,
    Eye,
    Search,
    PenLine,
    FolderKanban,
} from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";

const stats = [
    { label: "Active Projects", value: "3", change: "+1 this week", icon: <FolderOpen size={18} />, color: "bg-teal-50 text-teal-700" },
    { label: "Applications Sent", value: "12", change: "+4 this week", icon: <Send size={18} />, color: "bg-blue-50 text-blue-700" },
    { label: "Messages", value: "8", change: "2 unread", icon: <MessageSquare size={18} />, color: "bg-purple-50 text-purple-700" },
    { label: "Profile Views", value: "156", change: "+23 this week", icon: <Eye size={18} />, color: "bg-amber-50 text-amber-700" },
];

const recentActivity = [
    {
        type: "application",
        title: "Applied to Social Media Manager for Growing Tech Startup",
        time: "2 hours ago",
        icon: <Send size={14} className="text-blue-500 sm:w-4 sm:h-4" />,
    },
    {
        type: "view",
        title: 'Sarah Mitchell viewed your profile',
        time: "5 hours ago",
        icon: <Eye size={14} className="text-amber-500 sm:w-4 sm:h-4" />,
    },
    {
        type: "message",
        title: 'New message from James Chen about "Content Writing"',
        time: "1 day ago",
        icon: <MessageSquare size={14} className="text-purple-500 sm:w-4 sm:h-4" />,
    },
    {
        type: "project",
        title: 'Your project "Email Campaign Setup" received 5 new applications',
        time: "2 days ago",
        icon: <FolderKanban size={14} className="text-teal-500 sm:w-4 sm:h-4" />,
    },
];

export default function DashboardOverview() {
    return (
        <div>
            {/* Header */}
            <motion.div className="mb-6 sm:mb-8" initial="hidden" animate="visible" variants={fadeInUp}>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your account.</p>
            </motion.div>

            {/* Stats Grid — 2 cols on mobile, 4 on desktop */}
            <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
            >
                {stats.map((stat) => (
                    <motion.div
                        key={stat.label}
                        className="bg-white rounded-xl border border-gray-200 p-3.5 sm:p-5"
                        variants={staggerItem}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    >
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                                {stat.icon}
                            </span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</p>
                        <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
                        <p className="text-[10px] sm:text-xs text-teal-600 font-medium mt-0.5 sm:mt-1">{stat.change}</p>
                    </motion.div>
                ))}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
            >
                <motion.div variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                    <Link
                        href="/explore"
                        className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 group flex items-center gap-3 sm:gap-4"
                    >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                            <Search size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                                Explore Projects
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-500">Browse open projects matching your skills</p>
                        </div>
                    </Link>
                </motion.div>
                <motion.div variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
                    <Link
                        href="/dashboard/post"
                        className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 group flex items-center gap-3 sm:gap-4"
                    >
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                            <PenLine size={20} className="sm:w-[22px] sm:h-[22px]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                                Post a Project
                            </h3>
                            <p className="text-[11px] sm:text-xs text-gray-500">Find the right virtual assistant for your job</p>
                        </div>
                    </Link>
                </motion.div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
                className="bg-white rounded-xl border border-gray-200"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
            >
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                    <h2 className="text-xs sm:text-sm font-semibold text-gray-900">Recent Activity</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {recentActivity.map((item, i) => (
                        <motion.div
                            key={i}
                            className="px-4 sm:px-5 py-3 sm:py-4 flex items-start gap-2.5 sm:gap-3 hover:bg-gray-50 transition-colors"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.06 }}
                        >
                            <span className="mt-0.5 shrink-0">{item.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-gray-700 leading-snug">{item.title}</p>
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">{item.time}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
