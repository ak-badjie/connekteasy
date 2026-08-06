"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Building2, Clock } from "lucide-react";
import { cardHover, cardTap } from "@/app/lib/animations";
import {
  EMPLOYMENT_LABELS,
  formatLocation,
  isLocalJob,
  jobHref,
  jobSummary,
  timeAgo,
  type PlainJob,
} from "@/app/lib/jobUtils";

const TYPE_STYLES: Record<string, string> = {
  internship: "bg-purple-50 text-purple-700",
  opportunity: "bg-blue-50 text-blue-700",
  "pr-opportunity": "bg-blue-50 text-blue-700",
};

/**
 * One listing on the job board and on Explore. Rendered as a real anchor so
 * crawlers (and middle-click) follow it to the job page.
 */
export default function JobListCard({ job }: { job: PlainJob }) {
  const local = isLocalJob(job);
  return (
    <Link href={jobHref(job)} className="block h-full">
      <motion.article
        className="h-full bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col group"
        whileHover={cardHover}
        whileTap={cardTap}
      >
        <div className="flex items-start gap-2 mb-2.5">
          <span
            className={`px-2.5 py-1 text-[10px] font-semibold rounded-full ${
              TYPE_STYLES[job.employmentType] || "bg-teal-50 text-teal-700"
            }`}
          >
            {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
          </span>
          {local && (
            <span className="px-2.5 py-1 text-[10px] font-semibold rounded-full bg-mustard-50 text-mustard-700">
              In The Gambia
            </span>
          )}
          <span className="ml-auto text-[10px] text-gray-400 shrink-0 inline-flex items-center gap-1">
            <Clock size={10} /> {timeAgo(job.createdAtMs)}
          </span>
        </div>

        <h3 className="font-display text-base font-bold text-gray-900 group-hover:text-mustard-600 transition-colors line-clamp-2 mb-1.5">
          {job.title}
        </h3>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
          {jobSummary(job.description, 130)}
        </p>

        {job.skills?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-100 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
          <span className="inline-flex items-center gap-1 min-w-0">
            <Building2 size={11} className="shrink-0" />
            <span className="truncate max-w-[140px]">{job.company}</span>
          </span>
          <span className="inline-flex items-center gap-1 min-w-0">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate max-w-[150px]">{formatLocation(job.location, 34)}</span>
          </span>
          {job.salary && job.salary !== "Unspecified" && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <Briefcase size={11} className="shrink-0" />
              <span className="truncate max-w-[150px]">{job.salary}</span>
            </span>
          )}
        </div>
      </motion.article>
    </Link>
  );
}
