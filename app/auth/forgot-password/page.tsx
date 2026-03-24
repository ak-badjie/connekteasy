"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import ConnektIcon from "@/components/branding/ConnektIcon";
import { Mail, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await resetPassword(email);
      setSuccess("Password reset email sent! Please check your inbox.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send reset email";
      if (msg.includes("user-not-found")) {
        setError("No account found with this email address.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <motion.div
        className="relative w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="text-center mb-8" variants={fadeInUp}>
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <ConnektIcon className="w-12 h-12" />
            <span className="font-display text-2xl font-bold tracking-tight text-gray-900">
              CONNEKT
            </span>
          </Link>
          <p className="text-sm text-gray-500 mt-2">Reset your password</p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8"
          variants={staggerItem}
        >
          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-sm text-teal-700"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              {success}
            </motion.div>
          )}

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Enter the email address associated with your account and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !email}
              className="w-full py-3 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50"
              whileTap={{ scale: 0.98 }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </motion.button>
          </form>

          <div className="mt-6 flex justify-center">
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
