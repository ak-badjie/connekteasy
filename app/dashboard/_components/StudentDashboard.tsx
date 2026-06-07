"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getApplicationsByUser, getJobs, getUpcomingEvents, getCourses } from "@/app/lib/firestore";
import type { Job, PlatformEvent, Course } from "@/app/lib/types";
import { staggerContainer, staggerItem } from "@/app/lib/animations";
import {
  greeting,
  profileCompletion,
  deriveScore,
  StatCard,
  Panel,
  EmptyState,
  Bar,
  Avatar,
} from "./kit";
import {
  FileText,
  Heart,
  Eye,
  Target,
  GraduationCap,
  CheckCircle2,
  Circle,
  Sparkles,
  FileEdit,
  Users,
  Compass,
  MessageCircleQuestion,
  BookOpen,
  Calendar,
  Crown,
  MapPin,
} from "lucide-react";

function fmtDate(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function StudentDashboard() {
  const { user, userProfile } = useAuth();
  const [applications, setApplications] = useState(0);
  const [internships, setInternships] = useState<Job[]>([]);
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [appsR, jobsR, eventsR, coursesR] = await Promise.allSettled([
        getApplicationsByUser(user.uid),
        getJobs(),
        getUpcomingEvents(4),
        getCourses(3),
      ]);
      if (cancelled) return;
      if (appsR.status === "fulfilled") setApplications(appsR.value.length);
      if (jobsR.status === "fulfilled") setInternships(jobsR.value.filter((j) => j.employmentType === "internship").slice(0, 3));
      if (eventsR.status === "fulfilled") setEvents(eventsR.value);
      if (coursesR.status === "fulfilled") setCourses(coursesR.value);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const completion = profileCompletion(userProfile);
  const score = deriveScore(userProfile);
  const saved = userProfile?.savedJobs?.length ?? 0;
  const views = userProfile?.profileViews ?? 0;
  const progress = userProfile?.courseProgress ?? {};

  // Career readiness derived from real profile signals
  const journey = [
    { label: "Profile Completed", hint: "Your profile basics are set.", done: completion >= 80 },
    { label: "CV Uploaded", hint: "Your CV is visible to employers.", done: (userProfile?.certificates?.length ?? 0) > 0 },
    { label: "Skills Added", hint: `${userProfile?.skills?.length ?? 0} skills on your profile.`, done: (userProfile?.skills?.length ?? 0) >= 3 },
    { label: "First Application", hint: "Apply to your first internship.", done: applications > 0 },
    { label: "Internship Placement", hint: "Secure an internship.", done: false },
  ];

  const aiTools = [
    { label: "Improve My CV", Icon: FileEdit, href: "/dashboard/profile" },
    { label: "Prepare for Interview", Icon: Users, href: "/dashboard/messages" },
    { label: "Find Internships", Icon: Compass, href: "/dashboard/internships" },
    { label: "Get Career Advice", Icon: MessageCircleQuestion, href: "/dashboard/messages" },
  ];

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-7xl mx-auto space-y-5">
      {/* Header + completion */}
      <motion.div variants={staggerItem} className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            {greeting()}, {userProfile?.firstName || "there"}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">Your next opportunity is closer than you think.</p>
        </div>
        <div className="lg:w-[360px] bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">Complete your profile</span>
            <span className="text-sm font-bold text-teal-600">{completion}%</span>
          </div>
          <Bar value={completion} />
          <Link href="/dashboard/profile" className="text-xs font-semibold text-teal-600 mt-2 inline-block">
            Complete Profile →
          </Link>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<FileText size={20} />} value={loading ? "…" : applications} label="Applications" accent="teal" href="/dashboard/internships" />
        <StatCard icon={<Heart size={20} />} value={saved} label="Saved Opportunities" accent="pink" href="/dashboard/saved" />
        <StatCard icon={<Eye size={20} />} value={views} label="Profile Views" accent="blue" href="/dashboard/profile" />
        <StatCard icon={<Target size={20} />} value={`${score}%`} label="Employability Score" accent="mustard" href="/dashboard/profile" />
      </motion.div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Recommended Internships */}
        <motion.div variants={staggerItem}>
          <Panel title="Recommended Internships" action="View all" actionHref="/dashboard/internships">
            {internships.length === 0 ? (
              <EmptyState icon={<GraduationCap size={22} />} title="No internships yet" hint="New internships appear here as employers post them." />
            ) : (
              <div className="space-y-3">
                {internships.map((job) => (
                  <div key={job.id} className="flex items-center gap-3">
                    <Avatar name={job.company} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {job.company} · {job.location || "Remote"}
                      </p>
                    </div>
                    <Link href={`/internships/${job.id}`} className="shrink-0 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors">
                      Apply
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Career Readiness Journey */}
        <motion.div variants={staggerItem}>
          <Panel title="Career Readiness Journey">
            <div className="space-y-3">
              {journey.map((step) => (
                <div key={step.label} className="flex items-start gap-3">
                  {step.done ? (
                    <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={18} className="text-gray-300 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${step.done ? "text-gray-900" : "text-gray-500"}`}>{step.label}</p>
                    <p className="text-xs text-gray-400">{step.hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </motion.div>

        {/* AI Coach */}
        <motion.div variants={staggerItem}>
          <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-sm p-5 h-full">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-mustard-400" />
              <h2 className="font-display text-base font-bold">CONNEKT AI Coach</h2>
            </div>
            <p className="text-xs text-teal-100 mb-4">Your personal career assistant is here to help you succeed.</p>
            <Link href="/dashboard/messages" className="block text-center text-sm font-semibold bg-white/15 hover:bg-white/25 rounded-xl py-2.5 mb-3 transition-colors">
              ✦ Ask AI Anything
            </Link>
            <div className="grid grid-cols-2 gap-2">
              {aiTools.map((t) => (
                <Link key={t.label} href={t.href} className="flex flex-col gap-1.5 bg-white/10 hover:bg-white/20 rounded-xl p-2.5 transition-colors">
                  <t.Icon size={16} className="text-mustard-300" />
                  <span className="text-[11px] font-medium leading-tight">{t.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Continue Learning */}
        <motion.div variants={staggerItem} className="lg:col-span-1">
          <Panel title="Continue Learning" action="View all" actionHref="/dashboard/profile">
            {courses.length === 0 ? (
              <EmptyState icon={<BookOpen size={22} />} title="No courses yet" hint="Learning tracks will appear here once published." />
            ) : (
              <div className="space-y-4">
                {courses.map((c) => {
                  const p = progress[c.id] ?? 0;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-gray-800 truncate">{c.title}</p>
                        <span className="text-xs font-semibold text-gray-500">{p}%</span>
                      </div>
                      <Bar value={p} color="bg-mustard-500" />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div variants={staggerItem} className="lg:col-span-1">
          <Panel title="Upcoming Events">
            {events.length === 0 ? (
              <EmptyState icon={<Calendar size={22} />} title="No upcoming events" hint="Workshops and career fairs will show up here." />
            ) : (
              <div className="space-y-3">
                {events.map((e) => (
                  <div key={e.id} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                      <Calendar size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
                      <p className="text-xs text-gray-400">{e.date?.toMillis ? fmtDate(e.date.toMillis()) : ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </motion.div>

        {/* Premium */}
        <motion.div variants={staggerItem} className="lg:col-span-1">
          <div className="rounded-2xl bg-gray-900 text-white shadow-sm p-5 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={18} className="text-mustard-400" />
              <h2 className="font-display text-base font-bold">CONNEKT Premium</h2>
            </div>
            <p className="text-xs text-gray-300 mb-4">Unlock exclusive tools to accelerate your career.</p>
            <ul className="space-y-2 mb-5 text-xs text-gray-200">
              {["AI CV Builder", "Cover Letter Generator", "Interview Simulator", "Priority Applications"].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/dashboard/internships" className="mt-auto flex items-center justify-between gap-2 bg-mustard-500 text-gray-900 font-bold text-sm rounded-xl px-4 py-2.5 hover:bg-mustard-400 transition-colors">
              <span>Get Premium</span>
              <span className="inline-flex items-center gap-1 text-xs"><MapPin size={12} /> GMD 500/month</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
