import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { collectJobs, stillLive, type ScrapedJob } from './sources';

/**
 * The daily job sync.
 *
 * Every run does four things:
 *   1. re-collects every source (see sources.ts);
 *   2. refreshes the listings we already carry — title, salary, deadline,
 *      description, everything the advert now says;
 *   3. imports whatever is new; and
 *   4. removes listings that have closed: the deadline passed, the advert was
 *      taken down, or the board stopped carrying it.
 *
 * The board is for people in The Gambia, so the mix is held at roughly 70%
 * vacancies inside the country to 30% remote roles open to Gambians. Foreign
 * listings are capped against how many local ones we actually have, rather
 * than to a fixed number, so the board can never fill up with roles nobody
 * here is realistically going to get.
 *
 * Only imported listings (document ids prefixed `imp_`) are ever touched.
 * Anything an employer posted on CONNEKT is left completely alone.
 */

const IMPORT_PREFIX = 'imp_';
/** Imported listings are owned by the platform, not by an employer account. */
const IMPORT_OWNER = 'connekt-import';

/**
 * Share of the board reserved for vacancies inside The Gambia.
 *
 * This is the knob that decides how big the imported board can be: local
 * vacancies are the scarce side, so raising it shrinks the board and lowering
 * it lets more remote-but-eligible roles through. Override with
 * JOB_LOCAL_SHARE in functions/.env.
 */
export const LOCAL_SHARE = Math.min(
    Math.max(Number(process.env.JOB_LOCAL_SHARE || 0.7), 0.1),
    0.95
);
/** Hard ceiling on the imported board, so a good day cannot flood it. */
const TARGET_TOTAL = Number(process.env.JOB_SYNC_TARGET || 400);
/**
 * How many consecutive runs a listing may go unseen before we drop it. Boards
 * go down, rate-limit us and reshuffle their sitemaps; a single bad day should
 * not empty the job board.
 */
const MAX_MISSED_RUNS = 14;

const DAY = 24 * 60 * 60 * 1000;

/**
 * Title is part of the key because some sources (the Public Service
 * Commission, for one) advertise several posts on a single page.
 */
export function docIdFor(job: Pick<ScrapedJob, 'sourceUrl' | 'title'>): string {
    return `${IMPORT_PREFIX}${crypto
        .createHash('sha1')
        .update(`${job.sourceUrl || ''}|${job.title}`)
        .digest('hex')
        .slice(0, 20)}`;
}

const initials = (name = '') =>
    name
        .split(/\s+/)
        .map((w) => w[0])
        .filter(Boolean)
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'CK';

/**
 * Somewhere in The Gambia. Mirrors GAMBIA_PLACES in app/lib/jobUtils.ts, which
 * is what the board itself filters on, so "In The Gambia" means the same thing
 * to the sync and to a job seeker.
 */
const GAMBIA_PLACES =
    /\b(gambia|banjul|serekunda|serrekunda|kanifing|bakau|bakoteh|brikama|bijilo|kotu|fajara|abuko|lamin|sukuta|farafenni|basse|soma|barra|brufut|gunjur|janjanbureh|kerewan|mansakonko|kartong|tanji|sanyang|bwiam|essau|kuntaur)\b/i;

/** True when a location string describes a job physically in the country. */
export function isLocalLocation(location = ''): boolean {
    const value = location.trim();
    // "Remote — EMEA, Gambia" is remote work, not a job in the country.
    if (/^remote/i.test(value)) return false;
    return GAMBIA_PLACES.test(value);
}

/** A vacancy physically inside The Gambia (as opposed to remote-and-eligible). */
export function isLocal(job: Pick<ScrapedJob, 'tier' | 'location'>): boolean {
    return job.tier === 1 && !/^remote/i.test((job.location || '').trim());
}

/**
 * Trim the collected set to the 70/30 mix.
 *
 * Local vacancies are the scarce side, so they set the size of the board:
 * however many we found, foreign listings get at most 3/7 of that. Both sides
 * are then capped by TARGET_TOTAL.
 */
export function applyLocalRatio(
    jobs: ScrapedJob[],
    targetTotal = TARGET_TOTAL,
    localShare = LOCAL_SHARE
): { kept: ScrapedJob[]; localKept: number; foreignKept: number } {
    const newest = (a: ScrapedJob, b: ScrapedJob) => a.tier - b.tier || (b.postedAt || 0) - (a.postedAt || 0);
    const local = jobs.filter(isLocal).sort(newest);
    const foreign = jobs.filter((j) => !isLocal(j)).sort(newest);

    const localKept = local.slice(0, Math.floor(targetTotal * localShare));
    // 70:30 → for every 7 local listings, at most 3 foreign ones.
    const foreignAllowance = Math.round((localKept.length * (1 - localShare)) / localShare);
    const foreignKept = foreign.slice(0, Math.min(foreignAllowance, targetTotal - localKept.length));

    return {
        kept: [...localKept, ...foreignKept],
        localKept: localKept.length,
        foreignKept: foreignKept.length,
    };
}

interface ExistingJob {
    id: string;
    status?: string;
    sourceUrl?: string;
    deadlineMs?: number;
    missedRuns?: number;
    local?: boolean;
    createdAtMs?: number;
}

