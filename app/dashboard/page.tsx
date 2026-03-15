"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getProjectsByOwner, getProposalsByUser, getConversations } from "@/app/lib/firestore";
import { FolderOpen, Send, MessageSquare, Eye, Search, PenLine } from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";

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
    { label: "Active Projects", value: stats.projects.toString(), change: "View all", icon: <FolderOpen size={18} />, color: "bg-teal-50 text-teal-700" },
    { label: "Proposals Sent", value: stats.proposals.toString(), change: "View all", icon: <Send size={18} />, color: "bg-blue-50 text-blue-700" },
    { label: "Conversations", value: stats.messages.toString(), change: "View all", icon: <MessageSquare size={18} />, color: "bg-purple-50 text-purple-700" },
    { label: "Profile Views", value: "—", change: "Coming soon", icon: <Eye size={18} />, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-6">
      <motion.div className="mb-6 sm:mb-8" initial="hidden" animate="visible" variants={fadeInUp}>        
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500">
          Welcome back, {userProfile?.firstName || user?.displayName || "there"}! Here&apos;s what&apos;s happening.
        </p>
      </motion.div>

      <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8" initial="hidden" animate="visible" variants={staggerContainer}>      
        {statCards.map((stat) => (
          <motion.div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3.5 sm:p-5" variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${stat.color}`}>{stat.icon}</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">
              {loadingStats ? <span className="inline-block w-6 h-6 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" /> : stat.value}  
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500">{stat.label}</p>
            <p className="text-[10px] sm:text-xs text-teal-600 font-medium mt-0.5 sm:mt-1">{stat.change}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div 
        className={`grid grid-cols-1 ${userProfile?.role === 'client' ? 'sm:grid-cols-2' : 'max-w-md mx-auto'} gap-3 sm:gap-4 mb-6 sm:mb-8`} 
        initial="hidden" animate="visible" variants={staggerContainer}
      >      
        <motion.div variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
          <Link href="/explore" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 group flex items-center gap-3 sm:gap-4 h-full">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
              <Search size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">Explore Projects</h3>
              <p className="text-[11px] sm:text-xs text-gray-500">Browse open projects matching your skills</p>
            </div>
          </Link>
        </motion.div>

        {userProfile?.role === 'client' && (
          <motion.div variants={staggerItem} whileHover={{ y: -2, transition: { duration: 0.2 } }}>
            <Link href="/dashboard/post" className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 group flex items-center gap-3 sm:gap-4 h-full">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 text-teal-600">
                <PenLine size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">Post a Project</h3>
                <p className="text-[11px] sm:text-xs text-gray-500">Find the right virtual assistant for your job</p>
              </div>
            </Link>
          </motion.div>
        )}
      </motion.div>
    </div>  );
}
