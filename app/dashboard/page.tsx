"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getProjectsByOwner, getProposalsByUser, getConversations } from "@/app/lib/firestore";
import { FolderOpen, Send, MessageSquare, Eye, Search, PenLine, ArrowRight } from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp, cardHover, cardTap } from "@/app/lib/animations";

export default function DashboardOverview() {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({ projects: 0, proposals: 0, messages: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function loadStats() {
      try {
        const [projects, proposals, conversations] = await Promise.all([
          getProjectsByOwner(user!.uid),
          getProposalsByUser(user!.uid),
          getConversations(user!.uid),
        ]);
        setStats({
          projects: projects.length,
          proposals: proposals.length,
          messages: conversations.length,
        });
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, [user]);

  const statCards = [
    { label: "Active Projects", value: stats.projects.toString(), link: "/dashboard/projects", icon: <FolderOpen size={20} />, color: "bg-teal-50 text-mustard-700 border-teal-100" },
    { label: "Proposals Sent", value: stats.proposals.toString(), link: "/dashboard/proposals", icon: <Send size={20} />, color: "bg-teal-50 text-mustard-700 border-teal-100" },
    { label: "Conversations", value: stats.messages.toString(), link: "/dashboard/messages", icon: <MessageSquare size={20} />, color: "bg-mustard-50 text-mustard-700 border-mustard-100" },
    { label: "Profile Views", value: "—", link: "/dashboard/profile", icon: <Eye size={20} />, color: "bg-gray-50 text-gray-700 border-gray-200" },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-6">
      <motion.div className="mb-8 sm:mb-10" initial="hidden" animate="visible" variants={fadeInUp}>
        <h1 className="text-3xl sm:text-4xl font-display text-gray-900 mb-2">Dashboard</h1>
        <p className="text-base text-gray-500 max-w-2xl">
          Welcome back, {userProfile?.firstName || user?.displayName || "there"}. Here&apos;s a quick overview of your activity.
        </p>
      </motion.div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10" initial="hidden" animate="visible" variants={staggerContainer}>
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={staggerItem} whileHover={cardHover} whileTap={cardTap}>
            <Link href={stat.link} className="block bg-white rounded-2xl border border-gray-200 p-6 shadow-sm transition-all h-full">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${stat.color}`}>
                  {stat.icon}
                </div>
                <ArrowRight size={16} className="text-gray-300" />
              </div>
              <p className="text-3xl font-display font-bold text-gray-900 mb-1">
                {loadingStats ? <span className="inline-block w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin mt-1" /> : stat.value}
              </p>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className={`grid grid-cols-1 ${userProfile?.role === 'client' ? 'lg:grid-cols-2' : 'max-w-3xl'} gap-4 sm:gap-6`}
        initial="hidden" animate="visible" variants={staggerContainer}
      >
        <motion.div variants={staggerItem} whileHover={cardHover} whileTap={cardTap}>
          <Link href="/explore" className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 sm:p-8 group flex flex-col h-full relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white mb-6">
              <Search size={24} />
            </div>
            <div>
              <h3 className="text-xl font-display font-bold text-white mb-2">Explore Projects</h3>
              <p className="text-sm text-teal-100 mb-6 max-w-sm">Browse open projects matching your skills and start sending proposals today.</p>
              <span className="inline-flex items-center text-sm font-semibold text-white group-hover:underline">
                Start Browsing <ArrowRight size={16} className="ml-1" />
              </span>
            </div>
          </Link>
        </motion.div>

        {userProfile?.role === 'client' && (
          <motion.div variants={staggerItem} whileHover={cardHover} whileTap={cardTap}>
            <Link href="/dashboard/post" className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 group flex flex-col h-full shadow-sm transition-all">
              <div className="w-12 h-12 rounded-xl bg-mustard-500/10 flex items-center justify-center shrink-0 text-mustard-600 mb-6">
                <PenLine size={24} />
              </div>
              <div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-2 group-hover:text-mustard-600 transition-colors">Post a New Project</h3>
                <p className="text-sm text-gray-500 mb-6 max-w-sm">Find the right virtual assistant for your job by posting a detailed project brief.</p>
                <span className="inline-flex items-center text-sm font-semibold text-mustard-600">
                  Create Project <ArrowRight size={16} className="ml-1" />
                </span>
              </div>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
