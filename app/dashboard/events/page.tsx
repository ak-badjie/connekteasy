"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getUpcomingEvents } from "@/app/lib/firestore";
import type { PlatformEvent } from "@/app/lib/types";
import { staggerContainer, staggerItem, fadeInUp } from "@/app/lib/animations";
import { Panel, EmptyState } from "@/app/dashboard/_components/kit";
import { Calendar, Clock } from "lucide-react";

function fmt(ms: number) {
  return new Date(ms).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export default function EventsPage() {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getUpcomingEvents(50)
      .then((e) => !cancelled && setEvents(e))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-3xl mx-auto space-y-5">
      <motion.div variants={fadeInUp}>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Upcoming Events</h1>
        <p className="text-sm text-gray-500 mt-1">Workshops, masterclasses and career fairs from CONNEKT.</p>
      </motion.div>

      <motion.div variants={staggerItem}>
        <Panel>
          {loading ? (
            <div className="text-center py-10">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : events.length === 0 ? (
            <EmptyState icon={<Calendar size={22} />} title="No upcoming events" hint="New events will be listed here as they're scheduled." />
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Calendar size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">{e.title}</p>
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-mustard-500/10 text-mustard-700">{e.type}</span>
                    </div>
                    {e.description && <p className="text-xs text-gray-500 line-clamp-2 mb-1">{e.description}</p>}
                    <p className="text-xs text-gray-400 inline-flex items-center gap-1">
                      <Clock size={11} /> {e.date?.toMillis ? fmt(e.date.toMillis()) : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </motion.div>
    </motion.div>
  );
}
