/**
 * One-off migration: set `isAdmin: false` on every existing user document.
 *
 * Uses the Firestore REST API with a short-lived OAuth token so it works with
 * the signed-in gcloud user account (no service-account key needed):
 *
 *   $env:FIRESTORE_TOKEN = (gcloud auth print-access-token)
 *   node functions/scripts/set-isadmin-false.js
 *
 * Idempotent — updateMask writes only the isAdmin field, leaving everything
 * else untouched. Re-grant admins via NEXT_PUBLIC_ADMIN_EMAILS or by flipping
 * a single user's isAdmin back to true.
 */
const PROJECT = "connekt-13630";
const TOKEN = process.env.FIRESTORE_TOKEN;
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

async function listUserDocs() {
  const names = [];
  let pageToken = "";
  do {
    const url = `${BASE}/users?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } });
    if (!res.ok) throw new Error(`List failed ${res.status}: ${await res.text()}`);
    const data = await res.json();
    (data.documents || []).forEach((d) => names.push(d.name));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return names;
}

async function setIsAdminFalse(resourceName) {
  const url = `https://firestore.googleapis.com/v1/${resourceName}?updateMask.fieldPaths=isAdmin`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: { isAdmin: { booleanValue: false } } }),
  });
  if (!res.ok) throw new Error(`Patch failed ${res.status}: ${await res.text()}`);
}

(async () => {
  if (!TOKEN) {
    console.error("Missing FIRESTORE_TOKEN. Run: $env:FIRESTORE_TOKEN = (gcloud auth print-access-token)");
    process.exit(1);
  }
  const docs = await listUserDocs();
  console.log(`Found ${docs.length} user document(s).`);
  let n = 0;
  for (const name of docs) {
    await setIsAdminFalse(name);
    n++;
    if (n % 25 === 0) console.log(`  updated ${n}...`);
  }
  console.log(`Done. Set isAdmin:false on ${n} user(s).`);
})().catch((err) => {
  console.error("Migration failed:", err.message || err);
  process.exit(1);
});
