"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { getJob } from "@/app/lib/firestore";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import JobApplyPanel from "@/app/jobs/[id]/JobApplyPanel";
import {
  EMPLOYMENT_LABELS,
  HOME_COUNTRY,
  formatLocation,
  isLocalJob,
  timeAgo,
  toPlainJob,
  type PlainJob,
} from "@/app/lib/jobUtils";
import { Briefcase, MapPin, ArrowLeft, Banknote, Users } from "lucide-react";

export default function DashboardJobDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<PlainJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) return;
    getJob(jobId)
      .then((j) => setJob(j ? toPlainJob(j) : null))
      .finally(() => setLoading(false));
  }, [jobId]);

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading job...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <Briefcase size={40} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">Job not found</h3>
        <p className="text-sm text-gray-500 mb-4">This job may have been removed.</p>
        <Link
          href="/dashboard/jobs"
          className="inline-flex px-4 py-2 text-xs font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm"
        >
          Back to jobs
        </Link>
      </div>
    );
  }

  const local = isLocalJob(job);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto">
      <motion.div variants={fadeInUp}>
        <Link
          href="/dashboard/jobs"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Job Board
        </Link>
      </motion.div>

      <motion.article
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 mb-6"
        variants={staggerItem}
      >
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-700">
            {EMPLOYMENT_LABELS[job.employmentType] || job.employmentType}
          </span>
          {local && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-mustard-50 text-mustard-700">
              In {HOME_COUNTRY}
            </span>
          )}
          {job.category && (
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
              {job.category}
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400">{timeAgo(job.createdAtMs)}</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">{job.title}</h1>
        <p className="text-base text-gray-600 mb-5">{job.company}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-6 pb-5 border-b border-gray-100">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} /> {formatLocation(job.location)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Banknote size={13} />{" "}
            {job.salary && job.salary !== "Unspecified" ? job.salary : "Salary not stated"}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} /> {job.applicants || 0} applicants
          </span>
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-6">
          {job.description}
        </div>

        {job.skills.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 text-xs font-medium bg-gray-50 text-gray-700 rounded-full border border-gray-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {job.sourceName && (
          <p className="text-xs text-gray-400 mb-6">
            Listing verified from{" "}
            <span className="font-semibold text-gray-500">{job.sourceName}</span>. Apply to be
            taken to the employer&apos;s application page.
          </p>
        )}

        <div className="pt-4 border-t border-gray-100">
          <JobApplyPanel job={job} />
        </div>
      </motion.article>
    </motion.div>
  );
}
