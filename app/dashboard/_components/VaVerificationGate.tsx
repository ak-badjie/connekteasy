"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { uploadVaAccreditation } from "@/app/lib/storage";
import {
  submitVaVerification,
  vaVerificationStatus,
  VA_MIN_DOCUMENTS,
} from "@/app/lib/verification";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";

const MAX_DOC_MB = 10;

/**
 * Shown in place of the whole dashboard while a freelancer's VA accreditation
 * is unreviewed. Pending accounts can only wait; rejected accounts can replace
 * their documents and go back into the queue.
 */
export default function VaVerificationGate() {
  const { user, userProfile, refreshProfile } = useAuth();
  const status = vaVerificationStatus(userProfile);

  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submitted = userProfile?.vaCertificates || [];
  const canResubmit = status !== "pending";

  // While they wait on this screen, pick up the admin's decision without
  // making them sign out and back in.
  const refreshRef = useRef(refreshProfile);
  refreshRef.current = refreshProfile;
  useEffect(() => {
    if (status !== "pending") return;
    const id = setInterval(() => {
      refreshRef.current().catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [status]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setError("");

    const tooBig = files.find((f) => f.size > MAX_DOC_MB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than ${MAX_DOC_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded: { name: string; url: string }[] = [];
      for (const file of files) {
        const url = await uploadVaAccreditation(user.uid, file, setProgress);
        uploaded.push({ name: file.name, url });
      }
      setDocuments((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!user || documents.length < VA_MIN_DOCUMENTS) return;
    setSubmitting(true);
    setError("");
    try {
      await submitVaVerification(user.uid, documents);
      await refreshProfile();
      setDocuments([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit for review.");
    } finally {
      setSubmitting(false);
    }
  };

  const headline =
    status === "pending"
      ? "Your account is under review"
      : status === "rejected"
      ? "We need a different document"
      : "Verify your VA training";

  const blurb =
    status === "pending"
      ? "Thanks for submitting your VA accreditation. An admin is reviewing it now — you'll get full access to CONNEKT as soon as it's approved."
      : status === "rejected"
      ? "An admin reviewed your submission and couldn't approve it. Upload a valid VA training or accreditation certificate and we'll take another look."
      : "Freelancer accounts are opened once we've seen your virtual assistant certificate or training accreditation.";

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-2xl mx-auto py-6"
    >
      <motion.div className="text-center mb-8" variants={fadeInUp}>
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
            status === "pending"
              ? "bg-mustard-500/10 text-mustard-600"
              : status === "rejected"
              ? "bg-red-50 text-red-600"
              : "bg-teal-50 text-teal-600"
          }`}
        >
          {status === "pending" ? (
            <Clock size={30} />
          ) : status === "rejected" ? (
            <AlertTriangle size={30} />
          ) : (
            <ShieldCheck size={30} />
          )}
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {headline}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">{blurb}</p>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8"
      >
        {error && (
          <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {status === "rejected" && userProfile?.vaVerificationNote && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100">
            <p className="text-xs font-bold text-red-800 mb-1">Reviewer&apos;s note</p>
            <p className="text-sm text-red-700 leading-relaxed">
              {userProfile.vaVerificationNote}
            </p>
          </div>
        )}

        {submitted.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2.5">
              Documents on file
            </p>
            <ul className="space-y-2">
              {submitted.map((file, idx) => (
                <li
                  key={`${file.url}-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/60"
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
                  {status === "pending" && (
                    <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-mustard-50 text-mustard-700">
                      In review
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status === "pending" ? (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 border border-teal-100">
            <CheckCircle size={18} className="text-teal-600 shrink-0 mt-0.5" />
            <p className="text-sm text-teal-800 leading-relaxed">
              Nothing else to do for now. Reviews are usually completed within one
              business day — we&apos;ll email you at{" "}
              <span className="font-semibold">{userProfile?.email}</span> once your
              account is live.
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full py-8 px-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-mustard-400 hover:bg-mustard-50/40 transition-colors disabled:opacity-60"
            >
              {uploading ? (
                <span className="inline-flex flex-col items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={22} className="animate-spin text-mustard-600" />
                  Uploading… {Math.round(progress)}%
                </span>
              ) : (
                <span className="inline-flex flex-col items-center gap-2">
                  <Upload size={22} className="text-mustard-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Upload VA certificate
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, JPG or PNG — max {MAX_DOC_MB}MB each
                  </span>
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={handleUpload}
              className="hidden"
            />

            {documents.length > 0 && (
              <ul className="mt-4 space-y-2">
                {documents.map((file, idx) => (
                  <li
                    key={`${file.url}-${idx}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white"
                  >
                    <FileText size={16} className="text-teal-600 shrink-0" />
                    <span className="text-sm text-gray-700 truncate flex-1">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-gray-400 hover:text-red-600 rounded-md shrink-0"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canResubmit || submitting || uploading || documents.length < VA_MIN_DOCUMENTS}
              className="w-full mt-5 bg-mustard-500 hover:bg-mustard-600 text-gray-900 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
            >
              <ShieldCheck size={18} />
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </>
        )}

        <p className="text-xs text-gray-400 text-center mt-5">
          Questions about verification? Message us at hello@connekt.gm.
        </p>
      </motion.div>
    </motion.div>
  );
}
