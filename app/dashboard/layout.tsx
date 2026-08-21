"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { navItemsForRole, roleLabel } from "@/app/lib/roles";
import { isAdmin, isSuperAdmin } from "@/app/lib/admin";
import { useMembership } from "@/app/lib/useMembership";
import { routeNeedsMembership, roleHasGatedRoutes } from "@/app/lib/access";
import { vaAwaitingApproval } from "@/app/lib/verification";
import { shouldPromptForWhatsApp } from "@/app/lib/notifications";
import MembershipGate from "./_components/MembershipGate";
import VaVerificationGate from "./_components/VaVerificationGate";
import WhatsAppOptInModal from "@/app/components/WhatsAppOptInModal";
import type { UserRole } from "@/app/lib/types";
import ConnektIcon from "@/components/branding/ConnektIcon";
import {
  LogOut,
  Bell,
  Search,
  Crown,
  ChevronDown,
  ShieldAlert,
  Lock,
  Menu,
  X,
} from "lucide-react";

const BRAND_TAGLINE: Record<UserRole, string> = {
  student: "Learn. Intern. Grow.",
  job_seeker: "Your Career. Connected.",
  va: "Work. Earn. Grow.",
  client: "Empower. Hire. Grow.",
};

const PREMIUM_HREF: Record<UserRole, string> = {
  student: "/dashboard/membership",
  job_seeker: "/dashboard/membership",
  va: "/dashboard/wallet",
  client: "/dashboard/membership",
};

