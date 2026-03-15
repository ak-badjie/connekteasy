"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/AuthContext";
import { Project } from "@/app/lib/data";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { slideInRight, backdropFade } from "@/app/lib/animations";
import { createProposal, getOrCreateConversation } from "@/app/lib/firestore";
import { Send, CheckCircle, MessageSquare } from "lucide-react";

interface DetailSidebarProps {
  project: Project | null;
  projectId?: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailSidebar({ project, projectId, isOpen, onClose }: DetailSidebarProps) {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setShowProposalForm(false);
      setCoverLetter("");
      setProposedRate("");
      setSubmitted(false);
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmitProposal = async () => {
    if (!user || !userProfile || !projectId) return;
    setSubmitting(true);
    try {
      await createProposal({
        projectId,
        projectTitle: project?.title || "",
        freelancerId: user.uid,
        freelancerName: userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`,
        freelancerAvatar: `${(userProfile.firstName || "")[0]}${(userProfile.lastName || "")[0]}`.toUpperCase(),
        coverLetter,
        proposedRate,
        status: "pending",
      });
      setSubmitted(true);
      setTimeout(() => { setShowProposalForm(false); setSubmitted(false); }, 2000);
    } catch (err) {
      console.error("Failed to submit proposal:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[3px]" variants={backdropFade} initial="hidden" animate="visible" exit="exit" onClick={onClose} />
          <motion.div className="fixed top-0 right-0 z-50 h-full w-full sm:w-[520px] bg-white shadow-2xl" variants={slideInRight} initial="hidden" animate="visible" exit="exit">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">Project Details</h2>
              <motion.button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" whileTap={{ scale: 0.9 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </motion.button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto h-[calc(100%-57px)] sm:h-[calc(100%-73px)] px-4 sm:px-6 py-5 sm:py-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <span className={`inline-block px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-medium rounded-full mb-3 sm:mb-4 ${project.status === "open" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                  {project.status === "open" ? "Open" : "In Progress"}
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug mb-2">{project.title}</h1>
                <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6">
                  <span>Posted {project.postedAt}</span><span>•</span><span>{project.applicants} applicants</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
                  {[{ label: "Budget", value: project.budget }, { label: "Duration", value: project.duration }, { label: "Location", value: project.location }].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-xl p-3 sm:p-3.5 text-center">
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{stat.label}</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{project.description}</p>
                </div>
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Skills Required</h3>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {project.tags.map((tag) => (
                      <span key={tag} className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-teal-50 text-teal-700 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="mb-5 sm:mb-6">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2">Category</h3>
                  <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{project.category}</span>
                </div>
                <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 bg-gray-50 rounded-xl">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">Posted By</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs sm:text-sm font-bold">{project.postedByAvatar}</div>
                    <div>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900">{project.postedBy}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500">Business Owner</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div className="sticky bottom-0 bg-white pt-3 sm:pt-4 pb-2 border-t border-gray-100 -mx-4 sm:-mx-6 px-4 sm:px-6 mt-auto" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                {!showProposalForm ? (
                  <>
                    <motion.button
                      onClick={() => {
                        if (!user) { router.push("/auth/signin"); return; }
                        setShowProposalForm(true);
                      }}
                      className="w-full py-3 sm:py-3.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.97 }}
                    >
                      <Send size={16} />
                      Send Proposal
                    </motion.button>
                    <motion.button className="w-full py-2.5 sm:py-3 mt-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" whileTap={{ scale: 0.97 }}>
                      Save for Later
                    </motion.button>
                    <motion.button
                      onClick={async () => {
                        if (!user || !userProfile) { router.push("/auth/signin"); return; }
                        setStartingChat(true);
                        try {
                          const name = userProfile.displayName || `${userProfile.firstName} ${userProfile.lastName}`;
                          const avatar = userProfile.profilePhotoUrl || `${(userProfile.firstName || "")[0]}${(userProfile.lastName || "")[0]}`.toUpperCase();
                          // Find project owner ID from the raw project data - use ownerId if available
                          const ownerName = project?.postedBy || "User";
                          const ownerAvatar = project?.postedByAvatar || "U";
                          // We need the ownerId - get it from the project
                          if (projectId) {
                            const { getProject } = await import("@/app/lib/firestore");
                            const fullProject = await getProject(projectId);
                            if (fullProject) {
                              await getOrCreateConversation(user.uid, name, avatar, fullProject.ownerId, ownerName, ownerAvatar);
                              onClose();
                              router.push("/dashboard/messages");
                            }
                          }
                        } catch (err) {
                          console.error("Failed to start conversation:", err);
                        } finally {
                          setStartingChat(false);
                        }
                      }}
                      disabled={startingChat}
                      className="w-full py-2.5 sm:py-3 mt-1 text-sm font-medium text-teal-700 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      whileTap={{ scale: 0.97 }}
                    >
                      <MessageSquare size={16} />
                      {startingChat ? "Opening..." : "Message Owner"}
                    </motion.button>
                  </>
                ) : submitted ? (
                  <motion.div className="text-center py-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <CheckCircle size={32} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-emerald-700">Proposal sent!</p>
                    <p className="text-xs text-gray-500 mt-1">The project owner will review your proposal.</p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Send Proposal</h3>
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cover Letter</label>
                      <textarea
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                        rows={4}
                        placeholder="Introduce yourself and explain why you're the right fit..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 resize-none"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Proposed Rate</label>
                      <input
                        type="text"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                        placeholder="e.g. $20/hr or $500 fixed"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400"
                      />
                    </div>
                    <div className="flex gap-2">
                      <motion.button onClick={() => setShowProposalForm(false)} className="px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors" whileTap={{ scale: 0.97 }}>
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={handleSubmitProposal}
                        disabled={submitting || !coverLetter}
                        className="flex-1 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.97 }}
                      >
                        {submitting ? "Sending..." : "Submit Proposal"}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
