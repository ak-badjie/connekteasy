"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import type { UserProfile } from "@/app/lib/types";

// ─── Pure helpers ──────────────────────────────────────────
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatGMD(n: number): string {
  return `GMD ${Math.round(n).toLocaleString("en-GM")}`;
}

export function initials(name?: string): string {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Profile completion (0-100) computed from real profile fields.
export function profileCompletion(p?: UserProfile | null): number {
  if (!p) return 0;
  const checks = [
    !!p.firstName,
    !!p.lastName,
    !!p.title,
    !!p.bio && p.bio.length > 20,
    !!p.location,
    !!p.profilePhotoUrl,
    (p.skills?.length ?? 0) > 0,
    (p.education?.length ?? 0) > 0,
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

// Deterministic employability / match score derived from real profile signals.
export function deriveScore(p?: UserProfile | null): number {
  if (!p) return 0;
  let score = Math.round(profileCompletion(p) * 0.6); // up to 60
  score += Math.min((p.skills?.length ?? 0) * 4, 20); // up to 20
  score += Math.min((p.education?.length ?? 0) * 5, 10); // up to 10
  if ((p.portfolioProjects?.length ?? 0) > 0) score += 5;
  if (p.bio && p.bio.length > 80) score += 5;
  return Math.min(score, 100);
}

// ─── Accent tokens ─────────────────────────────────────────
const ACCENTS: Record<string, string> = {
  teal: "bg-teal-50 text-teal-600 border-teal-100",
  mustard: "bg-mustard-50 text-mustard-600 border-mustard-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  pink: "bg-pink-50 text-pink-500 border-pink-100",
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  gray: "bg-gray-50 text-gray-600 border-gray-200",
};

// ─── StatCard ──────────────────────────────────────────────
export function StatCard({
  icon,
  value,
  label,
  accent = "teal",
  href,
  footer,
}: {
  icon: ReactNode;
  value: ReactNode;
  label: string;
  accent?: keyof typeof ACCENTS | string;
  href?: string;
  footer?: string;
}) {
  const body = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 h-full flex flex-col">
      <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center mb-3 ${ACCENTS[accent] || ACCENTS.teal}`}>
        {icon}
      </div>
      <p className="text-2xl sm:text-[28px] leading-none font-bold text-gray-900">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 mt-1">{label}</p>
      {href && (
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-600">
          {footer || "View all"} <ArrowRight size={12} />
        </span>
      )}
    </div>
  );
  if (href) {
    return (
      <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}>
        <Link href={href} className="block h-full">
          {body}
        </Link>
      </motion.div>
    );
  }
  return body;
}

// ─── Panel ─────────────────────────────────────────────────
export function Panel({
  title,
  action,
  actionHref,
  children,
  className = "",
  dark = false,
}: {
  title?: string;
  action?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border shadow-sm ${
        dark ? "bg-teal-800 border-teal-700 text-white" : "bg-white border-gray-100"
      } ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/60">
          <h2 className={`font-display text-base font-bold ${dark ? "text-white" : "text-gray-900"}`}>{title}</h2>
          {action && actionHref && (
            <Link href={actionHref} className="text-xs font-semibold text-teal-600 hover:text-teal-700 inline-flex items-center gap-1">
              {action} <ArrowRight size={12} />
            </Link>
          )}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── EmptyState ────────────────────────────────────────────
export function EmptyState({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {hint && <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{hint}</p>}
    </div>
  );
}

// ─── Bar (horizontal progress) ─────────────────────────────
export function Bar({ value, color = "bg-teal-500" }: { value: number; color?: string }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

// ─── Ring (circular progress) ──────────────────────────────
export function Ring({ value, size = 84, label }: { value: number; size?: number; label?: string }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          className="text-teal-600"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
        />
      </svg>
      <span className="absolute text-sm font-bold text-gray-900">{label ?? `${pct}%`}</span>
    </div>
  );
}

// ─── Avatar ────────────────────────────────────────────────
export function Avatar({ name, src, size = 40 }: { name?: string; src?: string; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name || ""} className="rounded-full object-cover border border-gray-200" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}
