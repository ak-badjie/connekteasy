"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { slideDown } from "@/app/lib/animations";

export default function Navbar() {
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
                        <motion.div
                            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center"
                            whileHover={{ rotate: -6, scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#008080"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5 sm:w-[26px] sm:h-[26px]"
                            >
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                            </svg>
                        </motion.div>
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 group-hover:text-teal-600 transition-colors">
                            Connekt
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {[
                            { href: "/explore", label: "Explore" },
                            { href: "/dashboard", label: "Dashboard" },
                            { href: "/dashboard/post", label: "Post a Project" },
                        ].map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive(link.href)
                                        ? "text-teal-600 bg-teal-50"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                            >
                                {link.label}
                                {isActive(link.href) && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-500 rounded-full"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Sign In
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.96 }}
                            className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-500 rounded-lg hover:bg-teal-600 transition-colors shadow-sm"
                        >
                            Get Started
                        </motion.button>
                    </div>

                    {/* Mobile Menu Button */}
                    <motion.button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Toggle menu"
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {mobileOpen ? (
                                <path d="M18 6L6 18M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </motion.button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        className="md:hidden border-t border-gray-100 bg-white overflow-hidden"
                        variants={slideDown}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        <div className="px-3 py-3 space-y-1">
                            {[
                                { href: "/explore", label: "Explore" },
                                { href: "/dashboard", label: "Dashboard" },
                                { href: "/dashboard/post", label: "Post a Project" },
                            ].map((link, i) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 + 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive(link.href)
                                                ? "text-teal-600 bg-teal-50"
                                                : "text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <div className="pt-3 border-t border-gray-100 flex flex-col gap-2 px-1">
                                <button className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 text-left px-3 rounded-xl hover:bg-gray-50 transition-colors">
                                    Sign In
                                </button>
                                <button className="w-full py-3 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
