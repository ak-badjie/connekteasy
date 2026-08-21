"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { httpsCallable } from "firebase/functions";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { db, functions } from "@/app/lib/firebase";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import WhatsAppIcon from "@/components/branding/WhatsAppIcon";

/**
 * What the daily job sync did, and a button to run it now.
 *
 * The sync itself is a scheduled Cloud Function (syncJobsDaily, 05:00 Banjul).
 * This page reads the run log it leaves behind in `jobSyncRuns`, so a bad
 * night is visible without going to the Cloud Functions console.
 */

interface SyncRun {
  id: string;
  startedAt?: number;
  durationMs?: number;
  collected?: number;
  localKept?: number;
  foreignKept?: number;
  added?: number;
  updated?: number;
  removed?: number;
  expired?: number;
  delisted?: number;
  stale?: number;
  trimmed?: number;
  bySource?: Record<string, number>;
  failures?: string[];
}

interface RunResult {
  success: boolean;
  summary: SyncRun & { newJobs?: number };
  alerts: {
    candidates: number;
    whatsappSent: number;
    whatsappFailed: number;
    emailSent: number;
    emailFailed: number;
    skippedRecent: number;
    skippedNoMatch: number;
  } | null;
}

// A full pass over every source takes minutes. The browser gives up long
// before the server does, which is why the page leans on the run log rather
// than the response.
const runSyncNow = httpsCallable<{ notify?: boolean }, RunResult>(functions, "syncJobsNow", {
  timeout: 9 * 60 * 1000,
});
const getChannels = httpsCallable<
  Record<string, never>,
  { whatsapp: boolean; email: boolean }
>(functions, "notificationChannels");

