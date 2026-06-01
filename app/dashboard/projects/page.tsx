"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getProjectsByOwner } from "@/app/lib/firestore";
import { escrowRelease } from "@/app/lib/payment";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { X } from "lucide-react";
import type { FirestoreProject } from "@/app/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function MyProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<FirestoreProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Escrow Release Modal State
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<FirestoreProject | null>(null);
  const [releaseAmount, setReleaseAmount] = useState("");
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [releaseError, setReleaseError] = useState("");

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const data = await getProjectsByOwner(user!.uid);
        setProjects(data);
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleOpenReleaseModal = (project: FirestoreProject) => {
    setSelectedProject(project);
    setReleaseAmount(project.escrowAmount?.toString() || "");
    setReleaseError("");
    setReleaseModalOpen(true);
  };

  const handleReleaseFunds = async () => {
    if (!selectedProject || !user) return;
    
    const amount = Number(releaseAmount);
    if (isNaN(amount) || amount <= 0 || amount > (selectedProject.escrowAmount || 0)) {
      setReleaseError(`Please enter a valid amount up to ${selectedProject.escrowAmount} GMD`);
      return;
    }

    setReleaseLoading(true);
    setReleaseError("");

    try {
      const data = await escrowRelease({
        projectId: selectedProject.id,
        finalAmount: amount,
      });

      // Update local state
      setProjects(prev => prev.map(p =>
        p.id === selectedProject.id
          ? { ...p, status: "closed", escrowStatus: "released", finalPayout: amount }
          : p
      ));

      setReleaseModalOpen(false);
      alert(`Successfully released funds! VA received ${data.vaPayout} GMD (Platform fee: ${data.platformFee} GMD). ${data.refundAmount > 0 ? `Refunded ${data.refundAmount} GMD back to your wallet.` : ""}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setReleaseError(err.message);
      } else {
        setReleaseError("An unknown error occurred.");
      }
    } finally {
      setReleaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading your projects...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      {/* Escrow Release Modal */}
      <AnimatePresence>
        {releaseModalOpen && selectedProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
              onClick={() => setReleaseModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl z-[101] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold font-display text-gray-900">Complete & Release Funds</h2>
                <button
                  onClick={() => setReleaseModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  You are about to complete <strong>{selectedProject.title}</strong>. 
                  Currently, <strong>{selectedProject.escrowAmount} GMD</strong> is held in escrow.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final Payout to VA (GMD)</label>
                  <input
                    type="number"
                    value={releaseAmount}
                    onChange={(e) => setReleaseAmount(e.target.value)}
                    max={selectedProject.escrowAmount}
                    min={1}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-mustard-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Any remaining amount will be refunded to your wallet.</p>
                </div>
                {releaseError && <p className="text-sm text-red-500 mb-4">{releaseError}</p>}
                <button
                  onClick={handleReleaseFunds}
                  disabled={releaseLoading}
                  className="w-full bg-teal-600 hover:bg-mustard-600 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center shadow-sm"
                >
                  {releaseLoading ? "Releasing..." : "Release Funds & Close Project"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8" variants={fadeInUp}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-900 mb-1">My Projects</h1>
          <p className="text-sm sm:text-base text-gray-500">Manage the projects you&apos;ve posted.</p>
        </div>
        <motion.div whileTap={{ scale: 0.96 }}>
          <Link href="/dashboard/post" className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shrink-0 w-full sm:w-auto shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v8M8 12h8" /></svg>
            Post a Project
          </Link>
        </motion.div>
      </motion.div>

      {projects.length === 0 ? (
        <motion.div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm" variants={staggerItem}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" className="mx-auto mb-3">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">No projects yet</h3>
          <p className="text-xs text-gray-500 mb-4">Post your first project to start finding talent.</p>
          <Link href="/dashboard/post" className="inline-flex px-4 py-2 text-xs font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm">
            Post a Project
          </Link>
        </motion.div>
      ) : (
        <>
          {/* Desktop Table */}
          <motion.div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" variants={staggerItem}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Project</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Applicants</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Budget</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projects.map((project, i) => (
                    <motion.tr key={project.id} className="hover:bg-gray-50 transition-colors" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">{project.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{project.category} · {project.createdAt?.toDate ? timeAgo(project.createdAt.toDate()) : "Just now"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 text-xs font-medium rounded-full ${project.status === "open" ? "bg-teal-50 text-mustard-700" : project.status === "in-progress" ? "bg-mustard-500/10 text-mustard-600" : "bg-gray-100 text-gray-500"}`}>
                          {project.status === "open" ? "Open" : project.status === "in-progress" ? "In Progress" : "Closed"}
                        </span>
                      </td>
                      <td className="px-5 py-4"><span className="text-sm text-gray-700 font-medium">{project.applicants || 0}</span></td>
                      <td className="px-5 py-4"><span className="text-sm text-gray-700">{project.budget}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/proposals?project=${project.id}`} className="px-3 py-1.5 text-xs font-medium text-mustard-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
                            Proposals
                          </Link>
                          {project.status === "in-progress" && project.escrowStatus === "held" && (
                            <button onClick={() => handleOpenReleaseModal(project)} className="px-3 py-1.5 text-xs font-medium text-mustard-600 bg-mustard-500/10 rounded-xl hover:bg-mustard-500/20 transition-colors">
                              Release Funds
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {projects.map((project) => (
              <motion.div key={project.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4" variants={staggerItem}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold font-display text-gray-900 leading-snug line-clamp-2 flex-1">{project.title}</h3>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] font-medium rounded-full ${project.status === "open" ? "bg-teal-50 text-mustard-700" : project.status === "in-progress" ? "bg-mustard-500/10 text-mustard-600" : "bg-gray-100 text-gray-500"}`}>
                    {project.status === "open" ? "Open" : project.status === "in-progress" ? "In Progress" : "Closed"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mb-3">{project.category} · {project.createdAt?.toDate ? timeAgo(project.createdAt.toDate()) : "Just now"}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span><strong className="text-gray-700">{project.applicants || 0}</strong> applicants</span>
                    <span>{project.budget}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/proposals?project=${project.id}`} className="px-2.5 py-1 text-[11px] font-medium text-mustard-600 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors">
                      Proposals
                    </Link>
                    {project.status === "in-progress" && project.escrowStatus === "held" && (
                      <button onClick={() => handleOpenReleaseModal(project)} className="px-2.5 py-1 text-[11px] font-medium text-mustard-600 bg-mustard-500/10 rounded-xl hover:bg-mustard-500/20 transition-colors">
                        Release
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
