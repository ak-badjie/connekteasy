import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FolderOpen,
  PenLine,
  Search,
  Briefcase,
  GraduationCap,
  FileText,
  MessageSquare,
  User as UserIcon,
  Wallet,
  ShieldCheck,
  Bookmark,
  Settings,
  Sparkles,
  Calendar,
  BookOpen,
  BookMarked,
  TrendingUp,
  Users,
  Star,
  CalendarClock,
  ClipboardList,
  Building2,
  Compass,
  Crown,
} from "lucide-react";
import type { UserRole } from "./types";

// ─── Human-readable labels ─────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  client: "Employer",
  va: "Freelancer",
  student: "Student",
  job_seeker: "Job Seeker",
};

export const ROLE_TAGLINES: Record<UserRole, string> = {
  client: "Hire Talent",
  va: "Offer Services",
  student: "Find Internships",
  job_seeker: "Find Jobs",
};

// ─── Capabilities ──────────────────────────────────────────
export interface RoleCapabilities {
  postProject: boolean;
  manageProjects: boolean;
  receiveProposals: boolean;
  sendProposals: boolean;
  exploreProjects: boolean;
  postJobs: boolean;
  browseJobs: boolean;
  browseInternships: boolean;
  hasProfessionalProfile: boolean;
}

const SEEKER_BASE: RoleCapabilities = {
  postProject: false,
  manageProjects: false,
  receiveProposals: false,
  sendProposals: false,
  exploreProjects: false,
  postJobs: false,
  browseJobs: false,
  browseInternships: false,
  hasProfessionalProfile: true,
};

export const ROLE_CAPS: Record<UserRole, RoleCapabilities> = {
  client: {
    postProject: true,
    manageProjects: true,
    receiveProposals: true,
    sendProposals: false,
    exploreProjects: false,
    postJobs: true,
    browseJobs: true,
    browseInternships: false,
    hasProfessionalProfile: false,
  },
  va: {
    postProject: false,
    manageProjects: false,
    receiveProposals: false,
    sendProposals: true,
    exploreProjects: true,
    postJobs: false,
    browseJobs: true,
    browseInternships: false,
    hasProfessionalProfile: true,
  },
  student: { ...SEEKER_BASE, browseInternships: true },
  job_seeker: { ...SEEKER_BASE, browseJobs: true },
};

export function caps(role?: UserRole | null): RoleCapabilities {
  return (role && ROLE_CAPS[role]) || ROLE_CAPS.va;
}

export function isSeeker(role?: UserRole | null): boolean {
  return role === "student" || role === "job_seeker";
}

export function roleLabel(role?: UserRole | null): string {
  return (role && ROLE_LABELS[role]) || "Member";
}

// ─── Dashboard sidebar navigation (one menu per role, matching mockups) ──
export interface DashboardNavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

export const NAV_BY_ROLE: Record<UserRole, DashboardNavItem[]> = {
  student: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/internships", label: "Opportunities", Icon: Compass },
    { href: "/dashboard/applications", label: "Applications", Icon: FileText },
    { href: "/dashboard/learning", label: "Learning Hub", Icon: BookOpen },
    { href: "/dashboard/assistant", label: "AI Coach", Icon: Sparkles },
    { href: "/dashboard/messages", label: "Messages", Icon: MessageSquare },
    { href: "/dashboard/events", label: "Events", Icon: Calendar },
    { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
    { href: "/dashboard/membership", label: "Membership", Icon: Crown },
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  ],
  job_seeker: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/jobs", label: "Jobs", Icon: Briefcase },
    { href: "/dashboard/applications", label: "My Applications", Icon: FileText },
    { href: "/dashboard/saved", label: "Saved Jobs", Icon: Bookmark },
    { href: "/dashboard/messages", label: "Messages", Icon: MessageSquare },
    { href: "/dashboard/assistant", label: "AI Career Tools", Icon: Sparkles },
    { href: "/dashboard/salary", label: "Salary Insights", Icon: TrendingUp },
    { href: "/dashboard/resources", label: "Career Resources", Icon: BookMarked },
    { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
    { href: "/dashboard/membership", label: "Membership", Icon: Crown },
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  ],
  va: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/work", label: "Projects", Icon: Briefcase },
    { href: "/dashboard/proposals", label: "Proposals", Icon: FileText },
    { href: "/dashboard/clients", label: "My Clients", Icon: Users },
    { href: "/dashboard/wallet", label: "Earnings", Icon: Wallet },
    { href: "/dashboard/messages", label: "Messages", Icon: MessageSquare },
    { href: "/dashboard/reviews", label: "Reviews", Icon: Star },
    { href: "/dashboard/assistant", label: "AI Assistant", Icon: Sparkles },
    { href: "/dashboard/analytics", label: "Analytics", Icon: TrendingUp },
    { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  ],
  client: [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/jobs/my-jobs", label: "Jobs", Icon: Briefcase },
    { href: "/dashboard/manage-internships", label: "Internships", Icon: GraduationCap },
    { href: "/dashboard/applicants", label: "Applicants", Icon: Users },
    { href: "/dashboard/talent", label: "Talent Search", Icon: Search },
    { href: "/dashboard/interviews", label: "Interviews", Icon: CalendarClock },
    { href: "/dashboard/assessments", label: "Assessments", Icon: ClipboardList },
    { href: "/dashboard/messages", label: "Messages", Icon: MessageSquare },
    { href: "/dashboard/analytics", label: "Analytics", Icon: TrendingUp },
    { href: "/dashboard/profile", label: "Company Profile", Icon: Building2 },
    { href: "/dashboard/membership", label: "Employer Pro", Icon: Crown },
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  ],
};

// Extra routes that exist but aren't primary nav items (kept for capability use)
export { FolderOpen, PenLine, ShieldCheck };

export function navItemsForRole(role?: UserRole | null): DashboardNavItem[] {
  if (role && NAV_BY_ROLE[role]) return NAV_BY_ROLE[role];
  return [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/messages", label: "Messages", Icon: MessageSquare },
    { href: "/dashboard/profile", label: "Profile", Icon: UserIcon },
    { href: "/dashboard/settings", label: "Settings", Icon: Settings },
  ];
}

export function homeRouteForRole(role?: UserRole | null): string {
  switch (role) {
    case "student":
      return "/dashboard/internships";
    case "job_seeker":
      return "/dashboard/jobs";
    default:
      return "/dashboard";
  }
}
