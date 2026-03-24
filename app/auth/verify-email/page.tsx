"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { auth } from "@/app/lib/firebase";
import { applyActionCode, sendEmailVerification } from "firebase/auth";
import ConnektIcon from "@/components/branding/ConnektIcon";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { fadeInUp, staggerContainer, scaleIn, cardHover, cardTap } from "@/app/lib/animations";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin");
    } else if (user?.emailVerified) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Extract oobCode if they pasted the full link
      let actionCode = code;
      if (code.includes("oobCode=")) {
        const urlParams = new URLSearchParams(code.substring(code.indexOf("?")));
        actionCode = urlParams.get("oobCode") || code;
      }
      
      await applyActionCode(auth, actionCode);
      await user?.reload();
      setSuccess("Email verified successfully! Redirecting...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user) return;
    setError("");
    setSuccess("");
    setResending(true);
    try {
      await sendEmailVerification(user);
      setSuccess("Verification email resent. Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to resend email.");
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    await user.reload();
    if (user.emailVerified) {
      setSuccess("Email verified! Redirecting...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 1500);
    } else {
      setError("Email is not verified yet. Please check your inbox.");
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 flex items-center justify-center px-4 py-12">
      <motion.div
        className="relative w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="text-center mb-8" variants={fadeInUp}>
          <div className="inline-flex flex-col items-center gap-3">
            <ConnektIcon className="w-12 h-12" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-gray-900">
              Verify your email
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            We sent a verification link to <span className="font-semibold text-gray-700">{user.email}</span>
          </p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8"
          variants={scaleIn}
          whileHover={cardHover}
        >
          {error && (
            <motion.div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-sm text-mustard-700" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              {success}
            </motion.div>
          )}

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Verification Code or Link</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste link or code here"
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Paste the full link or the code from the email to verify manually.
              </p>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !code}
              className="w-full py-3 text-sm font-semibold text-white bg-mustard-500 text-gray-900 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-50"
              whileTap={cardTap}
            >
              {loading ? "Verifying..." : "Verify Code"}
            </motion.button>
          </form>

          <div className="flex flex-col gap-3 mt-6">
            <motion.button
              onClick={handleCheckVerification}
              className="w-full py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              whileTap={cardTap}
            >
              I clicked the link
            </motion.button>
            <motion.button
              onClick={handleResend}
              disabled={resending}
              className="text-xs font-medium text-mustard-600 hover:text-mustard-700"
              whileTap={{ scale: 0.95 }}
            >
              {resending ? "Sending..." : "Resend verification email"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
