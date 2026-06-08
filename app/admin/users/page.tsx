"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getAllUsers, setUserAdmin } from "@/app/lib/firestore";
import { roleLabel } from "@/app/lib/roles";
import type { UserProfile } from "@/app/lib/types";
import { fadeInUp, staggerContainer } from "@/app/lib/animations";
import { Avatar } from "@/app/dashboard/_components/kit";
import { ShieldCheck, Search } from "lucide-react";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [savingUid, setSavingUid] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await getAllUsers().catch(() => []);
      if (!cancelled) {
        setUsers(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleAdmin = async (u: UserProfile) => {
    const next = !u.isAdmin;
    setSavingUid(u.uid);
    try {
      await setUserAdmin(u.uid, next);
      setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, isAdmin: next } : x)));
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUid(null);
    }
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? users.filter((u) => (u.displayName || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q))
    : users;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-6">
      <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-1">{loading ? "Loading…" : `${users.length} registered user${users.length === 1 ? "" : "s"}`}</p>
        </div>
        <div className="relative sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <div key={u.uid} className="flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
              <Avatar name={u.displayName} src={u.profilePhotoUrl} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {u.displayName || "Unnamed"}
                  {u.uid === user?.uid && <span className="ml-1.5 text-[10px] text-gray-400">(you)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
              </div>
              <span className="shrink-0 px-2.5 py-1 text-[10px] font-semibold rounded-full bg-gray-100 text-gray-600">{roleLabel(u.role)}</span>
              <button
                onClick={() => toggleAdmin(u)}
                disabled={savingUid === u.uid}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                  u.isAdmin
                    ? "bg-teal-600 text-white border-teal-600 hover:bg-teal-700"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <ShieldCheck size={13} />
                {u.isAdmin ? "Admin" : "Make admin"}
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-10">No users match your search.</p>}
        </div>
      )}
    </motion.div>
  );
}
