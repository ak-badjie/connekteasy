import * as admin from 'firebase-admin';

/**
 * Staff access, server-side. Mirrors app/lib/admin.ts and the
 * superAdminEmails() helper in firestore.rules — all three must agree.
 *
 *   admin        — the /admin console.
 *   super admin  — the console plus granting and revoking admin rights.
 *
 * The super-admin list is an email allowlist rather than a document flag, so
 * the first super admin works before any document exists to say so, and so a
 * compromised profile write can never mint one.
 */
export const SUPER_ADMIN_EMAILS = [
    'admin@connekt.gm',
    ...(process.env.SUPER_ADMIN_EMAILS || '')
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
];

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

export function isSuperAdminEmail(email?: string | null): boolean {
    const value = String(email || '').trim().toLowerCase();
    return !!value && SUPER_ADMIN_EMAILS.includes(value);
}

export interface StaffCheck {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    email: string;
}

/** Resolve what a caller is allowed to do, from their token and profile. */
export async function checkStaff(
    uid: string,
    tokenEmail?: string | null
): Promise<StaffCheck> {
    const snap = await admin.firestore().collection('users').doc(uid).get();
    const profile = snap.exists ? (snap.data() as Record<string, unknown>) : null;
    const email = String(tokenEmail || profile?.email || '').trim().toLowerCase();

    const isSuperAdmin = profile?.isSuperAdmin === true || isSuperAdminEmail(email);
    const isAdmin =
        isSuperAdmin || profile?.isAdmin === true || (!!email && ADMIN_EMAILS.includes(email));

    return { isAdmin, isSuperAdmin, email };
}
