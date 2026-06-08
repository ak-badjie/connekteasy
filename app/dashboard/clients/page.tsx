"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { getProjectsByHiredVa } from "@/app/lib/firestore";
import type { FirestoreProject } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState, Avatar, formatGMD } from "@/app/dashboard/_components/kit";
import { Users, MessageSquare } from "lucide-react";

interface ClientRow {
  ownerId: string;
  ownerName: string;
  ownerAvatar: string;
  projects: number;
  total: number;
}

export default function MyClientsPage() {
  const { user } = useAuth();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProjectsByHiredVa(user.uid)
      .then((projects: FirestoreProject[]) => {
        if (cancelled) return;
        const map = new Map<string, ClientRow>();
        projects.forEach((p) => {
          const row = map.get(p.ownerId) || { ownerId: p.ownerId, ownerName: p.ownerName, ownerAvatar: p.ownerAvatar, projects: 0, total: 0 };
          row.projects += 1;
          row.total += p.vaPayout || 0;
          map.set(p.ownerId, row);
        });
        setClients([...map.values()]);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">My Clients</h1>
        <p className="text-sm text-gray-500 mt-1">People and businesses you&apos;ve worked with.</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : clients.length === 0 ? (
            <EmptyState icon={<Users size={22} />} title="No clients yet" hint="Clients appear here once you're hired on a project." />
          ) : (
            <div className="divide-y divide-gray-50">
              {clients.map((c) => (
                <div key={c.ownerId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={c.ownerName} size={42} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.ownerName || "Client"}</p>
                    <p className="text-xs text-gray-500">{c.projects} project{c.projects === 1 ? "" : "s"} · {formatGMD(c.total)} earned</p>
                  </div>
                  <Link href="/dashboard/messages" className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                    <MessageSquare size={13} /> Message
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
