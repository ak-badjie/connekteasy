"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { updateUserProfile } from "@/app/lib/firestore";
import { uploadVaAccreditation } from "@/app/lib/storage";
import { submitVaVerification, VA_MIN_DOCUMENTS } from "@/app/lib/verification";
import { looksLikePhoneNumber, saveNotificationPrefs } from "@/app/lib/notifications";
import ConnektIcon from "@/components/branding/ConnektIcon";
import WhatsAppIcon from "@/components/branding/WhatsAppIcon";
import SkillPicker from "@/app/components/SkillPicker";
import CvParserCard from "@/app/components/CvParserCard";
import type { ParsedCv } from "@/app/lib/cvParser";
import {
  Briefcase,
  UserCheck,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Building2,
  ShieldCheck,
  Upload,
  FileText,
  X,
  Loader2,
  Mail,
  SkipForward,
} from "lucide-react";
import { fadeInUp, staggerContainer, staggerItem, scaleIn, cardHover, cardTap } from "@/app/lib/animations";
import type { Education, UserRole } from "@/app/lib/types";

const MAX_DOC_MB = 10;

/**
 * The steps a new member walks through. Which ones they see depends on the
 * role they pick, so the list is built after step 1 rather than numbered
 * up front:
 *
 *   role   → who they are
 *   cv     → optional; the AI reader fills the next step in for them
 *   details→ title, bio, skills
 *   updates→ WhatsApp + email job alerts
 *   va     → freelancers only: accreditation for admin review
 */
