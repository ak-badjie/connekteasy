"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { fadeInUp, iconHover, iconTap } from "@/app/lib/animations";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  User as UserIcon,
  Wallet,
  LogOut
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: <LayoutDashboard size={20} /> },
  { href: "/dashboard/proposals", label: "Proposals", icon: <FileText size={20} /> },
  { href: "/dashboard/messages", label: "Messages", icon: <MessageSquare size={20} /> },
  { href: "/dashboard/profile", label: "Profile", icon: <UserIcon size={20} /> },
  { href: "/dashboard/wallet", label: "Wallet", icon: <Wallet size={20} /> },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading, signOutUser } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/signin");
      } else if (!user.emailVerified) {
        router.push("/auth/verify-email");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="bg-gray-50 flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  const getInitials = () => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName[0]}${userProfile.lastName[0]}`.toUpperCase();
    }
    if (user?.displayName) {
      return user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <div className="flex w-full h-[calc(100vh-theme(spacing.14))] sm:h-[calc(100vh-theme(spacing.16))] overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-[260px] shrink-0 h-full border-r border-gray-200 bg-white">
        <nav className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col gap-1.5">
          {navItems.map((item) => {
            if (item.roles && userProfile?.role && !item.roles.includes(userProfile.role)) {
              return null;
            }
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");
            
            return (
              <motion.div key={item.href} whileTap={{ scale: 0.97 }}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      isActive ? "text-mustard-600" : "text-gray-400"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex flex-col gap-3">
            <Link href="/dashboard/profile" className="flex items-center gap-3 group">
              {userProfile?.profilePhotoUrl ? (
                <img src={userProfile.profilePhotoUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover border border-gray-200 group-hover:border-teal-500 transition-colors" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold group-hover:shadow-md transition-all">
                  {getInitials()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-teal-700 transition-colors">
                  {userProfile?.firstName ? `${userProfile.firstName} ${userProfile.lastName}` : user.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">{userProfile?.role || "User"}</p>
              </div>
            </Link>
            
            <button onClick={handleSignOut} className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all">
              <LogOut size={14} strokeWidth={2.5} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-gray-50">
        <motion.div
          className={`flex-1 flex flex-col min-h-0 overflow-y-auto relative origin-top ${
            pathname.includes("/messages") ? "" : "p-4 sm:p-6 lg:p-8"
          }`}
          variants={fadeInUp}
          initial="hidden"
          animate="visible"
          key={pathname}
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 flex items-center justify-around pb-safe">
        {navItems.map((item) => {
          if (item.roles && userProfile?.role && !item.roles.includes(userProfile.role)) return null;
          const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/dashboard");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg min-w-[64px] transition-colors ${   
                isActive ? "text-mustard-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-mustard-600" : "text-gray-400"}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
