"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getFreelancers } from "@/app/lib/firestore";
import type { UserProfile } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { EmptyState, Avatar } from "@/app/dashboard/_components/kit";
import { Search, MapPin, Star, UserSearch } from "lucide-react";

export default function TalentSearchPage() {
  const [talent, setTalent] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    getFreelancers()
      .then((t) => !cancelled && setTalent(t))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return talent;
    return talent.filter(
      (p) =>
        p.displayName?.toLowerCase().includes(term) ||
        p.title?.toLowerCase().includes(term) ||
        (p.skills || []).some((s) => s.toLowerCase().includes(term))
    );
  }, [talent, q]);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-5xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Talent Search</h1>
        <p className="text-sm text-gray-500 mt-1">Browse vetted freelancers and reach out directly.</p>
      </motion.div>

      <motion.div variants={staggerItem} className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, title, or skill…"
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <EmptyState icon={<UserSearch size={22} />} title="No talent found" hint="Try a different search, or check back as more freelancers join." />
        </div>
      ) : (
        <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link key={p.uid} href={`/profile/${p.uid}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-teal-200 hover:shadow-md transition-all">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={p.displayName} src={p.profilePhotoUrl} size={46} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{p.displayName}</p>
                  <p className="text-xs text-teal-600 truncate">{p.title || "Virtual Assistant"}</p>
                </div>
              </div>
              {p.bio && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.bio}</p>}
              <div className="flex flex-wrap gap-1 mb-3">
                {(p.skills || []).slice(0, 3).map((s) => (
                  <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-full">{s}</span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                {p.location && <span className="inline-flex items-center gap-1"><MapPin size={11} /> {p.location}</span>}
                {(p.rating ?? 0) > 0 && <span className="inline-flex items-center gap-1"><Star size={11} className="fill-mustard-500 text-mustard-500" /> {p.rating?.toFixed(1)}</span>}
              </div>
            </Link>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
