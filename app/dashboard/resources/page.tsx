"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getResources } from "@/app/lib/firestore";
import type { Resource } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState } from "@/app/dashboard/_components/kit";
import { BookMarked, ExternalLink } from "lucide-react";

export default function CareerResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getResources()
      .then((r) => !cancelled && setResources(r))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const byCategory: Record<string, Resource[]> = {};
  resources.forEach((r) => {
    const c = r.category || "General";
    (byCategory[c] = byCategory[c] || []).push(r);
  });

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Career Resources</h1>
        <p className="text-sm text-gray-500 mt-1">Curated guides to help you land your next role.</p>
      </motion.div>

      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : resources.length === 0 ? (
        <Panel>
          <EmptyState icon={<BookMarked size={22} />} title="No resources yet" hint="Helpful guides and links will appear here soon." />
        </Panel>
      ) : (
        Object.entries(byCategory).map(([cat, items]) => (
          <motion.div key={cat} variants={staggerItem}>
            <Panel title={cat}>
              <div className="space-y-2">
                {items.map((r) => (
                  <a
                    key={r.id}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-teal-50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 text-teal-600 flex items-center justify-center shrink-0">
                      <BookMarked size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500 truncate">{r.description}</p>
                    </div>
                    <ExternalLink size={15} className="text-gray-300 group-hover:text-teal-600 shrink-0" />
                  </a>
                ))}
              </div>
            </Panel>
          </motion.div>
        ))
      )}
    </motion.div>
  );
}
