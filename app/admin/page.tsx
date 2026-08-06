"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  getAllUsers,
  getAllEvents,
  getAllCourses,
  getResources,
  getJobs,
} from "@/app/lib/firestore";
import { vaVerificationStatus } from "@/app/lib/verification";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { StatCard, Panel } from "@/app/dashboard/_components/kit";
import { Users, CalendarRange, BookOpen, BookMarked, Briefcase, ArrowRight, BadgeCheck } from "lucide-react";

export default function AdminOverview() {
  const [counts, setCounts] = useState({ users: 0, events: 0, courses: 0, resources: 0, jobs: 0, pendingVas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [u, e, c, r, j] = await Promise.allSettled([
        getAllUsers(),
        getAllEvents(),
        getAllCourses(),
        getResources(),
        getJobs(),
      ]);
      if (cancelled) return;
      const allUsers = u.status === "fulfilled" ? u.value : [];
      setCounts({
        users: allUsers.length,
        events: e.status === "fulfilled" ? e.value.length : 0,
        courses: c.status === "fulfilled" ? c.value.length : 0,
        resources: r.status === "fulfilled" ? r.value.length : 0,
        jobs: j.status === "fulfilled" ? j.value.length : 0,
        pendingVas: allUsers.filter(
          (p) => p.role === "va" && vaVerificationStatus(p) === "pending"
        ).length,
      });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const v = (n: number) => (loading ? "…" : n);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Admin Console</h1>
        <p className="text-sm text-gray-500 mt-1">Manage platform content, resources, and users.</p>
      </motion.div>

      <motion.div variants={staggerItem} className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard icon={<BadgeCheck size={20} />} value={v(counts.pendingVas)} label="VAs to review" accent="pink" href="/admin/verifications" />
        <StatCard icon={<Users size={20} />} value={v(counts.users)} label="Users" accent="teal" href="/admin/users" />
        <StatCard icon={<CalendarRange size={20} />} value={v(counts.events)} label="Events" accent="indigo" href="/admin/content" />
        <StatCard icon={<BookOpen size={20} />} value={v(counts.courses)} label="Courses" accent="mustard" href="/admin/content" />
        <StatCard icon={<BookMarked size={20} />} value={v(counts.resources)} label="Resources" accent="emerald" href="/admin/resources" />
        <StatCard icon={<Briefcase size={20} />} value={v(counts.jobs)} label="Open Jobs" accent="blue" href="/dashboard/jobs" />
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel title="Manage">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { label: "VA Verification", desc: "Approve freelancer training certificates", href: "/admin/verifications", Icon: BadgeCheck },
              { label: "Events & Courses", desc: "Publish workshops and learning tracks", href: "/admin/content", Icon: CalendarRange },
              { label: "Career Resources", desc: "Curate guides and links for seekers", href: "/admin/resources", Icon: BookMarked },
              { label: "Jobs & Opportunities", desc: "Post and manage jobs, internships, & PR opps", href: "/admin/jobs", Icon: Briefcase },
              { label: "Users & Roles", desc: "Grant admin access, review accounts", href: "/admin/users", Icon: Users },
            ].map((m) => (
              <Link key={m.href} href={m.href} className="flex flex-col gap-2 p-4 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors group">
                <m.Icon size={20} className="text-teal-600" />
                <p className="text-sm font-semibold text-gray-900">{m.label}</p>
                <p className="text-xs text-gray-500">{m.desc}</p>
                <span className="text-xs font-semibold text-teal-600 inline-flex items-center gap-1 mt-1">
                  Open <ArrowRight size={12} />
                </span>
              </Link>
            ))}
          </div>
        </Panel>
      </motion.div>
    </motion.div>
  );
}
