"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { useMembership } from "@/app/lib/useMembership";
import { cancelSubscription, MEMBERSHIP_PERIOD_LABEL } from "@/app/lib/subscriptions";
import { createPayment, type PaymentType } from "@/app/lib/payment";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Briefcase, CheckCircle, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export default function MembershipPage() {
  const { user, userProfile } = useAuth();
  const { sub, plan, active, loading: subLoading } = useMembership();

  const [paying, setPaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Where to send them once they're in — employers manage listings, seekers browse.
  const isEmployer = userProfile?.role === "client";
  const browseHref = isEmployer ? "/dashboard/jobs/my-jobs" : "/dashboard/jobs";
  const browseLabel = isEmployer ? "My Jobs" : "Browse Jobs";

  const handleSubscribe = async () => {
    if (!user || !userProfile || !plan) return;
    setError(null);
    setPaying(true);
    try {
      const result = await createPayment({
        amount: plan.priceGMD,
        type: plan.paymentType as PaymentType,
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

  const handleCancel = async () => {
    if (!user) return;
    if (!window.confirm("Cancel your membership? You'll keep access until the current period ends.")) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelSubscription(user.uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel membership");
    } finally {
      setCancelling(false);
    }
  };

  if (subLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Freelancers have no membership — they're charged through escrow fees.
  if (!plan) {
    return (
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl mx-auto">
        <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <h1 className="font-display text-xl font-bold text-gray-900 mb-2">No membership needed</h1>
          <p className="text-sm text-gray-500">
            Your account doesn&apos;t use a monthly membership. Fees are taken from completed projects instead.
          </p>
        </motion.div>
      </motion.div>
    );
  }

  if (active) {
    const endMs = sub?.currentPeriodEnd?.toMillis?.() ?? 0;
    const cancelled = sub?.status === "cancelled";
    return (
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl mx-auto space-y-5">
        <motion.div variants={fadeInUp}>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Membership</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your {plan.name} subscription.</p>
        </motion.div>

        <motion.div variants={staggerItem} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-teal-100 text-sm mb-0.5">{plan.name}</p>
                <p className="text-2xl font-bold">
                  {plan.priceGMD} GMD <span className="text-sm font-medium text-teal-200">/ {MEMBERSHIP_PERIOD_LABEL}</span>
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cancelled ? "bg-white/15 text-teal-100" : "bg-emerald-400/25 text-white"}`}>
                {cancelled ? "Cancelling" : "Active"}
              </span>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ShieldCheck size={16} className="text-emerald-500" />
              {cancelled ? "Access ends on" : "Renews on"} <strong className="text-gray-900">{endMs ? formatDate(endMs) : "—"}</strong>
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            {waiting ? (
              <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                <div className="w-4 h-4 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin" />
                Waiting for payment confirmation…
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSubscribe}
                  disabled={paying}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-mustard-500 hover:bg-mustard-600 disabled:opacity-50 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
                >
                  {paying ? "Preparing…" : <><Sparkles size={16} /> {cancelled ? "Reactivate" : "Renew"} — {plan.priceGMD} GMD</>}
                </button>
                <Link href={browseHref} className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <Briefcase size={16} /> {browseLabel} <ArrowRight size={16} />
                </Link>
              </div>
            )}
            {!cancelled && (
              <button onClick={handleCancel} disabled={cancelling} className="text-xs text-gray-400 hover:text-red-600 transition-colors">
                {cancelling ? "Cancelling…" : "Cancel membership"}
              </button>
            )}
          </div>
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
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{plan.name}</h1>
        <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">{plan.tagline}</p>
      </motion.div>

      <motion.div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" variants={staggerItem}>
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white">
          <p className="text-teal-100 font-medium mb-1">Membership</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold tracking-tight">{plan.priceGMD}</span>
            <span className="text-lg text-teal-200 font-medium">GMD / {MEMBERSHIP_PERIOD_LABEL}</span>
          </div>
          <p className="text-sm text-teal-100">Renew anytime. Cancel anytime. No hidden fees.</p>
        </div>

        <div className="p-6 sm:p-8">
          <h3 className="font-display text-base font-semibold text-gray-900 mb-4">What you get</h3>
          <ul className="space-y-3 mb-6">
            {plan.benefits.map((item) => (
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
                <><Sparkles size={18} /> Subscribe for {plan.priceGMD} GMD</>
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