type Step = "role" | "cv" | "details" | "updates" | "va";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refreshProfile, loading: authLoading } = useAuth();

  const [role, setRole] = useState<UserRole | "">("");
  const [stepIndex, setStepIndex] = useState(0);

  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [cvExtras, setCvExtras] = useState<Partial<Record<string, unknown>>>({});
  const [education, setEducation] = useState<Education[]>([]);

  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Freelancers must prove their VA training before an admin lets them in.
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isVa = role === "va";

  const steps: Step[] = useMemo(() => {
    const list: Step[] = ["role"];
    // Employers describe a company, not a career, so there is no CV to read.
    if (role && role !== "client") list.push("cv");
    list.push("details", "updates");
    if (role === "va") list.push("va");
    return list;
  }, [role]);

  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const isLastStep = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/signin");
      } else if (!user.emailVerified) {
        router.push("/auth/verify-email");
      }
    }
  }, [user, authLoading, router]);

  const next = () => {
    setError("");
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const back = () => {
    setError("");
    setStepIndex((i) => Math.max(i - 1, 0));
  };

  /** The CV reader hands its fields here, and they prefill the next step. */
  const applyParsedCv = (parsed: ParsedCv) => {
    if (parsed.title) setTitle((t) => t || parsed.title);
    if (parsed.bio) setBio((b) => b || parsed.bio);
    if (parsed.location) setLocation((l) => l || parsed.location);
    if (parsed.skills.length) {
      setSkills((s) => [...new Set([...s, ...parsed.skills])].slice(0, 20));
    }
    if (parsed.education.length) setEducation(parsed.education);
    if (parsed.phone && !whatsappNumber) setWhatsappNumber(parsed.phone);
    setCvExtras({
      ...(parsed.firstName ? { firstName: parsed.firstName } : {}),
      ...(parsed.lastName ? { lastName: parsed.lastName } : {}),
      ...(parsed.linkedin ? { linkedin: parsed.linkedin } : {}),
      ...(parsed.website ? { website: parsed.website } : {}),
      ...(parsed.yearsOfExperience ? { yearsOfExperience: parsed.yearsOfExperience } : {}),
    });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !user) return;
    setError("");

    const tooBig = files.find((f) => f.size > MAX_DOC_MB * 1024 * 1024);
    if (tooBig) {
      setError(`"${tooBig.name}" is larger than ${MAX_DOC_MB}MB. Please upload a smaller file.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const uploaded: { name: string; url: string }[] = [];
      for (const file of files) {
        const url = await uploadVaAccreditation(user.uid, file, setUploadProgress);
        uploaded.push({ name: file.name, url });
      }
      setDocuments((prev) => [...prev, ...uploaded]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Save the number if they gave one, then complete the account. A WhatsApp
   * failure must not cost the member their onboarding, so it is recorded and
   * shown but does not stop the finish.
   */
  const handleFinish = async () => {
    if (!user) return;
    if (isVa && documents.length < VA_MIN_DOCUMENTS) {
      setError("Please upload your VA training or accreditation certificate to continue.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (whatsappConsent && whatsappNumber.trim()) {
        try {
          await saveNotificationPrefs({
            whatsappNumber: whatsappNumber.trim(),
            whatsappOptIn: true,
            emailOptIn,
          });
        } catch {
          // Falls back to the dashboard prompt, which asks again.
        }
      } else {
        await updateUserProfile(user.uid, { emailOptIn, whatsappOptIn: false });
      }

      await updateUserProfile(user.uid, {
        ...cvExtras,
        role: role as UserRole,
        title,
        bio,
        skills,
        location,
        ...(education.length ? { education } : {}),
        onboardingComplete: true,
      });
      if (isVa) {
        await submitVaVerification(user.uid, documents);
      }
      await refreshProfile();
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const primaryLabel = isLastStep
    ? isVa
      ? "Submit for review"
      : "Complete Setup"
    : "Continue";
  const onPrimary = isLastStep ? handleFinish : next;

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
          <h1 className="font-display text-2xl font-bold text-gray-900">Welcome to CONNEKT!</h1>
          <p className="text-sm text-gray-500 mt-1">Let&apos;s set up your account in just a few steps.</p>
        </motion.div>

        {/* Progress */}
        <motion.div className="flex items-center gap-2 mb-6 max-w-xs mx-auto" variants={fadeInUp}>
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-colors ${
                i <= stepIndex ? "bg-mustard-500" : "bg-gray-200"
              }`}
            />
          ))}
        </motion.div>

        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8"
          variants={scaleIn}
          whileHover={cardHover}
        >
          {error && (
            <motion.div
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-sm text-red-700"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}

          {/* ─── Step: role ─────────────────────────────── */}
          {step === "role" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-bold text-gray-900 mb-1">What brings you here?</h2>
              <p className="text-sm text-gray-500 mb-6">Choose one to get started.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(
                  [
                    { value: "student", title: "Student", desc: "Find Internships", Icon: GraduationCap },
                    { value: "job_seeker", title: "Job Seeker", desc: "Find Jobs", Icon: Briefcase },
                    { value: "va", title: "Freelancer", desc: "Offer Services", Icon: UserCheck },
                    { value: "client", title: "Employer", desc: "Hire Talent", Icon: Building2 },
                  ] as { value: UserRole; title: string; desc: string; Icon: typeof Briefcase }[]
                ).map(({ value, title: cardTitle, desc, Icon }) => {
                  const selected = role === value;
                  return (
                    <motion.button
                      key={value}
                      type="button"
                      onClick={() => setRole(value)}
                      className={`p-5 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? "border-mustard-500 bg-mustard-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      whileTap={cardTap}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                          selected ? "bg-teal-100 text-mustard-600" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <h3 className="font-display text-sm font-bold text-gray-900 mb-1">{cardTitle}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                onClick={() => role && next()}
                disabled={!role}
                className="w-full mt-6 py-3 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
                whileTap={cardTap}
              >
                Continue
                <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* ─── Step: CV (optional) ────────────────────── */}
          {step === "cv" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-bold text-gray-900 mb-1">
                Have a CV handy?
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Upload it and we will fill in the next step for you — your title,
                skills, education and contact details. You can always skip this
                and type it yourself.
              </p>

              <CvParserCard compact onParsed={applyParsedCv} />

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={back}
                  className="px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  whileTap={cardTap}
                >
                  Back
                </motion.button>
                <motion.button
                  onClick={next}
                  className="flex-1 py-3 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm flex items-center justify-center gap-2"
                  whileTap={cardTap}
                >
                  {title || skills.length ? "Continue" : "Skip for now"}
                  {title || skills.length ? <ArrowRight size={16} /> : <SkipForward size={15} />}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── Step: details ──────────────────────────── */}
          {step === "details" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-bold text-gray-900 mb-1">Tell us about yourself</h2>
              <p className="text-sm text-gray-500 mb-6">
                {role === "va" && "Help employers understand what you bring to the table."}
                {role === "client" && "Let freelancers know what kind of help you're looking for."}
                {role === "student" && "Tell employers about your studies and what excites you."}
                {role === "job_seeker" && "Tell employers what kind of role you're looking for."}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {role === "va" && "Professional Title"}
                    {role === "client" && "Company / Role"}
                    {role === "student" && "School / Field of Study"}
                    {role === "job_seeker" && "Desired Role"}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      role === "va"
                        ? "e.g. Virtual Assistant, Social Media Manager"
                        : role === "client"
                        ? "e.g. Startup Founder, E-commerce Owner"
                        : role === "student"
                        ? "e.g. UTG, Computer Science"
                        : "e.g. Marketing Coordinator, Office Manager"
                    }
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Serrekunda, The Gambia"
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Short Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="A brief description about yourself..."
                    className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                  />
                </div>

                {role === "va" && (
                  <SkillPicker selected={skills} onChange={setSkills} minSkills={5} label="Skills" />
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={back}
                  className="px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  whileTap={cardTap}
                >
                  Back
                </motion.button>
                <motion.button
                  onClick={onPrimary}
                  disabled={loading}
                  className="flex-1 py-3 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  whileTap={cardTap}
                >
                  {loading ? "Setting up..." : primaryLabel}
                  {!loading && <ArrowRight size={16} />}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── Step: job updates ──────────────────────── */}
          {step === "updates" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="flex items-center gap-2.5 mb-1">
                <span className="w-9 h-9 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-5 h-5 text-white" />
                </span>
                <h2 className="font-display text-lg font-bold text-gray-900">
                  Get updates on WhatsApp
                </h2>
              </div>
              <p className="text-sm text-gray-500 mb-5">
                {role === "client"
                  ? "We will message you when something needs your attention on a listing."
                  : "New openings that match your profile, and updates on jobs you have applied to — sent straight to your phone."}
              </p>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="onboarding-whatsapp"
                    className="block text-xs font-medium text-gray-700 mb-1.5"
                  >
                    WhatsApp number
                  </label>
                  <input
                    id="onboarding-whatsapp"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
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
                    checked={whatsappConsent}
                    onChange={(e) => setWhatsappConsent(e.target.checked)}
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

                {whatsappConsent && !looksLikePhoneNumber(whatsappNumber) && (
                  <p className="text-[12px] text-mustard-700 bg-mustard-50 border border-mustard-200 rounded-xl p-3">
                    Please enter the WhatsApp number to use, including the country code.
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={back}
                  className="px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  whileTap={cardTap}
                >
                  Back
                </motion.button>
                <motion.button
                  onClick={onPrimary}
                  disabled={
                    loading || (whatsappConsent && !looksLikePhoneNumber(whatsappNumber))
                  }
                  className="flex-1 py-3 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
                  whileTap={cardTap}
                >
                  {loading ? "Setting up..." : primaryLabel}
                  {!loading && <ArrowRight size={16} />}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── Step: VA accreditation ─────────────────── */}
          {step === "va" && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="font-display text-lg font-bold text-gray-900 mb-1">
                Verify your VA training
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Upload your virtual assistant certificate or training accreditation.
                Our team reviews every freelancer before their account is opened.
              </p>

              <div className="mb-5 p-3.5 rounded-xl bg-teal-50 border border-teal-100 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-teal-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-teal-800 leading-relaxed">
                  Accepted: VA training certificates, course completion letters, or
                  accreditation documents (PDF or image, max {MAX_DOC_MB}MB each).
                  You&apos;ll get access as soon as an admin approves them.
                </p>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full py-8 px-4 border-2 border-dashed border-gray-200 rounded-xl text-center hover:border-mustard-400 hover:bg-mustard-50/40 transition-colors disabled:opacity-60"
              >
                {uploading ? (
                  <span className="inline-flex flex-col items-center gap-2 text-sm text-gray-500">
                    <Loader2 size={22} className="animate-spin text-mustard-600" />
                    Uploading… {Math.round(uploadProgress)}%
                  </span>
                ) : (
                  <span className="inline-flex flex-col items-center gap-2">
                    <Upload size={22} className="text-mustard-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      Upload certificate
                    </span>
                    <span className="text-xs text-gray-500">
                      PDF, JPG or PNG — you can add more than one
                    </span>
                  </span>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                multiple
                onChange={handleDocumentUpload}
                className="hidden"
              />

              {documents.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {documents.map((docFile, idx) => (
                    <li
                      key={`${docFile.url}-${idx}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-gray-50/60"
                    >
                      <FileText size={16} className="text-teal-600 shrink-0" />
                      <a
                        href={docFile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-gray-700 truncate flex-1 hover:text-teal-700"
                      >
                        {docFile.name}
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDocument(idx)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-md shrink-0"
                        aria-label={`Remove ${docFile.name}`}
                      >
                        <X size={15} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={back}
                  className="px-5 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  whileTap={cardTap}
                >
                  Back
                </motion.button>
                <motion.button
                  onClick={handleFinish}
                  disabled={loading || uploading || documents.length < VA_MIN_DOCUMENTS}
                  className="flex-1 py-3 text-sm font-semibold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 transition-colors shadow-sm disabled:opacity-40 flex items-center justify-center gap-2"
                  whileTap={cardTap}
                >
                  {loading ? "Submitting…" : "Submit for review"}
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
