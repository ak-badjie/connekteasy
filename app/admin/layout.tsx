"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { isAdmin, isSuperAdmin } from "@/app/lib/admin";
import ConnektIcon from "@/components/branding/ConnektIcon";
import {
  LayoutDashboard,
  CalendarRange,
  BookMarked,
  Users,
  ArrowLeft,
  LogOut,
  ShieldCheck,
  Briefcase,
  BadgeCheck,
  RefreshCw,
  Menu,
  X,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/verifications", label: "VA Reviews", Icon: BadgeCheck },
  { href: "/admin/content", label: "Content", Icon: CalendarRange },
  { href: "/admin/resources", label: "Resources", Icon: BookMarked },
  { href: "/admin/jobs", label: "Jobs & Opps", Icon: Briefcase },
  { href: "/admin/job-sync", label: "Job Sync", Icon: RefreshCw },
  { href: "/admin/users", label: "Users", Icon: Users },
];

/** Width of the slide-out menu; the page slides the same distance. */
const DRAWER_WIDTH = 264;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, signOutUser } = useAuth();
  const admin = isAdmin(userProfile);
  const superAdmin = isSuperAdmin(userProfile);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth/signin");
    else if (userProfile && !admin) router.replace("/dashboard");
  }, [user, userProfile, loading, admin, router]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  if (loading || !user || (userProfile && !admin)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href));

  const NavLinks = (
    <>
      {ADMIN_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => setDrawerOpen(false)}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            isActive(item.href)
              ? "bg-white/15 text-white"
              : "text-gray-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <item.Icon size={19} className="shrink-0" />
          {item.label}
        </Link>
      ))}
    </>
  );

  const BackToDashboard = (
    <div className="p-3">
      <Link
        href="/dashboard"
        onClick={() => setDrawerOpen(false)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
    </div>
  );

  const SignOutButton = (
    <div className="p-3 border-t border-white/10">
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-gray-200 hover:bg-white/10 transition-colors"
      >
        <LogOut size={14} /> Sign Out
      </button>
    </div>
  );

  const ConsoleBadge = (
    <p className="text-[10px] text-mustard-400 font-semibold inline-flex items-center gap-1">
      <ShieldCheck size={11} /> {superAdmin ? "Super Admin" : "Admin Console"}
    </p>
  );

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50">
      {/* Desktop rail */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-full bg-gray-900 text-gray-100">
        <Link href="/" className="flex items-center gap-2.5 px-6 h-16 shrink-0 border-b border-white/10">
          <ConnektIcon className="w-7 h-7 brightness-0 invert" />
          <div className="leading-tight">
            <p className="text-lg font-display font-bold text-white tracking-tight">CONNEKT</p>
            {ConsoleBadge}
          </div>
        </Link>
        {BackToDashboard}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-1">{NavLinks}</nav>
        {SignOutButton}
      </aside>

      {/* Same menu on a phone: the console has more sections than a bottom bar
          can hold, so it slides out and pushes the page across. */}
      <aside
        id="admin-menu"
        aria-hidden={!drawerOpen}
        style={{ width: DRAWER_WIDTH }}
        className={`lg:hidden fixed inset-y-0 left-0 z-[60] flex flex-col bg-gray-900 text-gray-100 shadow-2xl transition-transform duration-300 ease-out ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-white/10">
          <ConnektIcon className="w-7 h-7 brightness-0 invert" />
          <div className="leading-tight flex-1 min-w-0">
            <p className="text-base font-display font-bold text-white tracking-tight">CONNEKT</p>
            {ConsoleBadge}
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 -mr-1.5 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        {BackToDashboard}
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-1">{NavLinks}</nav>
        {SignOutButton}
      </aside>

      <AnimatePresence>
        {drawerOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="lg:hidden fixed inset-0 z-[55] bg-gray-900/50 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div
        style={{ transform: drawerOpen ? `translateX(${DRAWER_WIDTH}px)` : undefined }}
        className="flex-1 min-w-0 flex flex-col h-full transition-transform duration-300 ease-out lg:!transform-none"
      >
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            aria-controls="admin-menu"
          >
            <Menu size={22} />
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          <div className="ml-auto flex items-center gap-2 text-sm min-w-0">
            {superAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-gray-900 bg-mustard-500">
                <ShieldCheck size={12} /> Super Admin
              </span>
            )}
            <span className="hidden md:inline text-gray-500">Signed in as</span>
            <span className="font-semibold text-gray-900 truncate max-w-[140px] sm:max-w-[200px]">
              {userProfile?.email}
            </span>
          </div>
        </header>

        <main
          data-scroll-container
          className="flex-1 min-h-0 overflow-y-auto bg-gray-50"
        >
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
