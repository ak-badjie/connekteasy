"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { updateUserProfile } from "@/app/lib/firestore";
import { uploadCv } from "@/app/lib/storage";
import {
  CV_ACCEPT,
  CV_MAX_MB,
  CvParseError,
  mergeIntoProfile,
  parseCv,
  type ParsedCv,
} from "@/app/lib/cvParser";
import { Timestamp } from "firebase/firestore";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

/**
 * Upload a CV, have it read, review what was found, then use it.
 *
 * The review step is not optional: a parser will occasionally get a name or a
 * date wrong, and the member should see what is about to go on their profile
 * before it does.
 *
 * Two callers, two behaviours. On the profile page the accepted fields are
 * written straight to Firestore. During onboarding `onParsed` is passed
 * instead, and the fields are handed back to prefill the form the member is
 * already filling in — otherwise the last step of onboarding would overwrite
 * everything the CV just supplied.
 */
export default function CvParserCard({
  onSaved,
  onParsed,
  compact = false,
}: {
  onSaved?: () => void;
  /** Take the fields rather than writing them. Turns the card into a prefill. */
  onParsed?: (parsed: ParsedCv) => void;
  compact?: boolean;
}) {
  const { user, userProfile, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<"" | "uploading" | "reading" | "saving">("");
  const [progress, setProgress] = useState(0);
  const [parsed, setParsed] = useState<ParsedCv | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const reset = () => {
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError("");
    setSaved(false);
    setParsed(null);
    setFileName(file.name);

    try {
      // Read it first: if the parse fails there is no point keeping the file.
      setBusy("reading");
      const result = await parseCv(file);

      setBusy("uploading");
      const url = await uploadCv(user.uid, file, setProgress);
      await updateUserProfile(user.uid, {
        cvUrl: url,
        cvFileName: file.name,
        cvUploadedAt: Timestamp.now(),
      });

      setParsed(result);
    } catch (err: unknown) {
      setError(
        err instanceof CvParseError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Something went wrong reading that CV."
      );
    } finally {
      setBusy("");
      setProgress(0);
      reset();
    }
  };

  const applyToProfile = async () => {
    if (!user || !parsed) return;
    setBusy("saving");
    setError("");
    try {
      if (onParsed) {
        // Onboarding owns the form; just hand the fields over.
        await updateUserProfile(user.uid, { cvParsedAt: Timestamp.now() });
        onParsed(parsed);
      } else {
        await updateUserProfile(user.uid, {
          ...mergeIntoProfile(parsed, userProfile),
          cvParsedAt: Timestamp.now(),
        });
        await refreshProfile();
      }
      setSaved(true);
      setParsed(null);
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save those details.");
    } finally {
      setBusy("");
    }
  };

  const working = busy === "reading" || busy === "uploading";

  return (
    <div className={compact ? "" : "bg-white rounded-2xl border border-gray-100 shadow-sm p-6"}>
      {!compact && (
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-mustard-600" />
          <h3 className="text-sm font-display font-bold text-gray-900">
            Fill your profile from your CV
          </h3>
        </div>
      )}
      <p className="text-xs text-gray-500 mb-4 leading-relaxed">
        Upload your CV and we will read your title, skills, education and contact
        details out of it. You get to check everything before it is saved.
      </p>

      {userProfile?.cvFileName && !parsed && (
        <div className="flex items-center gap-2.5 mb-3 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
          <FileText size={14} className="text-teal-600 shrink-0" />
          <span className="truncate flex-1">{userProfile.cvFileName}</span>
          {userProfile.cvUrl && (
            <a
              href={userProfile.cvUrl}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-teal-700 hover:text-teal-800 shrink-0"
            >
              View
            </a>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={working || busy === "saving"}
        className="w-full py-7 px-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-mustard-400 hover:bg-mustard-50/40 transition-colors disabled:opacity-60"
      >
        {working ? (
          <span className="inline-flex flex-col items-center gap-2 text-sm text-gray-500">
            <Loader2 size={22} className="animate-spin text-mustard-600" />
            {busy === "reading"
              ? "Reading your CV…"
              : `Saving your CV… ${Math.round(progress)}%`}
          </span>
        ) : (
          <span className="inline-flex flex-col items-center gap-2">
            <Upload size={22} className="text-mustard-600" />
            <span className="text-sm font-semibold text-gray-900">
              {userProfile?.cvUrl ? "Upload a new CV" : "Upload your CV"}
            </span>
            <span className="text-xs text-gray-500">
              PDF, image or text — up to {CV_MAX_MB}MB
            </span>
          </span>
        )}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept={CV_ACCEPT}
        onChange={handleFile}
        className="hidden"
      />

      {error && (
        <p className="mt-3 flex items-start gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          {error}
        </p>
      )}

      {saved && (
        <p className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <CheckCircle2 size={14} className="shrink-0" />
          {onParsed
            ? "We have filled in what we found — check it on the next step."
            : "Your profile has been updated from your CV."}
        </p>
      )}

      <AnimatePresence>
        {parsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-4 rounded-xl border border-teal-100 bg-teal-50/50">
              <div className="flex items-start gap-2 mb-3">
                <Sparkles size={14} className="text-teal-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-900">
                    Here is what we found in {fileName || "your CV"}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Anything you have already written stays as it is — this only
                    fills the blanks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setParsed(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-md shrink-0"
                  aria-label="Discard these details"
                >
                  <X size={14} />
                </button>
              </div>

              <dl className="space-y-2 text-xs">
                <Row label="Name" value={`${parsed.firstName} ${parsed.lastName}`.trim()} />
                <Row label="Title" value={parsed.title} />
                <Row label="Location" value={parsed.location} />
                <Row label="Phone" value={parsed.phone} />
                <Row
                  label="Experience"
                  value={parsed.yearsOfExperience ? `${parsed.yearsOfExperience} years` : ""}
                />
                <Row label="Skills" value={parsed.skills.join(", ")} />
                <Row
                  label="Education"
                  value={parsed.education
                    .map((e) => [e.degree, e.field, e.school].filter(Boolean).join(" — "))
                    .join(" · ")}
                />
                <Row label="Summary" value={parsed.bio} />
              </dl>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={applyToProfile}
                  disabled={busy === "saving"}
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  {busy === "saving" ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} /> Use these details
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setParsed(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Discard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-gray-400 font-medium">{label}</dt>
      <dd className="flex-1 text-gray-800 break-words">{value}</dd>
    </div>
  );
}