/** Every imported listing currently on the board. */
async function loadExisting(db: admin.firestore.Firestore): Promise<Map<string, ExistingJob>> {
    const out = new Map<string, ExistingJob>();
    const snap = await db.collection('jobs').where('postedBy', '==', IMPORT_OWNER).get();
    snap.forEach((doc) => {
        if (!doc.id.startsWith(IMPORT_PREFIX)) return;
        const data = doc.data() as any;
        out.set(doc.id, {
            id: doc.id,
            status: data.status,
            sourceUrl: data.sourceUrl || '',
            deadlineMs: data.deadline?.toMillis?.(),
            missedRuns: Number(data.missedRuns || 0),
            // Listings imported before the sync existed have no localVacancy
            // flag. Reading those as foreign would put the whole back catalogue
            // on the wrong side of the 70/30 rule and prune Gambian vacancies
            // to make room for nothing, so fall back to the location.
            local:
                typeof data.localVacancy === 'boolean'
                    ? data.localVacancy
                    : isLocalLocation(data.location || ''),
            createdAtMs: data.createdAt?.toMillis?.(),
        });
    });
    return out;
}

function jobDocument(job: ScrapedJob, now: number, existing?: ExistingJob) {
    const posted = job.postedAt && job.postedAt < now ? job.postedAt : now;
    const fields: Record<string, unknown> = {
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        employmentType: job.employmentType,
        salary: job.salary,
        category: job.category,
        skills: job.skills,
        postedBy: IMPORT_OWNER,
        postedByName: job.sourceName || 'CONNEKT',
        postedByAvatar: initials(job.sourceName || 'CONNEKT'),
        status: 'open',
        sourceName: job.sourceName,
        // The apply link itself lives in jobLinks/{id}, which only paid members
        // can read. Everything here is public.
        external: true,
        localVacancy: isLocal(job),
        tier: job.tier,
        updatedAt: admin.firestore.Timestamp.fromMillis(now),
        lastSeenAt: admin.firestore.Timestamp.fromMillis(now),
        missedRuns: 0,
        closedReason: admin.firestore.FieldValue.delete(),
        // Legacy fields — cleared so an old document stops leaking its link.
        sourceUrl: admin.firestore.FieldValue.delete(),
        applyUrl: admin.firestore.FieldValue.delete(),
    };

    if (job.closingAt) {
        fields.deadline = admin.firestore.Timestamp.fromMillis(job.closingAt);
    } else if (existing?.deadlineMs) {
        // The advert dropped its closing date — so should we.
        fields.deadline = admin.firestore.FieldValue.delete();
    }

    if (!existing) {
        fields.applicants = 0;
        fields.createdAt = admin.firestore.Timestamp.fromMillis(posted);
        fields.importedAt = admin.firestore.Timestamp.fromMillis(now);
    }

    return fields;
}

/** Commit writes in chunks, since a Firestore batch tops out at 500 operations. */
async function commitAll(
    db: admin.firestore.Firestore,
    ops: ((batch: admin.firestore.WriteBatch) => void)[]
): Promise<void> {
    const CHUNK = 200;
    for (let i = 0; i < ops.length; i += CHUNK) {
        const batch = db.batch();
        ops.slice(i, i + CHUNK).forEach((op) => op(batch));
        await batch.commit();
    }
}

export interface SyncSummary {
    startedAt: number;
    finishedAt: number;
    collected: number;
    localKept: number;
    foreignKept: number;
    added: number;
    updated: number;
    removed: number;
    expired: number;
    delisted: number;
    stale: number;
    trimmed: number;
    bySource: Record<string, number>;
    failures: string[];
    newJobs: { id: string; title: string; company: string; location: string; category: string; skills: string[]; local: boolean }[];
}

