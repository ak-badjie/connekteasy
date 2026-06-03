"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { useRoleGuard } from "@/app/lib/useRoleGuard";
import {
  subscribeToMySubscription,
  isSubscriptionActive,
  JOB_MEMBERSHIP_PRICE_GMD,
  MEMBERSHIP_PERIOD_LABEL,
} from "@/app/lib/subscriptions";
import { createPayment } from "@/app/lib/payment";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Briefcase, CheckCircle, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import type { InternshipSubscription } from "@/app/lib/types";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export default function MembershipPage() {
  // Job seekers and freelancers subscribe here to apply to jobs.
  const { allowed, checking } = useRoleGuard((c) => c.browseJobs && !c.postJobs);
  const { user, userProfile } = useAuth();

  const [sub, setSub] = useState<InternshipSubscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMySubscription(user.uid, (s) => {
      setSub(s);
      setSubLoading(false);
      if (isSubscriptionActive(s)) setWaiting(false);
    });
    return unsub;
  }, [user]);

  const active = isSubscriptionActive(sub);

  const handleSubscribe = async () => {
    if (!user || !userProfile) return;
    setError(null);
    setPaying(true);
    try {
      const result = await createPayment({
        amount: JOB_MEMBERSHIP_PRICE_GMD,
        type: "job_subscription",
        customer_name: userProfile.displayName,
        customer_email: userProfile.email,
      });
      if (!result.paymentUrl) throw new Error("Failed to get payment link");

      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      setWaiting(true);
      const popup = window.open(
        result.paymentUrl,
        "ModemPayMembership",
        `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      const pollTimer = window.setInterval(() => {
        if (popup && popup.closed) {
          window.clearInterval(pollTimer);
          setTimeout(() => setWaiting(false), 4000);
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment");
      setWaiting(false);
    } finally {
      setPaying(false);
    }
  };

  if (checking || subLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!allowed) return null;

  if (active) {
    const endDate = sub?.currentPeriodEnd?.toMillis?.() ?? 0;
    return (
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto">
        <motion.div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center" variants={fadeInUp}>
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
            <ShieldCheck size={28} />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Membership active</h1>
          <p className="text-sm text-gray-500 mb-2">You can apply to jobs across CONNEKT.</p>
          <p className="text-xs text-gray-400 mb-6">Renews on {endDate ? formatDate(endDate) : "—"}.</p>
          <Link
            href="/dashboard/jobs"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
          >
            <Briefcase size={16} /> Browse Jobs <ArrowRight size={16} />
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto">
      <motion.div className="text-center mb-8" variants={fadeInUp}>
        <div className="w-16 h-16 mx-auto mb-4 bg-mustard-500/10 rounded-2xl flex items-center justify-center text-mustard-600">
          <Briefcase size={32} />
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Job Seeker Membership</h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
          Apply to jobs across CONNEKT for {JOB_MEMBERSHIP_PRICE_GMD} GMD per {MEMBERSHIP_PERIOD_LABEL}.
        </p>
      </motion.div>

      <motion.div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" variants={staggerItem}>
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white">
          <p className="text-teal-100 font-medium mb-1">Membership</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold tracking-tight">{JOB_MEMBERSHIP_PRICE_GMD}</span>
            <span className="text-lg text-teal-200 font-medium">GMD / {MEMBERSHIP_PERIOD_LABEL}</span>
          </div>
          <p className="text-sm text-teal-100">Renew anytime. Cancel anytime. No hidden fees.</p>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="font-display text-base font-semibold text-gray-900 mb-4">What you get</h3>
          <ul className="space-y-3 mb-6">
            {[
              "Apply to every job on the CONNEKT board",
              "One-click applications with your profile",
              "Direct contact with employers",
              "Priority visibility to hiring companies",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>

          {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 mb-4">{error}</p>}

          {waiting ? (
            <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
              <div className="w-4 h-4 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin" />
              Waiting for payment confirmation... This page updates once your membership activates.
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              disabled={paying || !user}
              className="w-full bg-mustard-500 hover:bg-mustard-600 disabled:opacity-50 text-gray-900 font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {paying ? (
                <><div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" /> Preparing checkout...</>
              ) : (
                <><Sparkles size={18} /> Subscribe for {JOB_MEMBERSHIP_PRICE_GMD} GMD</>
              )}
            </button>
          )}

          <p className="text-xs text-gray-500 text-center mt-4 inline-flex items-center justify-center gap-1.5 w-full">
            <ShieldCheck size={12} /> Secure payment via Modem Pay
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
