/**
 * Write the vacancies gathered by fetch-gambia-jobs.js into the `jobs`
 * collection, in the exact shape the app reads (app/lib/types.ts → Job).
 *
 *   node functions/scripts/fetch-gambia-jobs.js functions/scripts/gambia-jobs.json
 *   node functions/scripts/seed-jobs.js functions/scripts/gambia-jobs.json [--dry-run]
 *
 * Auth: the Firestore REST API with a short-lived OAuth token, so no
 * service-account key is needed — same approach as set-isadmin-false.js:
 *
 *   $env:FIRESTORE_TOKEN = (gcloud auth print-access-token)
 *
 * (If FIRESTORE_TOKEN is unset the script asks gcloud for one itself.)
 *
 * Document ids are derived from the source URL, so re-running refreshes the
 * same listings instead of duplicating them.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execSync } = require("child_process");

const PROJECT = "connekt-13630";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const INPUT = process.argv[2] || path.join(__dirname, "gambia-jobs.json");
const DRY_RUN = process.argv.includes("--dry-run");

// Imported listings are owned by the platform, not by an employer account.
const IMPORT_OWNER = "connekt-import";

function token() {
  if (process.env.FIRESTORE_TOKEN) return process.env.FIRESTORE_TOKEN.trim();
  try {
    return execSync("gcloud auth print-access-token", { encoding: "utf8" }).trim();
  } catch {
    console.error(
      "No credentials. Run:  $env:FIRESTORE_TOKEN = (gcloud auth print-access-token)"
    );
    process.exit(1);
  }
}
const TOKEN = token();

const str = (v) => ({ stringValue: String(v ?? "") });
const int = (v) => ({ integerValue: String(v ?? 0) });
const ts = (ms) => ({ timestampValue: new Date(ms).toISOString() });
const arr = (values) => ({
  arrayValue: { values: (values || []).map((v) => str(v)) },
});

const initials = (name = "") =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "CK";

// Title is part of the key because some sources (the Public Service
// Commission, for one) advertise several posts on a single page.
const docId = (job) =>
  `imp_${crypto
    .createHash("sha1")
    .update(`${job.sourceUrl || ""}|${job.title}`)
    .digest("hex")
    .slice(0, 20)}`;

function toFirestore(job) {
  const created = job.postedAt && job.postedAt < Date.now() ? job.postedAt : Date.now();
  const fields = {
    title: str(job.title),
    company: str(job.company),
    description: str(job.description),
    location: str(job.location),
    employmentType: str(job.employmentType),
    salary: str(job.salary),
    category: str(job.category),
    skills: arr(job.skills),
    postedBy: str(IMPORT_OWNER),
    postedByName: str(job.sourceName || "CONNEKT"),
    postedByAvatar: str(initials(job.sourceName || "CONNEKT")),
    status: str("open"),
    applicants: int(0),
    createdAt: ts(created),
    updatedAt: ts(Date.now()),
    sourceName: str(job.sourceName),
    sourceUrl: str(job.sourceUrl),
    applyUrl: str(job.applyUrl || job.sourceUrl),
  };
  if (job.closingAt) fields.deadline = ts(job.closingAt);
  return fields;
}

async function commit(writes) {
  const res = await fetch(`${BASE}:commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) throw new Error(`Commit failed ${res.status}: ${await res.text()}`);
  return res.json();
}

(async () => {
  const jobs = JSON.parse(fs.readFileSync(INPUT, "utf8"));
  console.log(`${jobs.length} jobs from ${INPUT}`);

  const byId = new Map();
  jobs.forEach((job) => byId.set(docId(job), job));
  console.log(`${byId.size} unique document ids`);

  if (DRY_RUN) {
    const sample = [...byId.entries()].slice(0, 3);
    sample.forEach(([id, job]) =>
      console.log(`  ${id}  ${job.employmentType.padEnd(10)} ${job.title} — ${job.company}`)
    );
    console.log("Dry run — nothing written.");
    return;
  }

  const writes = [...byId.entries()].map(([id, job]) => ({
    update: {
      name: `projects/${PROJECT}/databases/(default)/documents/jobs/${id}`,
      fields: toFirestore(job),
    },
  }));

  const BATCH = 200;
  let written = 0;
  for (let i = 0; i < writes.length; i += BATCH) {
    const chunk = writes.slice(i, i + BATCH);
    await commit(chunk);
    written += chunk.length;
    console.log(`  wrote ${written}/${writes.length}`);
  }

  const byType = {};
  const bySource = {};
  [...byId.values()].forEach((j) => {
    byType[j.employmentType] = (byType[j.employmentType] || 0) + 1;
    bySource[j.sourceName] = (bySource[j.sourceName] || 0) + 1;
  });
  console.log(`\n✓ ${written} job documents live in Firestore.`);
  console.log("  by type:", byType);
  console.log("  by source:", bySource);
})().catch((err) => {
  console.error("Seeding failed:", err.message || err);
  process.exit(1);
});