export async function runJobSync(now = Date.now()): Promise<SyncSummary> {
    const db = admin.firestore();
    const startedAt = now;

    const { jobs: collected, bySource, failures } = await collectJobs(now);
    const { kept, localKept, foreignKept } = applyLocalRatio(collected);
    console.log(
        `collected ${collected.length}, keeping ${kept.length} (${localKept} local / ${foreignKept} foreign)`
    );

    // A run that scraped nothing means the network or every board is down.
    // Refuse to prune the board on that evidence.
    if (!kept.length) {
        const summary: SyncSummary = {
            startedAt,
            finishedAt: Date.now(),
            collected: collected.length,
            localKept: 0,
            foreignKept: 0,
            added: 0,
            updated: 0,
            removed: 0,
            expired: 0,
            delisted: 0,
            stale: 0,
            trimmed: 0,
            bySource,
            failures: [...failures, 'no listings collected — skipped pruning'],
            newJobs: [],
        };
        await recordRun(db, summary);
        return summary;
    }

    const byId = new Map<string, ScrapedJob>();
    kept.forEach((job) => byId.set(docIdFor(job), job));

    const existing = await loadExisting(db);
    const writes: ((batch: admin.firestore.WriteBatch) => void)[] = [];

    // ── 1. Add and refresh everything the feed still carries ──
    let added = 0;
    let updated = 0;
    const newJobs: SyncSummary['newJobs'] = [];

    for (const [id, job] of byId) {
        const prior = existing.get(id);
        if (prior) updated++;
        else {
            added++;
            newJobs.push({
                id,
                title: job.title,
                company: job.company,
                location: job.location,
                category: job.category,
                skills: job.skills,
                local: isLocal(job),
            });
        }

        const fields = jobDocument(job, now, prior);
        writes.push((batch) => batch.set(db.collection('jobs').doc(id), fields, { merge: true }));
        writes.push((batch) =>
            batch.set(db.collection('jobLinks').doc(id), {
                jobId: id,
                sourceName: job.sourceName,
                sourceUrl: job.sourceUrl,
                applyUrl: job.applyUrl || job.sourceUrl,
                updatedAt: admin.firestore.Timestamp.fromMillis(now),
            })
        );
    }

    // ── 2. Work out what has closed ──
    const missing = [...existing.values()].filter((row) => !byId.has(row.id));
    const removeIds: string[] = [];
    let expired = 0;
    let delisted = 0;
    let stale = 0;

    // Anything past its advertised closing date is finished, whatever the
    // board still shows.
    const pastDeadline = missing.filter((row) => row.deadlineMs && row.deadlineMs + DAY < now);
    pastDeadline.forEach((row) => {
        removeIds.push(row.id);
        expired++;
    });

    // For the rest, ask the source whether the advert is still there. Only a
    // 404/410 counts as gone — a 403 or a timeout is the board being awkward.
    const unresolved = missing.filter((row) => !removeIds.includes(row.id));
    const checked = await checkInBatches(unresolved, 6);

    for (const { row, live } of checked) {
        if (live === false) {
            removeIds.push(row.id);
            delisted++;
            continue;
        }
        const missedRuns = (row.missedRuns || 0) + 1;
        if (missedRuns >= MAX_MISSED_RUNS) {
            removeIds.push(row.id);
            stale++;
        } else {
            writes.push((batch) =>
                batch.update(db.collection('jobs').doc(row.id), {
                    missedRuns,
                    updatedAt: admin.firestore.Timestamp.fromMillis(now),
                })
            );
        }
    }

    // ── 3. Hold the 70/30 mix across the whole board ──
    // Listings we are keeping plus those that survived pruning: if the foreign
    // side has crept over its allowance, drop the oldest foreign ones.
    const survivingLocal =
        localKept + missing.filter((r) => r.local && !removeIds.includes(r.id)).length;
    const survivingForeignRows = missing.filter((r) => !r.local && !removeIds.includes(r.id));
    const foreignAllowance = Math.round((survivingLocal * (1 - LOCAL_SHARE)) / LOCAL_SHARE);
    const foreignOverflow = foreignKept + survivingForeignRows.length - foreignAllowance;
    let trimmed = 0;
    if (foreignOverflow > 0) {
        survivingForeignRows
            .sort((a, b) => (a.createdAtMs || 0) - (b.createdAtMs || 0))
            .slice(0, foreignOverflow)
            .forEach((row) => {
                removeIds.push(row.id);
                trimmed++;
            });
    }

    // ── 4. Commit ──
    removeIds.forEach((id) => {
        writes.push((batch) => batch.delete(db.collection('jobs').doc(id)));
        writes.push((batch) => batch.delete(db.collection('jobLinks').doc(id)));
    });

    await commitAll(db, writes);

    const summary: SyncSummary = {
        startedAt,
        finishedAt: Date.now(),
        collected: collected.length,
        localKept,
        foreignKept,
        added,
        updated,
        removed: removeIds.length,
        expired,
        delisted,
        stale,
        trimmed,
        bySource,
        failures,
        newJobs,
    };

    console.log(
        `sync done: +${added} new, ${updated} refreshed, -${removeIds.length} removed ` +
            `(${expired} expired, ${delisted} delisted, ${stale} stale, ${trimmed} over ratio)`
    );
    await recordRun(db, summary);
    return summary;
}

async function checkInBatches(
    rows: ExistingJob[],
    concurrency: number
): Promise<{ row: ExistingJob; live: boolean | null }[]> {
    const out: { row: ExistingJob; live: boolean | null }[] = [];
    let i = 0;
    await Promise.all(
        Array.from({ length: Math.min(concurrency, rows.length) }, async () => {
            while (i < rows.length) {
                const row = rows[i++];
                const live = row.sourceUrl ? await stillLive(row.sourceUrl) : null;
                out.push({ row, live });
            }
        })
    );
    return out;
}

async function recordRun(db: admin.firestore.Firestore, summary: SyncSummary): Promise<void> {
    try {
        const id = new Date(summary.startedAt).toISOString().slice(0, 19).replace(/[:T]/g, '-');
        await db
            .collection('jobSyncRuns')
            .doc(id)
            .set({
                ...summary,
                // The full list can be long; the run log only needs the count.
                newJobs: summary.newJobs.slice(0, 50),
                durationMs: summary.finishedAt - summary.startedAt,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
    } catch (err) {
        console.warn('recordRun failed:', err);
    }
}
