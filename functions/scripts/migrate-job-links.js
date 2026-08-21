/**
 * Move every imported listing's apply link out of the public `jobs` document
 * and into `jobLinks/{jobId}`, which only paid members can read.
 *
 *   $env:FIRESTORE_TOKEN = (gcloud auth print-access-token)
 *   node functions/scripts/migrate-job-links.js [--dry-run]
 *
 * Until this runs, "subscribe to apply" is only enforced in the UI: `jobs` is
 * world-readable, so anyone could pull applyUrl straight out of Firestore. It
 * is idempotent — re-running finds nothing left to move.
 */
const { execSync } = require("child_process");

const PROJECT = "connekt-13630";
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const DRY_RUN = process.argv.includes("--dry-run");

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
const bool = (v) => ({ booleanValue: !!v });
const ts = (ms) => ({ timestampValue: new Date(ms).toISOString() });

async function listJobs() {
  const docs = [];
  let pageToken = "";
  do {
    const url =
      `${BASE}/jobs?pageSize=300` +
      "&mask.fieldPaths=sourceUrl&mask.fieldPaths=applyUrl&mask.fieldPaths=sourceName" +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`List failed ${res.status}: ${await res.text()}`);
    const data = await res.json();
    (data.documents || []).forEach((d) => {
      const f = d.fields || {};
      docs.push({
        id: d.name.split("/").pop(),
        sourceUrl: f.sourceUrl?.stringValue || "",
        applyUrl: f.applyUrl?.stringValue || "",
        sourceName: f.sourceName?.stringValue || "",
      });
    });
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return docs;
}

async function commit(writes) {
  const res = await fetch(`${BASE}:commit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) throw new Error(`Commit failed ${res.status}: ${await res.text()}`);
  return res.json();
}

(async () => {
  const jobs = await listJobs();
  const needsMove = jobs.filter((j) => j.sourceUrl || j.applyUrl);
  console.log(`${jobs.length} listings, ${needsMove.length} still carrying a public link.`);

  if (!needsMove.length) {
    console.log("Nothing to migrate.");
    return;
  }

  if (DRY_RUN) {
    needsMove.slice(0, 5).forEach((j) => console.log(`  ${j.id} → ${j.applyUrl || j.sourceUrl}`));
    console.log("Dry run — nothing written.");
    return;
  }

  const now = Date.now();
  const writes = [];
  for (const job of needsMove) {
    const applyUrl = job.applyUrl || job.sourceUrl;
    writes.push({
      update: {
        name: `projects/${PROJECT}/databases/(default)/documents/jobLinks/${job.id}`,
        fields: {
          jobId: str(job.id),
          sourceName: str(job.sourceName),
          sourceUrl: str(job.sourceUrl || applyUrl),
          applyUrl: str(applyUrl),
          updatedAt: ts(now),
        },
      },
    });
    // Mark the listing as applied-to-elsewhere, and clear the two link fields
    // in the same write. An empty updateMask entry with no matching field in
    // `fields` is how the REST API deletes a field.
    writes.push({
      update: {
        name: `projects/${PROJECT}/databases/(default)/documents/jobs/${job.id}`,
        fields: { external: bool(true) },
      },
      updateMask: { fieldPaths: ["external", "sourceUrl", "applyUrl"] },
    });
  }

  const BATCH = 200;
  let done = 0;
  for (let i = 0; i < writes.length; i += BATCH) {
    await commit(writes.slice(i, i + BATCH));
    done += writes.slice(i, i + BATCH).length;
    console.log(`  wrote ${done}/${writes.length} operations`);
  }

  console.log(`\n✓ ${needsMove.length} apply links moved into jobLinks/.`);
})().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
