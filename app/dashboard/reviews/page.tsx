"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getReviewsFor } from "@/app/lib/firestore";
import type { Review } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState, Avatar } from "@/app/dashboard/_components/kit";
import { Star } from "lucide-react";

function fmt(ms: number) {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getReviewsFor(user.uid)
      .then((r) => !cancelled && setReviews(r))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0;

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto space-y-5">
      <motion.div variants={fadeInUp} className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">What clients say about your work.</p>
        </div>
        {reviews.length > 0 && (
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 inline-flex items-center gap-1">
              <Star size={20} className="fill-mustard-500 text-mustard-500" /> {avg.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
          </div>
        )}
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState icon={<Star size={22} />} title="No reviews yet" hint="Reviews appear here after a client completes a project with you." />
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Avatar name={r.reviewerName} src={r.reviewerAvatar} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.reviewerName}</p>
                      <p className="text-[11px] text-gray-400">{r.createdAt?.toMillis ? fmt(r.createdAt.toMillis()) : ""}</p>
                    </div>
                    <span className="flex items-center gap-0.5 text-mustard-500 text-sm font-bold">
                      <Star size={14} className="fill-mustard-500" /> {r.rating?.toFixed?.(1) ?? r.rating}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
