"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
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
        href: "/dashboard/post",
        label: "Post a Project",
        icon: (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
            </svg>
        ),
    },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                    {/* Sidebar — horizontal scroll on mobile, fixed sidebar on desktop */}
                    <aside className="lg:w-56 shrink-0">
                        <nav className="lg:sticky lg:top-24 bg-white rounded-xl border border-gray-200 p-1.5 sm:p-2 lg:p-3">
                            <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible no-scrollbar -mx-1.5 px-1.5 sm:mx-0 sm:px-0">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <motion.div key={item.href} whileTap={{ scale: 0.97 }}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-2 sm:gap-2.5 px-3 py-2 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${isActive
                                                        ? "bg-teal-50 text-teal-700"
                                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                                    }`}
                                            >
                                                <span className={`shrink-0 ${isActive ? "text-teal-600" : "text-gray-400"}`}>{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <motion.main
                        className="flex-1 min-w-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                    >
                        {children}
                    </motion.main>
                </div>
            </div>
        </div>
    );
}
