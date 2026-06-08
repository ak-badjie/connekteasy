"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { updateUserProfile } from "@/app/lib/firestore";
import { roleLabel } from "@/app/lib/roles";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import { Panel } from "@/app/dashboard/_components/kit";
import { Check, LogOut, Mail, ShieldCheck } from "lucide-react";

const inputCls =
  "w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500";

export default function SettingsPage() {
  const { user, userProfile, refreshProfile, signOutUser } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", title: "", location: "", bio: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        title: userProfile.title || "",
        location: userProfile.location || "",
        bio: userProfile.bio || "",
      });
    }
  }, [userProfile]);

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
              <span className="ml-auto font-medium text-gray-900">{roleLabel(userProfile?.role)}</span>
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
