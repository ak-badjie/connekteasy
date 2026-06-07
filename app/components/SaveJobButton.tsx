"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useAuth } from "@/app/lib/AuthContext";
import { toggleSavedJob } from "@/app/lib/firestore";

export default function SaveJobButton({
  jobId,
  variant = "icon",
  redirectPath,
}: {
  jobId: string;
  variant?: "icon" | "button";
  redirectPath?: string;
}) {
  const { user, userProfile, refreshProfile } = useAuth();
  const router = useRouter();
  const initiallySaved = !!userProfile?.savedJobs?.includes(jobId);
  const [saved, setSaved] = useState(initiallySaved);
  const [busy, setBusy] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      router.push(`/auth/signin?redirect=${encodeURIComponent(redirectPath || "/jobs")}`);
      return;
    }
    setBusy(true);
    const next = !saved;
    setSaved(next); // optimistic
    try {
      await toggleSavedJob(user.uid, jobId, next);
      await refreshProfile();
    } catch {
      setSaved(!next); // revert
    } finally {
      setBusy(false);
    }
  };

  if (variant === "button") {
    return (
      <button
        onClick={onClick}
        disabled={busy}
        className={`inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border transition-colors disabled:opacity-50 ${
          saved ? "bg-teal-50 text-teal-700 border-teal-200" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
        }`}
      >
        <Bookmark size={16} className={saved ? "fill-teal-600 text-teal-600" : ""} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-label={saved ? "Unsave" : "Save"}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
    >
      <Bookmark size={18} className={saved ? "fill-teal-600 text-teal-600" : "text-gray-300"} />
    </button>
  );
}
