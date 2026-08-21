"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { updateUserProfile } from "@/app/lib/firestore";
import { roleLabel } from "@/app/lib/roles";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Panel } from "@/app/dashboard/_components/kit";
import WhatsAppIcon from "@/components/branding/WhatsAppIcon";
import {
  looksLikePhoneNumber,
  saveNotificationPrefs,
} from "@/app/lib/notifications";
import { staffLabel } from "@/app/lib/admin";
import { AlertCircle, Check, LogOut, Mail, ShieldCheck } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function SettingsPage() {
  const { user, userProfile, refreshProfile, signOutUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", title: "", location: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Job alerts. Kept apart from the profile form because the number goes
  // through a Cloud Function that normalises it and sends the welcome message.
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [alertsSaved, setAlertsSaved] = useState(false);
  const [alertsError, setAlertsError] = useState("");

  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        title: userProfile.title || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
      });
      setWhatsappNumber(userProfile.whatsappNumber || "");
      setWhatsappOptIn(!!userProfile.whatsappOptIn);
      setEmailOptIn(userProfile.emailOptIn !== false);
    }
  }, [userProfile]);

  const saveAlerts = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (whatsappOptIn && !looksLikePhoneNumber(whatsappNumber)) {
      setAlertsError("Please enter your WhatsApp number, including the country code.");
      return;
    }
    setSavingAlerts(true);
    setAlertsError("");
    setAlertsSaved(false);
    try {
      const res = await saveNotificationPrefs({
        whatsappNumber: whatsappNumber.trim(),
        whatsappOptIn,
        emailOptIn,
      });
      setWhatsappNumber(res.whatsappNumber);
      await refreshProfile();
      setAlertsSaved(true);
      setTimeout(() => setAlertsSaved(false), 2500);
    } catch (err: unknown) {
      setAlertsError(
        err instanceof Error ? err.message : "We could not save those preferences."
      );
    } finally {
      setSavingAlerts(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateUserProfile(user.uid, {
        ...form,
        displayName: `${form.firstName} ${form.lastName}`.trim(),
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/");
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account details and preferences.</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel title="Account details">
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">First name</label>
                <input className={inputCls} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Last name</label>
                <input className={inputCls} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {userProfile?.role === "client" ? "Company / Role" : "Title"}
                </label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Location</label>
                <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
            </div>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors">
              {saved ? <><Check size={15} /> Saved</> : saving ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Panel>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel title="Job updates">
          <form onSubmit={saveAlerts} className="space-y-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              We message you when an opening matches your profile, and when
              something changes on a job you have applied to. Work updates only —
              CONNEKT never sends marketing.
            </p>

            <div>
              <label
                htmlFor="settings-whatsapp"
                className="flex items-center gap-1.5 text-xs font-medium text-gray-700 mb-1.5"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                WhatsApp number
              </label>
              <input
                id="settings-whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={inputCls}
                value={whatsappNumber}
                placeholder="+220 700 0000"
                onChange={(e) => setWhatsappNumber(e.target.value)}
              />
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={whatsappOptIn}
                onChange={(e) => setWhatsappOptIn(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#25D366]"
              />
              <span className="text-[12px] text-gray-600 leading-relaxed">
                Send me job updates on WhatsApp.
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
                Email me the same updates.
              </span>
            </label>

            {alertsError && (
              <p className="flex items-start gap-2 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {alertsError}
              </p>
            )}

            <button
              type="submit"
              disabled={savingAlerts}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              {alertsSaved ? (
                <>
                  <Check size={15} /> Saved
                </>
              ) : savingAlerts ? (
                "Saving…"
              ) : (
                "Save preferences"
              )}
            </button>
          </form>
        </Panel>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel title="Account">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-gray-400" />
              <span className="text-gray-500">Email</span>
              <span className="ml-auto font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck size={16} className="text-gray-400" />
              <span className="text-gray-500">Account type</span>
              <span className="ml-auto font-medium text-gray-900">
                {roleLabel(userProfile?.role)}
                {staffLabel(userProfile) && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-900 bg-mustard-500 align-middle">
                    {staffLabel(userProfile)}
                  </span>
                )}
              </span>
            </div>
            <button onClick={handleSignOut} className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </Panel>
      </motion.div>
    </motion.div>
  );
}
