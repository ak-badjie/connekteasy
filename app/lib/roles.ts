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
// One flag per thing a role is allowed to do. Every gate in the app should
// read from here rather than comparing role strings inline.
export interface RoleCapabilities {
  postProject: boolean; // create project briefs + hold escrow
  manageProjects: boolean; // "My Projects" view
  receiveProposals: boolean; // employers review incoming proposals
  sendProposals: boolean; // freelancers send proposals to projects
  exploreProjects: boolean; // browse the open-project marketplace
  postJobs: boolean; // post jobs / internships, manage applicants
  browseJobs: boolean; // browse + apply to the job board
  browseInternships: boolean; // access the subscription-gated internship area
  hasProfessionalProfile: boolean; // shows skills / rate / portfolio sections
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

// Falls back to the freelancer capability set while a profile is still loading
// (role === undefined) so the UI never crashes on a missing role.
export function caps(role?: UserRole | null): RoleCapabilities {
  return (role && ROLE_CAPS[role]) || ROLE_CAPS.va;
}

export function isSeeker(role?: UserRole | null): boolean {
  return role === "student" || role === "job_seeker";
}

export function roleLabel(role?: UserRole | null): string {
  return (role && ROLE_LABELS[role]) || "Member";
}

// ─── Dashboard sidebar navigation ──────────────────────────
export interface DashboardNavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  roles: UserRole[];
}

const ALL_ROLES: UserRole[] = ["client", "va", "student", "job_seeker"];

export const DASHBOARD_NAV: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", Icon: LayoutDashboard, roles: ALL_ROLES },
  { href: "/dashboard/projects", label: "My Projects", Icon: FolderOpen, roles: ["client"] },
  { href: "/dashboard/post", label: "Post Project", Icon: PenLine, roles: ["client"] },
  { href: "/explore", label: "Find Work", Icon: Search, roles: ["va"] },
  { href: "/dashboard/jobs", label: "Jobs", Icon: Briefcase, roles: ["client", "va", "job_seeker"] },
  { href: "/dashboard/membership", label: "Membership", Icon: ShieldCheck, roles: ["job_seeker"] },
  { href: "/dashboard/internships", label: "Internships", Icon: GraduationCap, roles: ["student"] },
  { href: "/dashboard/proposals", label: "Proposals", Icon: FileText, roles: ["client", "va"] },
  { href: "/dashboard/messages", label: "Messages", Icon: MessageSquare, roles: ALL_ROLES },
  { href: "/dashboard/profile", label: "Profile", Icon: UserIcon, roles: ALL_ROLES },
  { href: "/dashboard/wallet", label: "Wallet", Icon: Wallet, roles: ALL_ROLES },
];

export function navItemsForRole(role?: UserRole | null): DashboardNavItem[] {
  // While the profile loads, show only the universal items.
  if (!role) return DASHBOARD_NAV.filter((i) => i.roles.length === ALL_ROLES.length);
  return DASHBOARD_NAV.filter((i) => i.roles.includes(role));
}

// The landing route a role should be sent to when they have no business on a
// page they tried to open.
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
