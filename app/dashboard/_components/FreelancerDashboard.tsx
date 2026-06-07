"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getProjectsByHiredVa,
  getProjects,
  getConversations,
  getProposalsByUser,
  getReviewsFor,
  getEarningsSummary,
  type EarningsSummary,
} from "@/app/lib/firestore";
import type { FirestoreProject, Conversation, Review } from "@/app/lib/types";
import { staggerContainer, staggerItem } from "@/app/lib/animations";
import { greeting, formatGMD, StatCard, Panel, EmptyState, Avatar } from "./kit";
import {
  Briefcase,
  Users,
  Wallet,
  Star,
  TrendingUp,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Mail,
  FileText,
  NotebookPen,
  ListTodo,
  Sparkles,
} from "lucide-react";

export default function FreelancerDashboard() {
  const { user, userProfile } = useAuth();
  const [hired, setHired] = useState<FirestoreProject[]>([]);
  const [available, setAvailable] = useState<FirestoreProject[]>([]);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [proposals, setProposals] = useState<{ accepted: number; rejected: number; pending: number; total: number }>({ accepted: 0, rejected: 0, pending: 0, total: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [earnings, setEarnings] = useState<EarningsSummary>({ total: 0, monthly: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [h, av, cv, pr, rv, ea] = await Promise.allSettled([
        getProjectsByHiredVa(user.uid),
        getProjects(),
        getConversations(user.uid),
        getProposalsByUser(user.uid),
        getReviewsFor(user.uid),
        getEarningsSummary(user.uid),
      ]);
      if (cancelled) return;
      if (h.status === "fulfilled") setHired(h.value);
      if (av.status === "fulfilled") setAvailable(av.value.slice(0, 3));
      if (cv.status === "fulfilled") setConvos(cv.value.slice(0, 3));
      if (pr.status === "fulfilled") {
        const p = pr.value;
        setProposals({
          total: p.length,
          accepted: p.filter((x) => x.status === "accepted").length,
          rejected: p.filter((x) => x.status === "rejected").length,
          pending: p.filter((x) => x.status === "pending").length,
        });
      }
      if (rv.status === "fulfilled") setReviews(rv.value);
      if (ea.status === "fulfilled") setEarnings(ea.value);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const activeClients = new Set(hired.map((p) => p.ownerId)).size;
  const rating = userProfile?.rating ?? 0;
  const maxBar = Math.max(1, ...earnings.monthly.map((m) => m.amount));

  const propTracker = [
    { label: "Sent", value: proposals.total, Icon: Send, color: "text-teal-600" },
    { label: "Pending", value: proposals.pending, Icon: Eye, color: "text-blue-600" },
    { label: "Accepted", value: proposals.accepted, Icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Declined", value: proposals.rejected, Icon: XCircle, color: "text-red-500" },
  ];

  const aiTools = [
    { label: "Draft Email", Icon: Mail, href: "/dashboard/messages" },
    { label: "Create Proposal", Icon: FileText, href: "/explore" },
    { label: "Meeting Notes", Icon: NotebookPen, href: "/dashboard/messages" },
    { label: "Task Planner", Icon: ListTodo, href: "/dashboard/proposals" },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={staggerItem}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
          {greeting()}, {userProfile?.firstName || "there"}! 👋
        </h1>
        <p className="text-sm text-gray-500 mt-1">Let&apos;s win more projects today.</p>
      </motion.div>

      {/* Earnings + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div variants={staggerItem} className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-teal-800 to-teal-950 text-white shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-teal-200">Total Earnings</p>
            <Link href="/dashboard/wallet" className="text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
              View Earnings →
            </Link>
          </div>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{formatGMD(earnings.total)}</p>
          <div className="flex items-end gap-2 h-20">
            {earnings.monthly.map((m) => (
              <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="w-full bg-white/10 rounded-md flex items-end" style={{ height: "100%" }}>
                  <div className="w-full bg-mustard-400 rounded-md" style={{ height: `${(m.amount / maxBar) * 100}%` }} />
                </div>
                <span className="text-[10px] text-teal-300">{m.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={staggerItem} className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
          <StatCard icon={<Briefcase size={20} />} value={loading ? "…" : hired.length} label="Projects" accent="teal" href="/dashboard/proposals" />
          <StatCard icon={<Users size={20} />} value={activeClients} label="Active Clients" accent="indigo" href="/dashboard/messages" />
          <StatCard icon={<Wallet size={20} />} value={formatGMD(earnings.total)} label="Earnings" accent="emerald" href="/dashboard/wallet" />
          <StatCard icon={<Star size={20} />} value={rating ? rating.toFixed(1) : "—"} label="Rating" accent="mustard" href="/dashboard/profile" />
        </motion.div>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Available Projects */}
        <motion.div variants={staggerItem}>
          <Panel title="Available Projects" action="View all" actionHref="/explore">
            {available.length === 0 ? (
              <EmptyState icon={<Briefcase size={22} />} title="No open projects" hint="New project briefs from clients show here." />
            ) : (
              <div className="space-y-3">
                {available.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <Briefcase size={17} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-500 truncate">{p.budget} · {p.duration || "Flexible"}</p>
                    </div>
                    <Link href="/explore" className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-teal-700 rounded-lg hover:bg-teal-800 transition-colors">
                      View
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Client Messages */}
        <motion.div variants={staggerItem}>
          <Panel title="Client Messages" action="View all" actionHref="/dashboard/messages">
            {convos.length === 0 ? (
              <EmptyState icon={<Mail size={22} />} title="No messages yet" hint="Conversations with clients appear here." />
            ) : (
              <div className="space-y-3">
                {convos.map((c) => {
                  const otherId = c.participants.find((p) => p !== user?.uid) || "";
                  const name = c.participantNames?.[otherId] || "Client";
                  return (
                    <Link key={c.id} href="/dashboard/messages" className="flex items-center gap-3 group">
                      <Avatar name={name} src={c.participantAvatars?.[otherId]} size={38} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-700">{name}</p>
                        <p className="text-xs text-gray-500 truncate">{c.lastMessage || "Start the conversation"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* AI Productivity Assistant */}
        <motion.div variants={staggerItem}>
          <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-sm p-5 h-full">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-mustard-400" />
              <h2 className="font-display text-base font-bold">AI Productivity Assistant</h2>
            </div>
            <p className="text-xs text-teal-100 mb-4">Work faster with AI-powered tools.</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {aiTools.map((t) => (
                <Link key={t.label} href={t.href} className="flex flex-col gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-colors">
                  <t.Icon size={16} className="text-mustard-300" />
                  <span className="text-[11px] font-medium leading-tight">{t.label}</span>
                </Link>
              ))}
            </div>
            <Link href="/dashboard/messages" className="block text-center text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-xl py-2.5 transition-colors">
              Open AI Assistant ✦
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Proposal Tracker */}
        <motion.div variants={staggerItem}>
          <Panel title="Proposal Tracker" action="View all" actionHref="/dashboard/proposals">
            <div className="grid grid-cols-2 gap-2.5">
              {propTracker.map((t) => (
                <div key={t.label} className="rounded-xl bg-gray-50 p-3">
                  <t.Icon size={16} className={`${t.color} mb-1.5`} />
                  <p className="text-xl font-bold text-gray-900">{t.value}</p>
                  <p className="text-xs text-gray-500">{t.label}</p>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* Earnings Overview */}
        <motion.div variants={staggerItem}>
          <Panel title="Earnings Overview" action="Wallet" actionHref="/dashboard/wallet">
            {earnings.total === 0 ? (
              <EmptyState icon={<TrendingUp size={22} />} title="No earnings yet" hint="Completed escrow releases will chart here." />
            ) : (
              <div className="flex items-end gap-2 h-32 pt-2">
                {earnings.monthly.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full bg-gray-100 rounded-md flex items-end h-full">
                      <div className="w-full bg-teal-600 rounded-md" style={{ height: `${(m.amount / maxBar) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Recent Reviews */}
        <motion.div variants={staggerItem}>
          <Panel title="Recent Reviews" action="View all" actionHref="/dashboard/profile">
            {reviews.length === 0 ? (
              <EmptyState icon={<Star size={22} />} title="No reviews yet" hint="Client reviews show here after completed work." />
            ) : (
              <div className="space-y-3">
                {reviews.slice(0, 2).map((r) => (
                  <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Avatar name={r.reviewerName} src={r.reviewerAvatar} size={30} />
                      <p className="text-sm font-semibold text-gray-900 truncate flex-1">{r.reviewerName}</p>
                      <span className="flex items-center gap-0.5 text-mustard-500 text-xs font-bold">
                        <Star size={12} className="fill-mustard-500" /> {r.rating?.toFixed?.(1) ?? r.rating}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>
      </div>
    </motion.div>
  );
}
