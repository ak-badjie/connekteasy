"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { updateUserProfile } from "@/app/lib/firestore";
import ConnektIcon from "@/components/branding/ConnektIcon";
import SkillPicker from "@/app/components/SkillPicker";
import { Briefcase, UserCheck, ArrowRight, AlertCircle } from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import type { UserRole } from "@/app/lib/types";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole | "">("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFinish = async () => {
    if (!user) return;
    setError("");
    setLoading(true);
    try {
      await updateUserProfile(user.uid, {
        role: role as UserRole,
        title,
        bio,
        skills,
        onboardingComplete: true,
      });
      await refreshProfile();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50/30 flex items-center justify-center px-4 py-12">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-teal-100/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <motion.div
        className="relative w-full max-w-lg"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Logo */}
        <motion.div className="text-center mb-8" variants={fadeInUp}>
          <ConnektIcon className="w-10 h-10 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Connekt!</h1>
          <p className="text-sm text-gray-500 mt-1">Let&apos;s set up your account in just a few steps.</p>
        </motion.div>

        {/* Progress */}
        <motion.div className="flex items-center gap-2 mb-6 max-w-xs mx-auto" variants={fadeInUp}>
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                s <= step ? "bg-teal-500" : "bg-gray-200"
              }`}
            />
          ))}
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-xl shadow-gray-100/50 p-6 sm:p-8"
          variants={staggerItem}
        >
          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-1">How will you use Connekt?</h2>
              <p className="text-sm text-gray-500 mb-6">Choose the option that best describes you.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <motion.button
                  type="button"
                  onClick={() => setRole("client")}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    role === "client"
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      role === "client"
                        ? "bg-teal-100 text-teal-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <Briefcase size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">I&apos;m a Client</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    I want to hire virtual assistants for my projects.
                  </p>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={() => setRole("va")}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${
                    role === "va"
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                      role === "va"
                        ? "bg-teal-100 text-teal-600"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <UserCheck size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">I&apos;m a Virtual Assistant</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    I want to find projects and offer my services.
                  </p>
                </motion.button>
              </div>

              <motion.button
                onClick={() => role && setStep(2)}
                disabled={!role}
                className="w-full mt-6 py-3 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
                whileTap={{ scale: 0.98 }}
              >
                Continue
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Profile Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-lg font-bold text-gray-900 mb-1">Tell us about yourself</h2>
              <p className="text-sm text-gray-500 mb-6">
                {role === "va"
                  ? "Help clients understand what you bring to the table."
                  : "Let virtual assistants know what you're looking for."}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {role === "va" ? "Professional Title" : "Company / Role"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={role === "va" ? "e.g. Virtual Assistant, Social Media Manager" : "e.g. Startup Founder, E-commerce Owner"}
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Short Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="A brief description about yourself..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>

                {role === "va" && (
                  <SkillPicker
                    selected={skills}
                    onChange={setSkills}
                    minSkills={5}
                    label="Skills"
                  />
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => setStep(1)}
                  className="px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  Back
                </motion.button>
                <motion.button
                  onClick={handleFinish}
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-teal-500 rounded-xl hover:bg-teal-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                  {!loading && <ArrowRight size={16} />}
                </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
