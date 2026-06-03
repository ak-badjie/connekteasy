"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getProjectsByOwner,
  getProposalsByUser,
  getConversations,
  getApplicationsByUser,
} from "@/app/lib/firestore";
import { caps, isSeeker, roleLabel } from "@/app/lib/roles";
import {
  FolderOpen,
  Send,
  MessageSquare,
  Eye,
  Search,
  PenLine,
  Briefcase,
  GraduationCap,
  FileText,
  ArrowRight,
} from "lucide-react";
import { staggerContainer, staggerItem, fadeInUp, cardHover, cardTap } from "@/app/lib/animations";

interface Stats {
  projects: number;
  proposals: number;
  applications: number;
  messages: number;
}

export default function DashboardOverview() {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role;
  const c = caps(role);
  const seeker = isSeeker(role);

  const [stats, setStats] = useState<Stats>({ projects: 0, proposals: 0, applications: 0, messages: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function loadStats() {
      try {
        const conversations = await getConversations(user!.uid);
        let projects = 0;
        let proposals = 0;
        let applications = 0;
        if (c.manageProjects) projects = (await getProjectsByOwner(user!.uid)).length;
        if (c.sendProposals) proposals = (await getProposalsByUser(user!.uid)).length;
        if (seeker) applications = (await getApplicationsByUser(user!.uid)).length;
        if (!cancelled) {
          setStats({ projects, proposals, applications, messages: conversations.length });
        }
      } catch (err) {
        console.error("Failed to load stats:", err);
      } finally {
        if (!cancelled) setLoadingStats(false);
      }
    }
    loadStats();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, role]);

  // ─── Role-specific stat cards ────────────────────────────
  const statCards: { label: string; value: string; link: string; icon: React.ReactNode; color: string }[] = [];
  if (c.manageProjects) {
    statCards.push({ label: "Projects Posted", value: stats.projects.toString(), link: "/dashboard/projects", icon: <FolderOpen size={20} />, color: "bg-teal-50 text-mustard-700 border-teal-100" });
  }
  if (c.sendProposals) {
    statCards.push({ label: "Proposals Sent", value: stats.proposals.toString(), link: "/dashboard/proposals", icon: <Send size={20} />, color: "bg-teal-50 text-mustard-700 border-teal-100" });
  }
  if (seeker) {
    statCards.push({ label: "Applications", value: stats.applications.toString(), link: role === "student" ? "/dashboard/internships" : "/dashboard/jobs", icon: <FileText size={20} />, color: "bg-teal-50 text-mustard-700 border-teal-100" });
  }
  statCards.push({ label: "Conversations", value: stats.messages.toString(), link: "/dashboard/messages", icon: <MessageSquare size={20} />, color: "bg-mustard-50 text-mustard-700 border-mustard-100" });
  statCards.push({ label: "Profile Views", value: "—", link: "/dashboard/profile", icon: <Eye size={20} />, color: "bg-gray-50 text-gray-700 border-gray-200" });

  // ─── Role-specific action cards ──────────────────────────
  type Action = { title: string; desc: string; href: string; icon: React.ReactNode; primary?: boolean };
  const actions: Action[] = [];
  if (c.exploreProjects) {
    actions.push({ title: "Explore Projects", desc: "Browse open projects matching your skills and start sending proposals today.", href: "/explore", icon: <Search size={24} />, primary: true });
  }
  if (c.browseJobs && !c.postProject) {
    actions.push({ title: "Browse Jobs", desc: "Find roles posted by employers across The Gambia and apply for free.", href: "/dashboard/jobs", icon: <Briefcase size={24} />, primary: !c.exploreProjects });
  }
  if (c.browseInternships) {
    actions.push({ title: "Browse Internships", desc: "Unlock vetted internship placements with your membership and apply in one click.", href: "/dashboard/internships", icon: <GraduationCap size={24} />, primary: true });
  }
  if (c.postProject) {
    actions.push({ title: "Post a New Project", desc: "Find the right virtual assistant by posting a detailed project brief.", href: "/dashboard/post", icon: <PenLine size={24} /> });
  }
  if (c.postJobs) {
    actions.push({ title: "Post a Job or Internship", desc: "Reach qualified candidates and manage applicants in one place.", href: "/dashboard/jobs/post", icon: <Briefcase size={24} /> });
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-6">
      <motion.div className="mb-8 sm:mb-10" initial="hidden" animate="visible" variants={fadeInUp}>
        <div className="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full">
          {roleLabel(role)}
        </div>
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
        className={`grid grid-cols-1 ${actions.length > 1 ? "lg:grid-cols-2" : "max-w-3xl"} gap-4 sm:gap-6`}
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {actions.map((action) => (
          <motion.div key={action.title} variants={staggerItem} whileHover={cardHover} whileTap={cardTap}>
            {action.primary ? (
              <Link href={action.href} className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-6 sm:p-8 group flex flex-col h-full relative overflow-hidden shadow-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-white mb-6">
                  {action.icon}
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-white mb-2">{action.title}</h3>
                  <p className="text-sm text-teal-100 mb-6 max-w-sm">{action.desc}</p>
                  <span className="inline-flex items-center text-sm font-semibold text-white group-hover:underline">
                    Get Started <ArrowRight size={16} className="ml-1" />
                  </span>
                </div>
              </Link>
            ) : (
              <Link href={action.href} className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 group flex flex-col h-full shadow-sm transition-all">
                <div className="w-12 h-12 rounded-xl bg-mustard-500/10 flex items-center justify-center shrink-0 text-mustard-600 mb-6">
                  {action.icon}
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-gray-900 mb-2 group-hover:text-mustard-600 transition-colors">{action.title}</h3>
                  <p className="text-sm text-gray-500 mb-6 max-w-sm">{action.desc}</p>
                  <span className="inline-flex items-center text-sm font-semibold text-mustard-600">
                    Continue <ArrowRight size={16} className="ml-1" />
                  </span>
                </div>
              </Link>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
