"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import ConnektWalletIcon from "@/components/branding/ConnektWalletIcon";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    href: "/dashboard/projects",
    label: "My Projects",
    roles: ["client"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/proposals",
    label: "Proposals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    href: "/dashboard/wallet",
    label: "Wallet",
    roles: ["client", "va"],
    icon: (
      <span className="w-[18px] h-[18px] block"><ConnektWalletIcon /></span>
    ),
  },
  {
    href: "/dashboard/post",
    label: "Post a Project",
    roles: ["client"],
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    ),
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile, loading } = useAuth();

  // Route protection — redirect to sign in if not authenticated
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/signin");
      } else if (!user.emailVerified) {
        router.push("/auth/verify-email");
      }
    }
  }, [user, loading, router]);

  // Show nothing while checking auth
  if (loading || !user) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 flex-1 flex flex-col min-h-0 overflow-hidden relative h-[calc(100vh-theme(spacing.14))] sm:h-[calc(100vh-theme(spacing.16))]">
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex gap-4 sm:gap-6 h-full overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 h-full">
          <nav className="w-56 h-full overflow-y-auto no-scrollbar bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
            <div className="flex flex-col gap-1">    
              {navItems.map((item) => {
                // Filter out items not allowed for the user's role
                if (item.roles && userProfile?.role && !item.roles.includes(userProfile.role)) {
                  return null;
                }
                const isActive = pathname === item.href;
                return (
                  <motion.div key={item.href} whileTap={{ scale: 0.97 }}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-teal-50 text-teal-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <span
                        className={`shrink-0 ${      
                          isActive ? "text-teal-600" : "text-gray-400"
                        }`}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 h-full flex flex-col overflow-hidden pb-16 lg:pb-0">
          <motion.div
            className="flex-1 flex flex-col min-h-0"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 px-2 py-2 flex items-center justify-around pb-safe">
        {navItems.map((item) => {
          if (item.roles && userProfile?.role && !item.roles.includes(userProfile.role)) return null; 
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg min-w-[64px] transition-colors ${
                isActive ? "text-teal-600" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-teal-600" : "text-gray-400"}`}>
                {item.icon}
              </span>       
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );}