/** Width of the slide-out menu; the page slides the same distance. */
const DRAWER_WIDTH = 264;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, signOutUser, refreshProfile } = useAuth();
  const membership = useMembership();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [promptDone, setPromptDone] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.push("/auth/signin");
    else if (!user.emailVerified) router.push("/auth/verify-email");
    else if (userProfile && !userProfile.onboardingComplete) router.push("/onboarding");
  }, [user, userProfile, loading, router]);

  // Navigating is the end of the menu, on every screen size.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // A menu that covers the page should not leave the page scrolling behind it.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const onboardingPending = !!user && (!userProfile || !userProfile.onboardingComplete);

  if (loading || !user || onboardingPending) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = userProfile?.role;
  const admin = isAdmin(userProfile);
  const superAdmin = isSuperAdmin(userProfile);
  const baseItems = navItemsForRole(role);
  const items = admin
    ? [...baseItems, { href: "/admin", label: "Admin", Icon: ShieldAlert }]
    : baseItems;
  const tagline = role ? BRAND_TAGLINE[role] : "Connecting talent";
  const premiumHref = role ? PREMIUM_HREF[role] : "/dashboard/wallet";

  // Freelancers wait behind admin approval of their VA accreditation — that
  // gate outranks everything else, so no dashboard route opens until it clears.
  const vaGated = vaAwaitingApproval(userProfile);

  // A single gate for the whole dashboard: any route not listed as free in
  // access.ts is locked until the role's membership is paid up. Admins bypass.
  const unlocked = membership.active || membership.bypass || !membership.required;
  const isLocked = (href: string) => vaGated || (!unlocked && routeNeedsMembership(role, href));
  const gated = !membership.loading && !vaGated && isLocked(pathname);

  // Everyone who has not answered the WhatsApp question gets asked here — this
  // is what reaches the members who signed up before job alerts existed.
  const showWhatsAppPrompt =
    !promptDone && !membership.loading && shouldPromptForWhatsApp(userProfile);

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

  const isActiveHref = (href: string) =>
    pathname === href || (pathname.startsWith(href) && href !== "/dashboard");

  /** The nav list, shared by the desktop rail and the mobile drawer. */
  const NavList = (
    <nav className="flex-1 overflow-y-auto no-scrollbar p-3 flex flex-col gap-1">
      {items.map((item) => {
        const locked = isLocked(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActiveHref(item.href)
                ? "bg-white/15 text-white"
                : "text-teal-100/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <item.Icon size={19} className="shrink-0" />
            {item.label}
            {locked && <Lock size={13} className="ml-auto shrink-0 text-mustard-400/80" />}
          </Link>
        );
      })}
    </nav>
  );

  const PremiumUpsell =
    !vaGated && !unlocked && membership.plan && roleHasGatedRoutes(role) ? (
      <div className="p-3">
        <Link
          href={premiumHref}
          onClick={() => setDrawerOpen(false)}
          className="block rounded-2xl bg-teal-800/80 border border-white/10 p-4 hover:bg-teal-800 transition-colors"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Crown size={16} className="text-mustard-400" />
            <p className="text-sm font-bold text-white">{membership.plan.name}</p>
          </div>
          <p className="text-[11px] text-teal-200 leading-relaxed mb-3">
            {membership.plan.tagline}
          </p>
          <span className="block text-center text-xs font-bold text-gray-900 bg-mustard-500 rounded-lg py-2 hover:bg-mustard-400 transition-colors">
            Subscribe — {membership.plan.priceGMD} GMD
          </span>
        </Link>
      </div>
    ) : null;

  const SignOutButton = (
    <div className="p-3 border-t border-white/10">
      <button
        onClick={handleSignOut}
        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-bold text-teal-100 hover:bg-white/10 transition-colors"
      >
        <LogOut size={14} /> Sign Out
      </button>
    </div>
  );

  const Sidebar = (
    <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-full bg-teal-900 text-teal-50">
      <Link href="/" className="flex items-center gap-2.5 px-6 h-16 shrink-0 border-b border-white/10">
        <ConnektIcon className="w-7 h-7 brightness-0 invert" />
        <div className="leading-tight">
          <p className="text-lg font-display font-bold text-white tracking-tight">CONNEKT</p>
          <p className="text-[10px] text-teal-300 font-medium">{tagline}</p>
        </div>
      </Link>
      {NavList}
      {PremiumUpsell}
      {SignOutButton}
    </aside>
  );

  /**
   * The same menu on a phone. The bottom bar only has room for five items and
   * the sidebar has a dozen, so this is how the rest of the dashboard is
   * reachable. Opening it pushes the page aside rather than covering it, so
   * you can still see where you are.
   */
  const Drawer = (
    <aside
      id="dashboard-menu"
      aria-hidden={!drawerOpen}
      style={{ width: DRAWER_WIDTH }}
      className={`lg:hidden fixed inset-y-0 left-0 z-[60] flex flex-col bg-teal-900 text-teal-50 shadow-2xl transition-transform duration-300 ease-out ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-2.5 px-5 h-16 shrink-0 border-b border-white/10">
        <ConnektIcon className="w-7 h-7 brightness-0 invert" />
        <div className="leading-tight flex-1 min-w-0">
          <p className="text-base font-display font-bold text-white tracking-tight">CONNEKT</p>
          <p className="text-[10px] text-teal-300 font-medium truncate">{tagline}</p>
        </div>
        <button
          onClick={() => setDrawerOpen(false)}
          className="p-1.5 -mr-1.5 rounded-lg text-teal-200 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-3">
        {userProfile?.profilePhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={userProfile.profilePhotoUrl}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-white/20"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center text-xs font-bold">
            {getInitials()}
          </div>
        )}
        <div className="min-w-0 leading-tight">
          <p className="text-sm font-bold text-white truncate">{displayName}</p>
          <p className="text-[11px] text-teal-300">
            {superAdmin ? "Super Admin" : admin ? "Admin" : roleLabel(role)}
          </p>
        </div>
      </div>

      {NavList}
      {PremiumUpsell}
      {SignOutButton}
    </aside>
  );

  const TopBar = (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center gap-2 sm:gap-3 px-3 sm:px-6">
      {/* The whole dashboard, one tap away on a phone. */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        aria-label="Open menu"
        aria-expanded={drawerOpen}
        aria-controls="dashboard-menu"
      >
        <Menu size={22} />
      </button>

      <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0">
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

      <div className="flex items-center gap-1 sm:gap-3 ml-auto">
        {/* Staff shortcut. On a phone this is the only way into the console. */}
        {admin && (
          <Link
            href="/admin"
            title={superAdmin ? "Super Admin console" : "Admin console"}
            className={`relative inline-flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              superAdmin
                ? "text-gray-900 bg-mustard-500 hover:bg-mustard-400"
                : "text-teal-700 bg-teal-50 hover:bg-teal-100"
            }`}
          >
            <ShieldAlert size={17} className="shrink-0" />
            <span className="hidden sm:inline">{superAdmin ? "Super Admin" : "Admin"}</span>
          </Link>
        )}

        <Link
          href="/dashboard/messages"
          className="relative p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </Link>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-1 pr-1 sm:pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors"
          >
            {userProfile?.profilePhotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userProfile.profilePhotoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center text-xs font-bold">
                {getInitials()}
              </div>
            )}
            <div className="hidden md:block text-left leading-tight">
              <p className="text-sm font-bold text-gray-900 max-w-[140px] truncate">{displayName}</p>
              <p className="text-[11px] text-gray-500">{roleLabel(role)}</p>
            </div>
            <ChevronDown size={14} className={`hidden md:block text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
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
                  {admin && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50">
                      {superAdmin ? "Super Admin console" : "Admin console"}
                    </Link>
                  )}
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
      {items.slice(0, 4).map((item) => {
        const locked = isLocked(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-1 p-1 rounded-lg flex-1 min-w-0 transition-colors ${
              isActiveHref(item.href) ? "text-teal-600" : "text-gray-400 hover:text-gray-700"
            }`}
          >
            <item.Icon size={20} className="shrink-0" />
            {locked && (
              <Lock size={10} className="absolute top-0.5 right-1/4 text-mustard-500" />
            )}
            <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">{item.label}</span>
          </Link>
        );
      })}
      {/* Fifth slot opens the full menu rather than one more destination. */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="flex flex-col items-center justify-center gap-1 p-1 rounded-lg flex-1 min-w-0 text-gray-400 hover:text-gray-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} className="shrink-0" />
        <span className="text-[9px] font-medium leading-none">More</span>
      </button>
    </div>
  );

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50">
      {Sidebar}
      {Drawer}

      <AnimatePresence>
        {drawerOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="lg:hidden fixed inset-0 z-[55] bg-gray-900/40 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div
        style={{ transform: drawerOpen ? `translateX(${DRAWER_WIDTH}px)` : undefined }}
        className="flex-1 min-w-0 flex flex-col h-full transition-transform duration-300 ease-out lg:!transform-none"
      >
        {TopBar}
        <main
          data-scroll-container
          className="flex-1 min-h-0 overflow-y-auto bg-gray-50 pb-24 lg:pb-0"
        >
          <div className={pathname.includes("/messages") && !gated && !vaGated ? "h-full" : "p-4 sm:p-6 lg:p-8"}>
            {vaGated ? (
              <VaVerificationGate />
            ) : membership.loading && routeNeedsMembership(role, pathname) ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : gated && membership.plan ? (
              <MembershipGate plan={membership.plan} />
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {MobileNav}

      {showWhatsAppPrompt && (
        <WhatsAppOptInModal
          firstName={userProfile?.firstName}
          defaultNumber={userProfile?.whatsappNumber || ""}
          onDone={async () => {
            setPromptDone(true);
            await refreshProfile();
          }}
        />
      )}
    </div>
  );
}
