"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel } from "@/app/dashboard/_components/kit";
import {
  Sparkles,
  FileEdit,
  FileText,
  Headphones,
  Target,
  Compass,
  MessageCircleQuestion,
  Mail,
  NotebookPen,
  ListTodo,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tool = { label: string; hint: string; Icon: LucideIcon; href: string };

const TOOLS: Record<string, { title: string; subtitle: string; tools: Tool[] }> = {
  student: {
    title: "AI Coach",
    subtitle: "Your personal career assistant for internships and growth.",
    tools: [
      { label: "Improve My CV", hint: "Polish your CV for employers", Icon: FileEdit, href: "/dashboard/profile" },
      { label: "Prepare for Interview", hint: "Practice common questions", Icon: Headphones, href: "/dashboard/messages" },
      { label: "Find Internships", hint: "Browse open placements", Icon: Compass, href: "/dashboard/internships" },
      { label: "Get Career Advice", hint: "Ask about your next step", Icon: MessageCircleQuestion, href: "/dashboard/messages" },
    ],
  },
  job_seeker: {
    title: "AI Career Tools",
    subtitle: "Tools to help you stand out and get hired faster.",
    tools: [
      { label: "CV Review", hint: "Get feedback on your CV", Icon: FileEdit, href: "/dashboard/profile" },
      { label: "Cover Letter Generator", hint: "Create personalized letters", Icon: FileText, href: "/dashboard/messages" },
      { label: "Interview Practice", hint: "Mock interviews", Icon: Headphones, href: "/dashboard/messages" },
      { label: "Job Matcher", hint: "Find roles that fit you", Icon: Target, href: "/dashboard/jobs" },
    ],
  },
  va: {
    title: "AI Assistant",
    subtitle: "Work faster with assistant-powered tools.",
    tools: [
      { label: "Draft Email", hint: "Professional emails in seconds", Icon: Mail, href: "/dashboard/messages" },
      { label: "Create Proposal", hint: "Win more projects", Icon: FileText, href: "/explore" },
      { label: "Meeting Notes", hint: "Summarize meetings", Icon: NotebookPen, href: "/dashboard/messages" },
      { label: "Task Planner", hint: "Organize your work", Icon: ListTodo, href: "/dashboard/proposals" },
    ],
  },
};

export default function AssistantPage() {
  const { userProfile } = useAuth();
  const role = userProfile?.role || "va";
  const cfg = TOOLS[role] || TOOLS.va;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">{cfg.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{cfg.subtitle}</p>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-2xl bg-gradient-to-br from-teal-700 to-teal-900 text-white shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-mustard-400" />
          <h2 className="font-display text-lg font-bold">Ask CONNEKT AI</h2>
        </div>
        <p className="text-sm text-teal-100 mb-4">Conversational AI guidance is rolling out soon. In the meantime, jump into a tool below.</p>
        <div className="flex gap-2">
          <input
            disabled
            placeholder="Ask anything about your career…"
            className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-white/10 placeholder-teal-200 text-white outline-none cursor-not-allowed"
          />
          <span className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-white/15 text-teal-100 self-stretch flex items-center">Soon</span>
        </div>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel title="Tools">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cfg.tools.map((t) => (
              <Link key={t.label} href={t.href} className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 text-teal-600 flex items-center justify-center shrink-0 group-hover:border-teal-200">
                  <t.Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500 truncate">{t.hint}</p>
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </motion.div>
    </motion.div>
  );
}
