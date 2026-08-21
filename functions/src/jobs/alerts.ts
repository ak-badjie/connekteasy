import * as admin from 'firebase-admin';
import {
    jobDigestEmail,
    jobDigestWhatsApp,
    logNotification,
    sendEmail,
    sendWhatsApp,
    type JobBrief,
} from '../notify';
import type { SyncSummary } from './sync';

/**
 * Tell members about the openings that landed today.
 *
 * Two channels, both opt-in and both work-only: WhatsApp for the members who
 * gave us a number, and email for everyone who left email alerts on. Nobody is
 * messaged more than once a day, and nobody is messaged at all unless at least
 * one of the new listings actually looks like something for them.
 */

const MAX_JOBS_PER_DIGEST = 5;
/** Nobody hears from us twice inside this window. */
const MIN_HOURS_BETWEEN_ALERTS = 20;
/** Roles that are looking for work; employers do not get job alerts. */
const SEEKER_ROLES = ['job_seeker', 'student', 'va'];

interface NewJob {
    id: string;
    title: string;
    company: string;
    location: string;
    category: string;
    skills: string[];
    local: boolean;
}

interface Member {
    uid: string;
    email: string;
    firstName: string;
    role: string;
    skills: string[];
    title: string;
    whatsappNumber: string;
    whatsappOptIn: boolean;
    emailOptIn: boolean;
    lastAlertMs: number;
}

const norm = (s: string) => String(s || '').toLowerCase().trim();

/**
 * How well one listing fits one member. Anything above zero is worth sending;
 * the score only decides which openings lead the digest.
 */
export function scoreJob(member: Pick<Member, 'role' | 'skills' | 'title'>, job: NewJob): number {
    const skills = new Set(member.skills.map(norm));
    let score = 0;

    for (const skill of job.skills) if (skills.has(norm(skill))) score += 3;
    if (skills.has(norm(job.category))) score += 2;

    // Their stated target role, matched loosely against the job title.
    const words = norm(member.title)
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3);
    if (words.some((w) => norm(job.title).includes(w))) score += 2;

    // The whole point of the platform: openings people here can actually take.
    if (job.local) score += 1;

    return score;
}

function pickFor(member: Member, jobs: NewJob[]): NewJob[] {
    const scored = jobs
        .map((job) => ({ job, score: scoreJob(member, job) }))
        .filter((row) => row.score > 0)
        .sort((a, b) => b.score - a.score);

    // No profile match at all: a member with an empty profile still deserves
    // to hear about vacancies in the country, which is what they signed up for.
    const chosen = scored.length
        ? scored.map((r) => r.job)
        : jobs.filter((j) => j.local);

    return chosen.slice(0, MAX_JOBS_PER_DIGEST);
}

async function loadMembers(db: admin.firestore.Firestore): Promise<Member[]> {
    const snap = await db.collection('users').get();
    const out: Member[] = [];
    snap.forEach((doc) => {
        const d = doc.data() as any;
        if (!SEEKER_ROLES.includes(d.role)) return;
        const whatsappOptIn = d.whatsappOptIn === true && !!d.whatsappNumber;
        const emailOptIn = d.emailOptIn === true && !!d.email;
        if (!whatsappOptIn && !emailOptIn) return;

        out.push({
            uid: doc.id,
            email: d.email || '',
            firstName: d.firstName || String(d.displayName || '').split(' ')[0] || '',
            role: d.role,
            skills: Array.isArray(d.skills) ? d.skills : [],
            title: d.title || '',
            whatsappNumber: d.whatsappNumber || '',
            whatsappOptIn,
            emailOptIn,
            lastAlertMs: d.lastJobAlertAt?.toMillis?.() || 0,
        });
    });
    return out;
}

export interface AlertSummary {
    candidates: number;
    whatsappSent: number;
    whatsappFailed: number;
    emailSent: number;
    emailFailed: number;
    skippedRecent: number;
    skippedNoMatch: number;
}

export async function sendNewJobAlerts(summary: SyncSummary): Promise<AlertSummary> {
    const result: AlertSummary = {
        candidates: 0,
        whatsappSent: 0,
        whatsappFailed: 0,
        emailSent: 0,
        emailFailed: 0,
        skippedRecent: 0,
        skippedNoMatch: 0,
    };

    const jobs = summary.newJobs;
    if (!jobs.length) return result;

    const db = admin.firestore();
    const members = await loadMembers(db);
    result.candidates = members.length;

    const now = Date.now();
    const cutoff = now - MIN_HOURS_BETWEEN_ALERTS * 60 * 60 * 1000;

    for (const member of members) {
        if (member.lastAlertMs > cutoff) {
            result.skippedRecent++;
            continue;
        }

        const picks = pickFor(member, jobs);
        if (!picks.length) {
            result.skippedNoMatch++;
            continue;
        }

        const briefs: JobBrief[] = picks.map((j) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            location: j.location,
        }));
        let delivered = false;

        if (member.whatsappOptIn) {
            const body = jobDigestWhatsApp(member.firstName, briefs);
            // The template's three placeholders: who, how many, and the lead role.
            const params = [
                member.firstName || 'there',
                String(picks.length),
                `${picks[0].title} at ${picks[0].company}`,
            ];
            const res = await sendWhatsApp(member.whatsappNumber, body, params);
            await logNotification({
                uid: member.uid,
                channel: 'whatsapp',
                kind: 'job_digest',
                to: member.whatsappNumber,
                result: res,
            });
            if (res.ok) {
                result.whatsappSent++;
                delivered = true;
            } else {
                result.whatsappFailed++;
            }
        }

        if (member.emailOptIn) {
            const { subject, html, text } = jobDigestEmail(member.firstName, briefs);
            const res = await sendEmail(member.email, subject, html, text);
            await logNotification({
                uid: member.uid,
                channel: 'email',
                kind: 'job_digest',
                to: member.email,
                subject,
                result: res,
            });
            if (res.ok) {
                result.emailSent++;
                delivered = true;
            } else {
                result.emailFailed++;
            }
        }

        if (delivered) {
            await db
                .collection('users')
                .doc(member.uid)
                .update({ lastJobAlertAt: admin.firestore.Timestamp.fromMillis(now) })
                .catch(() => null);
        }
    }

    console.log('job alerts:', JSON.stringify(result));
    return result;
}
