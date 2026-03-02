"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">
            <motion.div
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={staggerContainer}
            >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <motion.div className="col-span-2 md:col-span-1" variants={staggerItem}>
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <svg
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#2dd4bf"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
                            </svg>
                            <span className="text-lg font-bold text-white">Connekt</span>
                        </Link>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                            Connecting virtual assistants with businesses that need them. Find the right talent, find the right
                            project.
                        </p>
                    </motion.div>

                    {/* For Clients */}
                    <motion.div variants={staggerItem}>
                        <h4 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">For Clients</h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            {["Post a Project", "Find Talent", "How It Works", "Pricing"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-xs sm:text-sm text-gray-400 hover:text-teal-400 transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* For VAs */}
                    <motion.div variants={staggerItem}>
                        <h4 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">For VAs</h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            {["Find Work", "Create Profile", "Explore Projects", "Resources"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-xs sm:text-sm text-gray-400 hover:text-teal-400 transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Company */}
                    <motion.div variants={staggerItem}>
                        <h4 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-3 sm:mb-4">Company</h4>
                        <ul className="space-y-2 sm:space-y-2.5">
                            {["About", "Blog", "Careers", "Contact", "Privacy Policy"].map((item) => (
                                <li key={item}>
                                    <Link href="#" className="text-xs sm:text-sm text-gray-400 hover:text-teal-400 transition-colors">
                                        {item}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                <motion.div
                    className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4"
                    variants={fadeInUp}
                >
                    <p className="text-xs sm:text-sm text-gray-500">© 2026 Connekt. All rights reserved.</p>
                    <div className="flex items-center gap-5">
                        {["Twitter", "LinkedIn", "Instagram"].map((social) => (
                            <Link
                                key={social}
                                href="#"
                                className="text-xs sm:text-sm text-gray-500 hover:text-teal-400 transition-colors"
                            >
                                {social}
                            </Link>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </footer>
    );
}
