"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import WhatsAppIcon from "@/components/branding/WhatsAppIcon";
import {
  dismissNotificationPrompt,
  looksLikePhoneNumber,
  saveNotificationPrefs,
} from "@/app/lib/notifications";
import { AlertCircle, Check, Loader2, Mail } from "lucide-react";

/**
 * Asks a member for their WhatsApp number the first time they open the
 * dashboard after this shipped, and again a week later if they said "not now".
 *
 * Deliberately not dismissible by clicking the backdrop or pressing Escape:
 * the number is what makes job alerts work at all, and a stray click should
 * not silently count as a "no". "Not now" is always there for anyone who means
 * it.
 */
export default function WhatsAppOptInModal({
  firstName,
  defaultNumber = "",
  onDone,
}: {
  firstName?: string;
  defaultNumber?: string;
  onDone: () => void;
}) {
  const [number, setNumber] = useState(defaultNumber);
  const [consent, setConsent] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = consent && looksLikePhoneNumber(number) && !saving;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError("");
    try {
      await saveNotificationPrefs({
        whatsappNumber: number.trim(),
        whatsappOptIn: true,
        emailOptIn,
      });
      onDone();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "We could not save that number. Please check it and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      await dismissNotificationPrompt();
    } catch {
      // Losing the "not now" only means we ask again sooner — never block on it.
    } finally {
      onDone();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm"
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="whatsapp-optin-title"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* WhatsApp brand green, so the ask reads as what it is */}
          <div className="bg-[#25D366] px-6 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <WhatsAppIcon className="w-8 h-8 text-white" />
            </div>
            <h2 id="whatsapp-optin-title" className="font-display text-lg font-bold text-white">
              {firstName ? `${firstName}, get job updates on WhatsApp` : "Get job updates on WhatsApp"}
            </h2>
            <p className="text-[13px] text-white/90 mt-1 leading-relaxed">
              New openings that match your profile, and updates on jobs you have
              applied to — sent straight to your phone.
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label
                htmlFor="whatsapp-number"
                className="block text-xs font-medium text-gray-700 mb-1.5"
              >
                WhatsApp number
              </label>
              <input
                id="whatsapp-number"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="+220 700 0000"
                className="w-full px-3.5 py-3 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#25D366]/50 focus:border-[#25D366]"
              />
              <p className="mt-1.5 text-[11px] text-gray-400">
                Include your country code. Gambian numbers start +220.
              </p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#25D366]"
              />
              <span className="text-[12px] text-gray-600 leading-relaxed">
                Yes, send me job updates on WhatsApp. I understand these are
                work updates only —{" "}
                <span className="font-semibold text-gray-800">
                  CONNEKT does not send marketing messages
                </span>{" "}
                — and I can turn them off any time in Settings.
              </span>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={emailOptIn}
                onChange={(e) => setEmailOptIn(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-teal-600"
              />
              <span className="text-[12px] text-gray-600 leading-relaxed inline-flex items-start gap-1.5">
                <Mail size={13} className="mt-0.5 shrink-0 text-gray-400" />
                Also email me the same updates.
              </span>
            </label>

            {error && (
              <p className="flex items-start gap-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={!canSubmit}
              className="w-full py-3 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#1fb457] transition-colors disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <Check size={16} /> Turn on job updates
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              disabled={saving || dismissing}
              className="w-full py-2 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              {dismissing ? "One moment…" : "Not now"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
