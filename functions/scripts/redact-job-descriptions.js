/**
 * Strip apply links and application email addresses out of the descriptions of
 * listings we imported.
 *
 *   $env:FIRESTORE_TOKEN = (gcloud auth print-access-token)
 *   node functions/scripts/redact-job-descriptions.js [--dry-run]
 *
 * migrate-job-links.js moved the applyUrl field somewhere only members can
 * read it — but several boards also print "To apply: https://…" at the end of
 * the advert itself, which handed the same link straight back to anyone
 * reading the public listing. The daily sync redacts new imports as it writes
 * them (functions/src/jobs/sources.ts); this does the same to what is already
 * on the board.
 *
 * Requires the functions build: run `npm run build` in functions/ first.
 */
const { execSync } = require("child_process");
const { redactContactDetails } = require("../lib/jobs/sources.js");

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

async function listJobs() {
  const docs = [];
  let pageToken = "";
  do {
    const url =
      `${BASE}/jobs?pageSize=200` +
      "&mask.fieldPaths=description&mask.fieldPaths=title&mask.fieldPaths=postedBy" +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`List failed ${res.status}: ${await res.text()}`);
    const data = await res.json();
    (data.documents || []).forEach((d) => {
      const f = d.fields || {};
      docs.push({
        id: d.name.split("/").pop(),
        title: f.title?.stringValue || "",
        postedBy: f.postedBy?.stringValue || "",
        description: f.description?.stringValue || "",
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
  // Employers own what they wrote on their own listings; only touch imports.
  const imported = jobs.filter((j) => j.id.startsWith("imp_"));
  const changed = imported
    .map((j) => ({ ...j, redacted: redactContactDetails(j.description) }))
    // A redaction that guts the advert is worse than the leak; keep the body
    // if less than half of it survived, and let the next sync re-import it.
    .filter((j) => j.redacted !== j.description && j.redacted.length > j.description.length * 0.5);

  console.log(
    `${jobs.length} listings, ${imported.length} imported, ${changed.length} with contact details to remove.`
  );

  if (!changed.length) {
    console.log("Nothing to redact.");
    return;
  }

  if (DRY_RUN) {
    changed.slice(0, 3).forEach((j) => {
      console.log(`\n── ${j.title}`);
      console.log(`   removed ${j.description.length - j.redacted.length} characters`);
      console.log(`   tail now: …${j.redacted.slice(-140).replace(/\n/g, " ")}`);
    });
    console.log("\nDry run — nothing written.");
    return;
  }

  const writes = changed.map((j) => ({
    update: {
      name: `projects/${PROJECT}/databases/(default)/documents/jobs/${j.id}`,
      fields: { description: { stringValue: j.redacted } },
    },
    updateMask: { fieldPaths: ["description"] },
  }));

  const BATCH = 150;
  let done = 0;
  for (let i = 0; i < writes.length; i += BATCH) {
    const chunk = writes.slice(i, i + BATCH);
    await commit(chunk);
    done += chunk.length;
    console.log(`  wrote ${done}/${writes.length}`);
  }

  console.log(`\n✓ Redacted ${changed.length} advert bodies.`);
})().catch((err) => {
  console.error("Redaction failed:", err.message || err);
  process.exit(1);
});
