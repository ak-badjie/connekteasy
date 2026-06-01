"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getJobs } from "@/app/lib/firestore";
import {
  subscribeToMyInternshipSubscription,
  isInternshipSubscriptionActive,
  INTERNSHIP_PRICE_GMD,
  INTERNSHIP_PERIOD_LABEL,
} from "@/app/lib/subscriptions";
import { createPayment } from "@/app/lib/payment";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { GraduationCap, MapPin, Plus, CheckCircle, ShieldCheck, Sparkles } from "lucide-react";
import type { Job, InternshipSubscription } from "@/app/lib/types";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" });
}

export default function InternshipsPage() {
  const { user, userProfile } = useAuth();
  const [sub, setSub] = useState<InternshipSubscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [internships, setInternships] = useState<Job[]>([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [waitingForActivation, setWaitingForActivation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToMyInternshipSubscription(user.uid, (s) => {
      setSub(s);
      setSubLoading(false);
      if (isInternshipSubscriptionActive(s)) {
        setWaitingForActivation(false);
      }
    });
    return unsub;
  }, [user]);

  const active = isInternshipSubscriptionActive(sub);

  useEffect(() => {
    if (!active) {
      setInternships([]);
      return;
    }
    setListingsLoading(true);
    getJobs()
      .then((all) => setInternships(all.filter((j) => j.employmentType === "internship")))
      .catch((e) => console.error("Failed to load internships:", e))
      .finally(() => setListingsLoading(false));
  }, [active]);

  const handleSubscribe = async () => {
    if (!user || !userProfile) return;
    setError(null);
    setPaying(true);
    try {
      const result = await createPayment({
        amount: INTERNSHIP_PRICE_GMD,
        type: "internship_subscription",
        customer_name: userProfile.displayName,
        customer_email: userProfile.email,
      });
      if (!result.paymentUrl) throw new Error("Failed to get payment link");

      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      setWaitingForActivation(true);
      const popup = window.open(
        result.paymentUrl,
        "ModemPayInternship",
        `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      const pollTimer = window.setInterval(() => {
        if (popup && popup.closed) {
          window.clearInterval(pollTimer);
          setTimeout(() => setWaitingForActivation(false), 4000);
        }
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment");
      setWaitingForActivation(false);
    } finally {
      setPaying(false);
    }
  };

  if (subLoading) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading internship access...</p>
      </div>
    );
  }

  // ─── Subscribe Gate ──────────────────────────────────────
  if (!active) {
    return (
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto">
        <motion.div className="text-center mb-8" variants={fadeInUp}>
          <div className="w-16 h-16 mx-auto mb-4 bg-mustard-500/10 rounded-2xl flex items-center justify-center text-mustard-600">
            <GraduationCap size={32} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Internship Programme</h1>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            Unlock access to vetted internship opportunities across The Gambia — for {INTERNSHIP_PRICE_GMD} GMD per {INTERNSHIP_PERIOD_LABEL}.
          </p>
        </motion.div>

        <motion.div className="isolate transform-gpu z-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" variants={staggerItem}>
          <div className="bg-teal-700 bg-gradient-to-br from-teal-600 to-teal-800 p-8 text-white">
            <p className="text-teal-100 font-medium mb-1">Internship Membership</p>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-4xl font-bold tracking-tight">{INTERNSHIP_PRICE_GMD}</span>
              <span className="text-lg text-teal-200 font-medium">GMD / {INTERNSHIP_PERIOD_LABEL}</span>
            </div>
            <p className="text-sm text-teal-100">Renew anytime. Cancel anytime. No hidden fees.</p>
          </div>

          <div className="p-6 sm:p-8">
            <h3 className="font-display text-base font-semibold text-gray-900 mb-4">What you get</h3>
            <ul className="space-y-3 mb-6">
              {[
                "Access to all internship listings on ConnektEasy",
                "Apply for free with one click — no extra fees",
                "Direct contact with employers and program coordinators",
                "Priority placement in employer searches",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 mb-4">{error}</p>
            )}

            {waitingForActivation ? (
              <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700">
                <div className="w-4 h-4 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin" />
                Waiting for payment confirmation... This page will update once your subscription activates.
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
                  <><Sparkles size={18} /> Subscribe for {INTERNSHIP_PRICE_GMD} GMD</>
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

  // ─── Active subscriber view ──────────────────────────────
  const endDate = sub?.currentPeriodEnd?.toMillis?.() ?? 0;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
      <motion.div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6 sm:mb-8" variants={fadeInUp}>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-gray-900 mb-1">Internships</h1>
          <p className="text-sm sm:text-base text-gray-500">Curated internship opportunities — apply for free with your active membership.</p>
        </div>
        <Link href="/dashboard/jobs/post" className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shrink-0 w-full sm:w-auto shadow-sm">
          <Plus size={16} /> Post an Internship
        </Link>
      </motion.div>

      <motion.div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3" variants={fadeInUp}>
        <div className="w-9 h-9 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-800">Membership active</p>
          <p className="text-xs text-emerald-700">Renews on {endDate ? formatDate(endDate) : "—"}.</p>
        </div>
      </motion.div>

      {listingsLoading ? (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-mustard-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : internships.length === 0 ? (
        <motion.div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm" variants={staggerItem}>
          <GraduationCap size={40} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold font-display text-gray-900 mb-1">No internships posted yet</h3>
          <p className="text-xs text-gray-500">Check back soon, or post one yourself.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {internships.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
            >
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="block bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold font-display text-gray-900 line-clamp-2">{job.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{job.company}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-mustard-500/10 text-mustard-700">
                    Internship
                  </span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.location || "Remote"}</span>
                  <span>·</span>
                  <span>{job.salary || "Stipend undisclosed"}</span>
                  <span>·</span>
                  <span>{job.applicants || 0} applicants</span>
                  <span className="ml-auto text-gray-400">{job.createdAt?.toDate ? timeAgo(job.createdAt.toDate()) : "Just now"}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
