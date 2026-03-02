"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SearchBar from "./components/SearchBar";
import CategoryIcon from "./components/CategoryIcon";
import { categories } from "./lib/data";
import { FileEdit, Handshake, Rocket, ArrowRight } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem, scaleIn } from "./lib/animations";

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-teal-50/30" />
        <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-teal-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-teal-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-24 pb-16 sm:pb-20 md:pb-28">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-xs sm:text-sm font-medium text-teal-700 mb-5 sm:mb-6"
              variants={fadeInUp}
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-teal-500 animate-pulse" />
              Over 1,000+ projects posted this month
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-4 sm:mb-5 px-2 sm:px-0"
              variants={fadeInUp}
            >
              Find the right project
              <br />
              <span className="gradient-text">— or the right talent</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="text-base sm:text-lg md:text-xl text-gray-500 max-w-xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0"
              variants={fadeInUp}
            >
              Connekt makes it simple. Business owners post projects, virtual assistants find work. No complexity, just
              connection.
            </motion.p>

            {/* Search Bar */}
            <motion.div className="max-w-2xl mx-auto mb-5 sm:mb-6 px-2 sm:px-0" variants={scaleIn}>
              <SearchBar size="large" placeholder="Try &quot;social media management&quot; or &quot;data entry&quot;..." />
            </motion.div>

            {/* Popular searches */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2 sm:px-0"
              variants={fadeInUp}
            >
              <span className="text-gray-400">Popular:</span>
              {["Admin Support", "Social Media", "Data Entry", "Bookkeeping", "Content Writing"].map((term) => (
                <Link
                  key={term}
                  href="/explore"
                  className="px-2.5 sm:px-3 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-teal-300 hover:text-teal-600 transition-colors"
                >
                  {term}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trusted By (Social Proof) */}
      <motion.section
        className="border-y border-gray-100 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <p className="text-center text-xs sm:text-sm text-gray-400 font-medium mb-4 sm:mb-6">
            TRUSTED BY TEAMS AT
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 md:gap-14 text-gray-300">
            {["Notion", "Stripe", "Shopify", "Slack", "Linear", "Vercel"].map((brand) => (
              <span key={brand} className="text-base sm:text-lg md:text-xl font-bold tracking-tight">
                {brand}
              </span>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <section className="py-14 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-10 sm:mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">How Connekt works</h2>
            <p className="text-base sm:text-lg text-gray-500 max-w-lg mx-auto px-4 sm:px-0">
              Three simple steps to find your next project or the perfect assistant.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 md:gap-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
          >
            {[
              {
                step: "01",
                icon: <FileEdit size={24} className="text-teal-600 sm:w-7 sm:h-7" />,
                title: "Post or Browse",
                desc: "Business owners post projects with details. VAs browse and discover opportunities that match their skills.",
              },
              {
                step: "02",
                icon: <Handshake size={24} className="text-teal-600 sm:w-7 sm:h-7" />,
                title: "Connect",
                desc: "Found the right match? Apply to a project or review applicants. Connekt brings both sides together.",
              },
              {
                step: "03",
                icon: <Rocket size={24} className="text-teal-600 sm:w-7 sm:h-7" />,
                title: "Get It Done",
                desc: "Collaborate, deliver results, and build lasting professional relationships. Simple as that.",
              },
            ].map((item) => (
              <motion.div
                key={item.step}
                className="relative bg-gray-50 rounded-2xl p-6 sm:p-7 md:p-8 group hover:bg-teal-50 transition-colors"
                variants={staggerItem}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <span className="absolute top-5 sm:top-6 right-5 sm:right-6 text-4xl sm:text-5xl font-black text-gray-100 group-hover:text-teal-100 transition-colors">
                  {item.step}
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-teal-100 flex items-center justify-center mb-3 sm:mb-4">
                  {item.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-14 sm:py-20 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 sm:mb-10 gap-3 sm:gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeInUp}
          >
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-1 sm:mb-2">Popular categories</h2>
              <p className="text-sm sm:text-base text-gray-500">Browse projects by specialization</p>
            </div>
            <Link
              href="/explore"
              className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors flex items-center gap-1"
            >
              View all categories
              <ArrowRight size={16} />
            </Link>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={staggerContainer}
          >
            {categories.map((cat) => (
              <motion.div key={cat.id} variants={staggerItem}>
                <Link
                  href="/explore"
                  className="block bg-white rounded-xl p-4 sm:p-5 border border-gray-200 group"
                >
                  <motion.div
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-2.5 sm:mb-3 text-teal-600 group-hover:bg-teal-100 transition-colors"
                    whileHover={{ scale: 1.1, rotate: -5 }}
                  >
                    <CategoryIcon name={cat.iconName} size={18} className="sm:w-5 sm:h-5" />
                  </motion.div>
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-teal-600 transition-colors mb-0.5 sm:mb-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-gray-400">{cat.count} projects</p>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-16 text-center overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 sm:w-64 h-40 sm:h-64 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-48 h-32 sm:h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Ready to get started?</h2>
              <p className="text-teal-100 text-sm sm:text-base md:text-lg max-w-md mx-auto mb-6 sm:mb-8 px-4 sm:px-0">
                Whether you&apos;re hiring or looking for work, Connekt has you covered. Join thousands of professionals
                today.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 justify-center px-4 sm:px-0">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/explore"
                    className="block px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold bg-white text-teal-700 rounded-xl hover:bg-teal-50 transition-colors shadow-lg"
                  >
                    Explore Projects
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href="/dashboard/post"
                    className="block px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-semibold bg-teal-600 text-white border border-teal-400 rounded-xl hover:bg-teal-800 transition-colors"
                  >
                    Post a Project
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