export default function AdminJobSyncPage() {
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [channels, setChannels] = useState<{ whatsapp: boolean; email: boolean } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const snap = await getDocs(
        query(collection(db, "jobSyncRuns"), orderBy("startedAt", "desc"), limit(14))
      );
      setRuns(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SyncRun, "id">) })));
    } catch (err) {
      console.error("Failed to read sync history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    getChannels({})
      .then((res) => setChannels(res.data))
      .catch(() => setChannels(null));
  }, [refresh]);

  const handleRun = async () => {
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const res = await runSyncNow({ notify: true });
      setResult(res.data);
      await refresh();
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || "";
      setError(
        code.includes("deadline-exceeded")
          ? "The run is taking longer than the browser will wait. It is still going on the server — check back here in a few minutes."
          : err instanceof Error
          ? err.message
          : "The sync could not be started."
      );
      await refresh();
    } finally {
      setRunning(false);
    }
  };

  const latest = runs[0];

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={fadeInUp} className="flex flex-wrap items-start gap-4">
        <div className="flex-1 min-w-[260px]">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">Job Sync</h1>
          <p className="text-sm text-gray-500 mt-1 leading-relaxed">
            Runs by itself every day at 05:00 Banjul time. It refreshes the listings
            already on the board, imports what is new, drops what has closed, and holds
            the mix at roughly 70% vacancies inside The Gambia.
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-900 bg-mustard-500 rounded-xl hover:bg-mustard-600 disabled:opacity-50 transition-colors shrink-0"
        >
          <RefreshCw size={16} className={running ? "animate-spin" : ""} />
          {running ? "Syncing…" : "Run now"}
        </button>
      </motion.div>

      {running && (
        <motion.p
          variants={staggerItem}
          className="flex items-start gap-2 text-sm text-teal-800 bg-teal-50 border border-teal-200 rounded-xl p-4"
        >
          <Clock size={16} className="shrink-0 mt-0.5" />
          Reading every source. This takes a few minutes — you can leave the page, the
          run finishes on the server either way.
        </motion.p>
      )}

      {error && (
        <motion.p
          variants={staggerItem}
          className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          {error}
        </motion.p>
      )}

      {/* Delivery channels */}
      <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ChannelCard
          label="WhatsApp alerts"
          ready={channels?.whatsapp}
          icon={<WhatsAppIcon className="w-4 h-4" />}
          hint="Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in functions/.env"
        />
        <ChannelCard
          label="Email alerts"
          ready={channels?.email}
          icon={<Mail size={16} />}
          hint="Set RESEND_API_KEY and RESEND_FROM in functions/.env"
        />
      </motion.div>

      {/* The run that just happened */}
      {result && (
        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
        >
          <h2 className="text-sm font-display font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" /> Run finished
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Added" value={result.summary.added} tone="emerald" />
            <Stat label="Refreshed" value={result.summary.updated} />
            <Stat label="Removed" value={result.summary.removed} tone="red" />
            <Stat label="Collected" value={result.summary.collected} />
          </div>
          {result.alerts && (
            <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="WhatsApp sent" value={result.alerts.whatsappSent} />
              <Stat label="Emails sent" value={result.alerts.emailSent} />
              <Stat label="No match" value={result.alerts.skippedNoMatch} />
              <Stat label="Already messaged" value={result.alerts.skippedRecent} />
            </div>
          )}
        </motion.div>
      )}

      {/* Last night */}
      <motion.div
        variants={staggerItem}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
      >
        <h2 className="text-sm font-display font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
          <TrendingUp size={16} className="text-mustard-600" /> Most recent run
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : !latest ? (
          <p className="text-sm text-gray-500">
            The sync has not run yet. Press <span className="font-semibold">Run now</span> to
            do the first one, or wait for 05:00.
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-4">
              {latest.startedAt ? new Date(latest.startedAt).toLocaleString("en-GB") : latest.id}
              {latest.durationMs ? ` · took ${Math.round(latest.durationMs / 1000)}s` : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Added" value={latest.added} tone="emerald" />
              <Stat label="Refreshed" value={latest.updated} />
              <Stat label="Removed" value={latest.removed} tone="red" />
              <Stat label="In Gambia" value={latest.localKept} />
              <Stat label="Remote / foreign" value={latest.foreignKept} />
              <Stat label="Expired" value={latest.expired} />
              <Stat label="Delisted" value={latest.delisted} />
              <Stat label="Over ratio" value={latest.trimmed} />
            </div>

            {latest.localKept != null && latest.foreignKept != null && (
              <RatioBar local={latest.localKept} foreign={latest.foreignKept} />
            )}

            {latest.bySource && Object.keys(latest.bySource).length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">By source</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(latest.bySource)
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <span
                        key={name}
                        className="px-2.5 py-1 text-[11px] font-medium bg-gray-50 text-gray-700 rounded-full border border-gray-200"
                      >
                        {name} · {count}
                      </span>
                    ))}
                </div>
              </div>
            )}

            {latest.failures && latest.failures.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-red-700 mb-2 inline-flex items-center gap-1.5">
                  <AlertTriangle size={13} /> Sources that failed
                </p>
                <ul className="space-y-1">
                  {latest.failures.map((f, i) => (
                    <li key={i} className="text-[11px] text-gray-500 break-words">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* History */}
      {runs.length > 1 && (
        <motion.div
          variants={staggerItem}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6"
        >
          <h2 className="text-sm font-display font-bold text-gray-900 mb-4">Recent runs</h2>
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full min-w-[460px] text-xs">
              <thead>
                <tr className="text-left text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">When</th>
                  <th className="pb-2 font-medium text-right">Added</th>
                  <th className="pb-2 font-medium text-right">Refreshed</th>
                  <th className="pb-2 font-medium text-right">Removed</th>
                  <th className="pb-2 font-medium text-right">Local / foreign</th>
                </tr>
              </thead>
              <tbody>
                {runs.slice(1).map((run) => (
                  <tr key={run.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 text-gray-600 whitespace-nowrap">
                      {run.startedAt
                        ? new Date(run.startedAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : run.id}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-700">
                      {run.added ?? 0}
                    </td>
                    <td className="py-2.5 text-right text-gray-700">{run.updated ?? 0}</td>
                    <td className="py-2.5 text-right text-red-600">{run.removed ?? 0}</td>
                    <td className="py-2.5 text-right text-gray-500">
                      {run.localKept ?? 0} / {run.foreignKept ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value?: number;
  tone?: "emerald" | "red";
}) {
  const colour =
    tone === "emerald" ? "text-emerald-700" : tone === "red" ? "text-red-600" : "text-gray-900";
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
      <p className={`text-xl font-display font-bold ${colour}`}>{value ?? 0}</p>
      <p className="text-[11px] text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

/** The 70/30 rule, made visible. */
function RatioBar({ local, foreign }: { local: number; foreign: number }) {
  const total = local + foreign;
  if (!total) return null;
  const localPct = Math.round((local / total) * 100);
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1.5">
        <span className="font-semibold text-gray-700">{localPct}% in The Gambia</span>
        <span>{100 - localPct}% remote / foreign · target 70 / 30</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden flex">
        <div className="bg-teal-600" style={{ width: `${localPct}%` }} />
        <div className="bg-mustard-400 flex-1" />
      </div>
    </div>
  );
}

function ChannelCard({
  label,
  ready,
  icon,
  hint,
}: {
  label: string;
  ready?: boolean;
  icon: React.ReactNode;
  hint: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        ready ? "bg-emerald-50/60 border-emerald-200" : "bg-gray-50 border-gray-200"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={ready ? "text-emerald-700" : "text-gray-400"}>{icon}</span>
        <p className="text-sm font-bold text-gray-900">{label}</p>
        <span
          className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${
            ready ? "bg-emerald-600 text-white" : "bg-gray-300 text-gray-700"
          }`}
        >
          {ready === undefined ? "…" : ready ? "READY" : "NOT SET UP"}
        </span>
      </div>
      {!ready && (
        <p className="text-[11px] text-gray-500 leading-relaxed inline-flex items-start gap-1.5">
          <MessageSquare size={12} className="shrink-0 mt-0.5" />
          {hint}
        </p>
      )}
    </div>
  );
}
