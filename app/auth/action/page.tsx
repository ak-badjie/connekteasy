"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth } from "@/app/lib/firebase";
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import ConnektIcon from "@/components/branding/ConnektIcon";
import { Lock, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";

function ActionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isCodeValid, setIsCodeValid] = useState(true);

  useEffect(() => {
    if (!oobCode || !mode) {
      setError("Invalid action link.");
      setIsCodeValid(false);
      return;
    }

    if (mode === "resetPassword") {
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setEmail(email);
        })
        .catch((err) => {
          setError("Invalid or expired password reset link.");
          setIsCodeValid(false);
        });
    } else if (mode === "verifyEmail") {
      applyActionCode(auth, oobCode)
        .then(() => {
          setSuccess("Your email has been verified successfully!");
          setTimeout(() => router.push("/dashboard"), 3000);
        })
        .catch((err) => {
          setError("Invalid or expired verification link.");
          setIsCodeValid(false);
        });
    }
  }, [mode, oobCode, router]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;
    
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }
    if (!/[^a-zA-Z0-9]/.test(password)) {
      setError("Password must contain at least one special character.");
      return;
    }

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess("Password has been reset successfully!");
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 flex items-center justify-center px-4 py-12">
      <motion.div
        className="relative w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <motion.div className="text-center mb-8" variants={fadeInUp}>
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <ConnektIcon className="w-12 h-12" />
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Connekt
            </span>
          </Link>
          <p className="text-sm text-gray-500 mt-2">
            {mode === "resetPassword" ? "Reset your password" : "Email Verification"}
          </p>
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-6 sm:p-8"
          variants={staggerItem}
        >
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-sm text-teal-700">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              {success}
            </div>
          )}

          {mode === "resetPassword" && isCodeValid && !success && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Resetting password for: <span className="font-medium text-gray-900">{email}</span>
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {mode === "verifyEmail" && !isCodeValid && !success && (
            <div className="text-center">
              <Link href="/auth/verify-email" className="text-teal-600 font-medium hover:underline">
                Go back to Verification page
              </Link>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ActionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ActionContent />
    </Suspense>
  );
}
