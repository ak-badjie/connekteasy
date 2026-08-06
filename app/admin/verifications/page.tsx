"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getVaVerificationQueue,
  reviewVaVerification,
  vaVerificationStatus,
  VA_STATUS_LABELS,
} from "@/app/lib/verification";
import type { UserProfile, VaVerificationStatus } from "@/app/lib/types";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Avatar } from "@/app/dashboard/_components/kit";
import {
  BadgeCheck,
  Search,
  FileText,
  Check,
  X,
  Clock,
  ShieldOff,
  ExternalLink,
} from "lucide-react";

type Tab = "pending" | "approved" | "rejected" | "not_submitted";

const TABS: { key: Tab; label: string }[] = [
  { key: "pending", label: "Awaiting review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "not_submitted", label: "No documents" },
];

const STATUS_STYLES: Record<VaVerificationStatus, string> = {
  pending: "bg-mustard-50 text-mustard-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  not_submitted: "bg-gray-100 text-gray-600",
};

export default function AdminVerificationsPage() {
  const [vas, setVas] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [query, setQuery] = useState("");
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [rejectingUid, setRejectingUid] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const refresh = async () => {
    const list = await getVaVerificationQueue().catch(() => []);
    setVas(list);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const counts = useMemo(() => {
    const base: Record<Tab, number> = {
      pending: 0,
      approved: 0,
      rejected: 0,
      not_submitted: 0,
    };
    vas.forEach((u) => {
      base[vaVerificationStatus(u) as Tab] += 1;
    });
    return base;
  }, [vas]);

  const q = query.trim().toLowerCase();
  const visible = vas.filter((u) => {
    if (vaVerificationStatus(u) !== tab) return false;
    if (!q) return true;
    return (
      (u.displayName || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });

  const decide = async (
    uid: string,
    status: "approved" | "rejected",
    reviewerNote = ""
  ) => {
    setBusyUid(uid);
    setError("");
    try {
      await reviewVaVerification({ uid, status, note: reviewerNote });
      setVas((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, vaVerificationStatus: status, vaVerificationNote: reviewerNote }
            : u
        )
      );
      setRejectingUid(null);
      setNote("");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not save that decision. Try again."
      );
    } finally {
      setBusyUid(null);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            Freelancer Verification
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? "Loading…"
              : `${counts.pending} freelancer${counts.pending === 1 ? "" : "s"} waiting on approval`}
          </p>
        </div>
        <div className="relative sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </motion.div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <motion.div variants={staggerItem} className="flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
              tab === t.key
                ? "bg-mustard-50 text-mustard-700"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-[10px] text-gray-400">{counts[t.key]}</span>
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <BadgeCheck size={36} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Nothing here right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {visible.map((u) => {
              const status = vaVerificationStatus(u);
              const documents = u.vaCertificates || [];
              return (
                <motion.div
                  key={u.uid}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={u.displayName} src={u.profilePhotoUrl} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {u.displayName || "Unnamed freelancer"}
                        </p>
                        <span
                          className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${STATUS_STYLES[status]}`}
                        >
                          {VA_STATUS_LABELS[status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      {u.title && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{u.title}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1 inline-flex items-center gap-1">
                        <Clock size={11} />
                        {u.vaVerificationSubmittedAt?.toDate
                          ? `Submitted ${u.vaVerificationSubmittedAt.toDate().toLocaleDateString()}`
                          : "Never submitted"}
                      </p>
                    </div>
                    <a
                      href={`/profile/${u.uid}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      Profile <ExternalLink size={12} />
                    </a>
                  </div>

                  {documents.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {documents.map((file, idx) => (
                        <li
                          key={`${file.url}-${idx}`}
                          className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/60"
                        >
                          <FileText size={16} className="text-teal-600 shrink-0" />
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-gray-700 truncate flex-1 hover:text-teal-700"
                          >
                            {file.name}
                          </a>
                          <span className="text-[11px] text-gray-400 shrink-0">Open</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {status === "rejected" && u.vaVerificationNote && (
                    <p className="mt-3 text-xs text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
                      <span className="font-semibold">Your note:</span> {u.vaVerificationNote}
                    </p>
                  )}

                  {rejectingUid === u.uid ? (
                    <div className="mt-4 space-y-2">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        autoFocus
                        placeholder="Tell them what's missing, e.g. 'The file is unreadable — please re-upload your certificate.'"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(u.uid, "rejected", note.trim())}
                          disabled={busyUid === u.uid || !note.trim()}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40"
                        >
                          <ShieldOff size={13} /> Confirm rejection
                        </button>
                        <button
                          onClick={() => {
                            setRejectingUid(null);
                            setNote("");
                          }}
                          className="px-3.5 py-2 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {status !== "approved" && (
                        <button
                          onClick={() => decide(u.uid, "approved")}
                          disabled={busyUid === u.uid || documents.length === 0}
                          title={
                            documents.length === 0
                              ? "This freelancer hasn't uploaded any documents yet."
                              : undefined
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-40"
                        >
                          <Check size={13} />
                          {busyUid === u.uid ? "Saving…" : "Approve"}
                        </button>
                      )}
                      {status !== "rejected" && (
                        <button
                          onClick={() => {
                            setRejectingUid(u.uid);
                            setNote("");
                          }}
                          disabled={busyUid === u.uid}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40"
                        >
                          <X size={13} /> Reject
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
