"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import {
  getProposalsByProject,
  getProposalsByUser,
  getProjectsByOwner,
  updateProposalStatus,
} from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import type { Proposal } from "@/app/lib/types";
import type { FirestoreProject } from "@/app/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ProposalsContent() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("project");

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [myProjects, setMyProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"received" | "sent">("received");

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const projects = await getProjectsByOwner(user!.uid);
        setMyProjects(projects);

        if (tab === "received") {
          if (projectFilter) {
            const props = await getProposalsByProject(projectFilter);
            setProposals(props);
          } else {
            // Get proposals for all user's projects
            const allProps: Proposal[] = [];
            for (const p of projects) {
              const props = await getProposalsByProject(p.id);
              allProps.push(...props);
            }
            setProposals(allProps);
          }
        } else {
          const sent = await getProposalsByUser(user!.uid);
          setProposals(sent);
        }
      } catch (err) {
        console.error("Failed to load proposals:", err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    load();
  }, [user, tab, projectFilter]);

  const handleUpdateStatus = async (proposal: Proposal, status: "accepted" | "rejected") => {
    try {
      await updateProposalStatus(proposal.id, status, proposal.projectId, proposal.freelancerId);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status } : p))
      );
    } catch (err) {
      console.error("Failed to update proposal:", err);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="h-full flex flex-col min-h-0 pb-6">
      <motion.div className="mb-4 sm:mb-6 shrink-0" variants={fadeInUp}>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Proposals</h1>
        <p className="text-sm sm:text-base text-gray-500">
          {tab === "received"
            ? "Review proposals for your projects."
            : "Track proposals you've sent."}
        </p>
      </motion.div>

      {/* Tabs */}
      <motion.div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit shrink-0" variants={fadeInUp}>
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
              tab === t
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "received" ? "Received" : "Sent"}
          </button>
        ))}
      </motion.div>

      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0 pb-4">
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">Loading proposals...</p>
          </div>
        ) : proposals.length === 0 ? (
          <motion.div className="text-center py-16 bg-white rounded-xl border border-gray-200" variants={staggerItem}>
            <FileText size={36} className="mx-auto mb-3 text-gray-300" />
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No proposals yet</h3>
            <p className="text-xs text-gray-500">
              {tab === "received"
                ? "Proposals for your projects will appear here."
                : "Proposals you send will appear here."}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal) => (
              <motion.div
                key={proposal.id}
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5"
                variants={staggerItem}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {proposal.freelancerAvatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {tab === "received" ? proposal.freelancerName : proposal.projectTitle}
                    </p>
                    <p className="text-xs text-gray-500">
                      {tab === "received"
                        ? `For: ${proposal.projectTitle}`
                        : `By you`}
                      {" · "}
                      {proposal.createdAt?.toDate
                        ? timeAgo(proposal.createdAt.toDate())
                        : "Just now"}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 text-[10px] sm:text-xs font-medium rounded-full ${
                    proposal.status === "pending"
                      ? "bg-amber-50 text-amber-700"
                      : proposal.status === "accepted"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {proposal.status === "pending" && <Clock size={12} />}
                  {proposal.status === "accepted" && <CheckCircle size={12} />}
                  {proposal.status === "rejected" && <XCircle size={12} />}
                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                </span>
              </div>

              {proposal.proposedRate && (
                <p className="text-xs text-gray-500 mb-2">
                  <span className="font-medium text-gray-700">Proposed Rate:</span> {proposal.proposedRate}
                </p>
              )}

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">
                {proposal.coverLetter}
              </p>

              {tab === "received" && proposal.status === "pending" && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <motion.button
                    onClick={() => handleUpdateStatus(proposal, "accepted")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <CheckCircle size={14} />
                    Accept
                  </motion.button>
                  <motion.button
                    onClick={() => handleUpdateStatus(proposal, "rejected")}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    whileTap={{ scale: 0.95 }}
                  >
                    <XCircle size={14} />
                    Reject
                  </motion.button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
      </div>
    </motion.div>
  );
}

export default function ProposalsPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading proposals...</p>
      </div>
    }>
      <ProposalsContent />
    </Suspense>
  );
}
