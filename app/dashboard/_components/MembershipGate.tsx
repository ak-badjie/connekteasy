"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, CheckCircle, Sparkles, ShieldCheck } from "lucide-react";
import { MEMBERSHIP_PERIOD_LABEL, type PlanDefinition } from "@/app/lib/subscriptions";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

/**
 * Shown in place of a gated page when the user has no active membership.
 * Rendered by the dashboard layout, so every gated route gets it for free.
 */
export default function MembershipGate({ plan }: { plan: PlanDefinition }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-2xl mx-auto py-6"
    >
      <motion.div className="text-center mb-8" variants={fadeInUp}>
        <div className="w-16 h-16 mx-auto mb-4 bg-mustard-500/10 rounded-2xl flex items-center justify-center text-mustard-600">
          <Lock size={30} />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          This is part of {plan.name}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">{plan.tagline}</p>
      </motion.div>

      <motion.div
        variants={staggerItem}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 sm:p-8 text-white">
          <p className="text-teal-100 font-medium mb-1">{plan.name}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold tracking-tight">{plan.priceGMD}</span>
            <span className="text-lg text-teal-200 font-medium">
              GMD / {MEMBERSHIP_PERIOD_LABEL}
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <ul className="space-y-3 mb-6">
            {plan.benefits.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/dashboard/membership"
            className="w-full bg-mustard-500 hover:bg-mustard-600 text-gray-900 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Sparkles size={18} /> Subscribe for {plan.priceGMD} GMD
          </Link>

          <p className="text-xs text-gray-500 text-center mt-4 inline-flex items-center justify-center gap-1.5 w-full">
            <ShieldCheck size={12} /> Cancel anytime. Secure payment via Modem Pay.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
