"use client";

import { ExternalLink } from "lucide-react";
import type { Job } from "@/app/lib/types";

/**
 * Imported listings are applied to on the board they came from. Returns that
 * link when the job has one, or null for jobs posted on CONNEKT itself.
 */
export function externalApplyUrl(job?: Job | null): string | null {
  const url = (job?.applyUrl || job?.sourceUrl || "").trim();
  return /^https?:\/\//i.test(url) ? url : null;
}

/** Primary action for an imported job: send the candidate to the real advert. */
export function ExternalApplyButton({
  job,
  className = "",
}: {
  job: Job;
  className?: string;
}) {
  const url = externalApplyUrl(job);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm ${className}`}
    >
      Apply on {job.sourceName || "the employer's site"}
      <ExternalLink size={16} />
    </a>
  );
}

/** Attribution line — several boards require a link back to the original. */
export function JobSourceCredit({ job }: { job: Job }) {
  const url = externalApplyUrl(job);
  if (!url) return null;
  return (
    <p className="text-xs text-gray-500 mb-6">
      Listing sourced from{" "}
      <span className="font-semibold text-gray-700">{job.sourceName || "an external board"}</span>.{" "}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-teal-600 font-semibold hover:underline inline-flex items-center gap-1"
      >
        View the original posting <ExternalLink size={11} />
      </a>
    </p>
  );
}
