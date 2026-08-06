"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/app/lib/AuthContext";
import { isAdmin } from "@/app/lib/admin";
import ConnektIcon from "@/components/branding/ConnektIcon";
import { LayoutDashboard, CalendarRange, BookMarked, Users, ArrowLeft, LogOut, ShieldCheck, Briefcase, BadgeCheck } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard },
  { href: "/admin/verifications", label: "VA Reviews", Icon: BadgeCheck },
  { href: "/admin/content", label: "Content", Icon: CalendarRange },
  { href: "/admin/resources", label: "Resources", Icon: BookMarked },
  { href: "/admin/jobs", label: "Jobs & Opps", Icon: Briefcase },
  { href: "/admin/users", label: "Users", Icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, signOutUser } = useAuth();
  const admin = isAdmin(userProfile);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/auth/signin");
    else if (userProfile && !admin) router.replace("/dashboard");
  }, [user, userProfile, loading, admin, router]);

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

  const NavLinks = (
    <>
      {ADMIN_NAV.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive ? "bg-white/15 text-white" : "text-teal-100/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.Icon size={19} className="shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-full bg-gray-900 text-gray-100">
        <Link href="/" className="flex items-center gap-2.5 px-6 h-16 shrink-0 border-b border-white/10">
          <ConnektIcon className="w-7 h-7 brightness-0 invert" />
          <div className="leading-tight">
            <p className="text-lg font-display font-bold text-white tracking-tight">CONNEKT</p>
            <p className="text-[10px] text-mustard-400 font-semibold inline-flex items-center gap-1">
              <ShieldCheck size={11} /> Admin Console
            </p>
          </div>
        </Link>

        <div className="p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto no-scrollbar px-3 flex flex-col gap-1">{NavLinks}</nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-gray-200 hover:bg-white/10 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col h-full">
        {/* Top bar */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sm:px-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft size={16} /> <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>
          <div className="ml-auto flex items-center gap-2 text-sm">
            <span className="hidden sm:inline text-gray-500">Signed in as</span>
            <span className="font-semibold text-gray-900 truncate max-w-[160px]">{userProfile?.email}</span>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50 pb-24 lg:pb-8">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900 text-gray-300 z-50 px-1 py-1.5 flex items-center justify-between pb-safe">
        <Link href="/dashboard" className="flex flex-col items-center justify-center gap-1 p-1 flex-1 min-w-0 text-gray-400">
          <ArrowLeft size={20} />
          <span className="text-[9px] font-medium leading-none">Back</span>
        </Link>
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-1 flex-1 min-w-0 transition-colors ${
                isActive ? "text-mustard-400" : "text-gray-400 hover:text-white"
              }`}
            >
              <item.Icon size={20} className="shrink-0" />
              <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
