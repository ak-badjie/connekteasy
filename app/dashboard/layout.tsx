"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { navItemsForRole, roleLabel } from "@/app/lib/roles";
import { isAdmin } from "@/app/lib/admin";
import type { UserRole } from "@/app/lib/types";
import ConnektIcon from "@/components/branding/ConnektIcon";
import { LogOut, Bell, Search, Crown, ChevronDown, ShieldAlert } from "lucide-react";

const BRAND_TAGLINE: Record<UserRole, string> = {
  student: "Learn. Intern. Grow.",
  job_seeker: "Your Career. Connected.",
  va: "Work. Earn. Grow.",
  client: "Empower. Hire. Grow.",
};

const PREMIUM_HREF: Record<UserRole, string> = {
  student: "/dashboard/internships",
  job_seeker: "/dashboard/membership",
  va: "/dashboard/wallet",
  client: "/dashboard/wallet",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, signOutUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/signin");
    else if (!user.emailVerified) router.push("/auth/verify-email");
    else if (userProfile && !userProfile.onboardingComplete) router.push("/onboarding");
  }, [user, userProfile, loading, router]);

  const onboardingPending = !!user && (!userProfile || !userProfile.onboardingComplete);

  if (loading || !user || onboardingPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = userProfile?.role;
  const baseItems = navItemsForRole(role);
  const items = isAdmin(userProfile)
    ? [...baseItems, { href: "/dashboard/admin", label: "Admin", Icon: ShieldAlert, roles: [] as UserRole[] }]
    : baseItems;
  const tagline = role ? BRAND_TAGLINE[role] : "Connecting talent";
  const premiumHref = role ? PREMIUM_HREF[role] : "/dashboard/wallet";

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    if (user?.displayName) return user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const displayName = userProfile?.firstName
    ? `${userProfile.firstName} ${userProfile.lastName || ""}`.trim()
    : user.displayName || "User";

  const Sidebar = (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-full bg-teal-900 text-teal-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-6 h-16 shrink-0 border-b border-white/10">
        <ConnektIcon className="w-7 h-7 brightness-0 invert" />
        <div className="leading-tight">
          <p className="text-lg font-display font-bold text-white tracking-tight">CONNEKT</p>
          <p className="text-[10px] text-teal-300 font-medium">{tagline}</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
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
      </nav>

      {/* Premium upsell */}
      <div className="p-3">
        <Link href={premiumHref} className="block rounded-2xl bg-teal-800/80 border border-white/10 p-4 hover:bg-teal-800 transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <Crown size={16} className="text-mustard-400" />
            <p className="text-sm font-bold text-white">Go Premium</p>
          </div>
          <p className="text-[11px] text-teal-200 leading-relaxed mb-3">
            Unlock exclusive tools and get more opportunities.
          </p>
          <span className="block text-center text-xs font-bold text-gray-900 bg-mustard-500 rounded-lg py-2 hover:bg-mustard-400 transition-colors">
            Upgrade Now
          </span>
        </Link>
      </div>

      <div className="p-3 border-t border-white/10">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-teal-100 hover:bg-white/10 transition-colors"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );

  const TopBar = (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center gap-3 px-4 sm:px-6">
      {/* Mobile logo */}
      <Link href="/" className="lg:hidden flex items-center gap-2">
        <ConnektIcon className="w-7 h-7 text-teal-600" />
      </Link>

      <div className="flex-1 max-w-xl hidden sm:block">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search opportunities, skills, people…"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <Link href="/dashboard/messages" className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={20} />
        </Link>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors">
            {userProfile?.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userProfile.profilePhotoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-xs font-bold">
                {getInitials()}
              </div>
            )}
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-bold text-gray-900 max-w-[140px] truncate">{displayName}</p>
              <p className="text-[11px] text-gray-500">{roleLabel(role)}</p>
            </div>
            <ChevronDown size={14} className={`hidden sm:block text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <Link href="/dashboard/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Profile</Link>
                  <Link href="/dashboard/wallet" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50">Wallet</Link>
                  <button onClick={handleSignOut} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100">Sign Out</button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );

  const MobileNav = (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-1 py-1.5 flex items-center justify-between pb-safe">
      {items.slice(0, 5).map((item) => {
        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 p-1 rounded-lg flex-1 min-w-0 transition-colors ${
              isActive ? "text-teal-600" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <item.Icon size={20} className="shrink-0" />
            <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50">
      {Sidebar}
      <div className="flex-1 min-w-0 flex flex-col h-full">
        {TopBar}
        <main className="flex-1 min-h-0 overflow-y-auto bg-gray-50 pb-24 lg:pb-0">
          <div className={pathname.includes("/messages") ? "h-full" : "p-4 sm:p-6 lg:p-8"}>
            {children}
          </div>
        </main>
      </div>
      {MobileNav}
    </div>
  );
}
