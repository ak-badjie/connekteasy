import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';
import ModemPay from 'modem-pay';
import * as crypto from 'crypto';
import { checkStaff, isSuperAdminEmail } from './staff';
import { runJobSync } from './jobs/sync';
import { sendNewJobAlerts } from './jobs/alerts';
import {
    logNotification,
    sendWhatsApp,
    toE164,
    welcomeWhatsApp,
    emailConfigured,
    whatsappConfigured,
} from './notify';

admin.initializeApp();

const MODEM_PAY_SECRET_KEY = process.env.MODEM_PAY_SECRET_KEY || '';
const MODEM_PAY_WEBHOOK_SECRET = process.env.MODEM_PAY_WEBHOOK_SECRET || '';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://connekt.africa';

const modempay = new ModemPay(MODEM_PAY_SECRET_KEY);

const SUPPORTED_NETWORKS = ['wave', 'afrimoney', 'aps', 'qmoney'];
const PLATFORM_FEE_RATE = 0.30;
const INTERNSHIP_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

// ----------------------------------------------------------------------------
// 1. createPayment — generic Modem Pay payment intent.
//    Used for wallet deposits AND internship subscriptions; the webhook
//    branches on metadata.type to fulfil the right side effect.
// ----------------------------------------------------------------------------
export const createPayment = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in to make a payment.');
    }
    const uid = request.auth.uid;
    const data = request.data || {};

    const amount = Number(data.amount);
    const currency: string = data.currency || 'GMD';
    const type: string = data.type || 'wallet_deposit';
    const customer_name: string | undefined = data.customer_name;
    const customer_email: string | undefined = data.customer_email;
    const customer_phone: string | undefined = data.customer_phone;
    const metadata: Record<string, unknown> =
        data.metadata && typeof data.metadata === 'object' ? data.metadata : {};

    if (!amount || amount <= 0 || isNaN(amount)) {
        throw new HttpsError('invalid-argument', 'Invalid amount');
    }

    try {
        const paymentMetadata = {
            ...metadata,
            uid,
            type,
        };

        const response: any = await modempay.paymentIntents.create({
            amount,
            currency,
            customer_name,
            customer_email,
            customer_phone,
            return_url: `${APP_BASE_URL}/payment-callback?status=completed&uid=${encodeURIComponent(uid)}&amount=${amount}`,
            cancel_url: `${APP_BASE_URL}/payment-callback?status=cancelled`,
            metadata: paymentMetadata,
        });

        console.log('Modem Pay raw response:', JSON.stringify(response));

        // The SDK returns the HTTP body directly.  The body shape is
        // { status: boolean, message: string, data: { payment_intent_id, payment_link, ... } }
        // Note: the actual API returns "payment_intent_id" not "id" despite the SDK types.
        const inner = response?.data ?? response;
        const reference: string | undefined =
            inner?.payment_intent_id ?? inner?.id ?? response?.payment_intent_id ?? response?.id ?? inner?.reference ?? response?.reference;
        const paymentLink: string | undefined =
            inner?.payment_link ?? inner?.link ?? response?.payment_link ?? response?.link;

        if (!reference) {
            console.error('Modem Pay response missing reference. Keys:', Object.keys(response || {}));
            throw new HttpsError('internal', 'Modem Pay did not return a payment reference');
        }

        const db = admin.firestore();
        await db.collection('payments').doc(reference).set({
            reference,
            uid,
            amount,
            currency,
            type,
            status: 'pending',
            method: 'modem-pay',
            metadata: paymentMetadata,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            success: true,
            reference,
            paymentUrl: paymentLink,
            amount: inner?.amount ?? amount,
            currency: inner?.currency ?? currency,
            status: inner?.status ?? 'initialized',
        };
    } catch (error: any) {
        console.error('createPayment error:', error?.message || error);
        if (error instanceof HttpsError) throw error;
        const msg = error?.statusCode
            ? `Modem Pay API error (${error.statusCode}): ${error.message}`
            : (error?.message || 'Failed to create payment');
        throw new HttpsError('internal', msg);
    }
});

// ----------------------------------------------------------------------------
// 2. requestWithdrawal — deduct RTDB wallet, initiate Modem Pay transfer,
//    record in Firestore (record-of-truth) + RTDB (live).
// ----------------------------------------------------------------------------
export const requestWithdrawal = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in to withdraw.');
    }
    const uid = request.auth.uid;
    const data = request.data || {};

    const amount = Number(data.amount);
    const network = String(data.network || '').toLowerCase();
    const account_number = String(data.account_number || data.accountNumber || '');
    const beneficiary_name = String(data.beneficiary_name || data.beneficiaryName || '');

    if (!amount || amount <= 0 || isNaN(amount)) {
        throw new HttpsError('invalid-argument', 'Invalid withdrawal amount');
    }
    if (!network || !SUPPORTED_NETWORKS.includes(network)) {
        throw new HttpsError('invalid-argument', 'Invalid or unsupported network');
    }
    if (!account_number) {
        throw new HttpsError('invalid-argument', 'Account/phone number is required');
    }
    if (!beneficiary_name) {
        throw new HttpsError('invalid-argument', 'Beneficiary name is required');
    }

    const rtdb = admin.database();
    const balanceRef = rtdb.ref(`wallets/${uid}/balance`);

    const txResult = await balanceRef.transaction((current: number | null) => {
        if (current === null || current < amount) {
            return; // abort
        }
        return current - amount;
    });

    if (!txResult.committed) {
        throw new HttpsError('failed-precondition', 'Insufficient balance');
    }

    const idempotencyKey = `withdraw_${uid}_${Date.now()}`;

    try {
        const transfer = await modempay.transfers.initiate(
            {
                amount,
                currency: 'GMD',
                network,
                account_number,
                beneficiary_name,
                narration: 'CONNEKT Wallet Withdrawal',
                metadata: { uid },
            },
            idempotencyKey
        );

        const reference = transfer.transfer_reference || transfer.id || idempotencyKey;

        const db = admin.firestore();
        await db.collection('withdrawals').doc(reference).set({
            reference,
            uid,
            amount,
            network,
            accountNumber: account_number,
            beneficiaryName: beneficiary_name,
            status: 'pending',
            idempotencyKey,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await rtdb.ref(`wallets/${uid}/transactions/${reference}`).set({
            id: reference,
            type: 'withdrawal',
            amount,
            timestamp: Date.now(),
            status: 'pending',
            network,
            accountNumber: account_number,
            beneficiaryName: beneficiary_name,
        });

        return {
            success: true,
            reference,
            message: 'Withdrawal initiated. It will be confirmed shortly.',
        };
    } catch (error: any) {
        console.error('requestWithdrawal error, refunding:', error);
        await balanceRef.transaction((current: number | null) => (current || 0) + amount);
        throw new HttpsError(
            'internal',
            error?.message || 'Withdrawal failed. Your balance was refunded.'
        );
    }
});

// ----------------------------------------------------------------------------
// 3. escrowHold — when a client posts a project, deduct the escrow amount
//    from their RTDB wallet and log an escrow_hold transaction.
// ----------------------------------------------------------------------------
export const escrowHold = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const uid = request.auth.uid;
    const data = request.data || {};

    const amount = Number(data.amount);
    if (!amount || amount <= 0 || isNaN(amount)) {
        throw new HttpsError('invalid-argument', 'Invalid escrow amount');
    }

    const rtdb = admin.database();
    const balanceRef = rtdb.ref(`wallets/${uid}/balance`);

    const txResult = await balanceRef.transaction((current: number | null) => {
        if (current === null || current < amount) {
            return; // abort
        }
        return current - amount;
    });

    if (!txResult.committed) {
        throw new HttpsError('failed-precondition', 'Insufficient funds');
    }

    const txId = crypto.randomUUID();
    await rtdb.ref(`wallets/${uid}/transactions/${txId}`).set({
        id: txId,
        type: 'escrow_hold',
        amount,
        timestamp: Date.now(),
        status: 'completed',
    });

    return { success: true, newBalance: txResult.snapshot.val() };
});

// ----------------------------------------------------------------------------
// 4. escrowRelease — owner releases escrow; 30% platform fee, 70% to VA,
//    any unused remainder refunded to the owner. Updates Firestore project.
// ----------------------------------------------------------------------------
export const escrowRelease = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const ownerId = request.auth.uid;
    const data = request.data || {};

    const projectId = String(data.projectId || '');
    const finalAmount = Number(data.finalAmount);

    if (!projectId) {
        throw new HttpsError('invalid-argument', 'Project ID is required');
    }
    if (!finalAmount || finalAmount <= 0 || isNaN(finalAmount)) {
        throw new HttpsError('invalid-argument', 'Invalid final amount');
    }

    const db = admin.firestore();
    const projectRef = db.collection('projects').doc(projectId);
    const projectSnap = await projectRef.get();

    if (!projectSnap.exists) {
        throw new HttpsError('not-found', 'Project not found');
    }
    const project = projectSnap.data() as any;

    if (project.ownerId !== ownerId) {
        throw new HttpsError('permission-denied', 'Only the project owner can release escrow');
    }
    if (project.escrowStatus !== 'held') {
        throw new HttpsError('failed-precondition', 'Escrow is not held or already released');
    }
    const escrowAmount = Number(project.escrowAmount || 0);
    if (finalAmount > escrowAmount) {
        throw new HttpsError('invalid-argument', 'Final amount cannot exceed escrowed budget');
    }
    const vaId: string | undefined = project.hiredVaId;
    if (!vaId) {
        throw new HttpsError('failed-precondition', 'No VA hired on this project');
    }

    const platformFee = finalAmount * PLATFORM_FEE_RATE;
    const vaPayout = finalAmount - platformFee;
    const refundAmount = escrowAmount - finalAmount;

    const rtdb = admin.database();

    await rtdb.ref(`wallets/${vaId}/balance`).transaction(
        (current: number | null) => (current || 0) + vaPayout
    );
    const vaTxId = crypto.randomUUID();
    await rtdb.ref(`wallets/${vaId}/transactions/${vaTxId}`).set({
        id: vaTxId,
        type: 'escrow_release',
        amount: vaPayout,
        timestamp: Date.now(),
        status: 'completed',
        projectId,
    });

    if (refundAmount > 0) {
        await rtdb.ref(`wallets/${ownerId}/balance`).transaction(
            (current: number | null) => (current || 0) + refundAmount
        );
        const ownerTxId = crypto.randomUUID();
        await rtdb.ref(`wallets/${ownerId}/transactions/${ownerTxId}`).set({
            id: ownerTxId,
            type: 'escrow_refund',
            amount: refundAmount,
            timestamp: Date.now(),
            status: 'completed',
            projectId,
        });
    }

    await projectRef.update({
        escrowStatus: 'released',
        status: 'closed',
        finalPayout: finalAmount,
        platformFee,
        vaPayout,
        refundAmount,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        success: true,
        vaPayout,
        refundAmount,
        platformFee,
    };
});

// ----------------------------------------------------------------------------
// 5. reviewVaVerification — an admin approves or rejects a freelancer's VA
//    training/accreditation documents. Freelancer dashboards stay locked until
//    this says 'approved', so the decision is made server-side where the
//    reviewer's identity can't be spoofed.
// ----------------------------------------------------------------------------
export const reviewVaVerification = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const reviewerUid = request.auth.uid;
    const data = request.data || {};

    const uid = String(data.uid || '');
    const status = String(data.status || '');
    const note = String(data.note || '').slice(0, 1000).trim();

    if (!uid) {
        throw new HttpsError('invalid-argument', 'A freelancer uid is required.');
    }
    if (status !== 'approved' && status !== 'rejected') {
        throw new HttpsError('invalid-argument', 'Status must be "approved" or "rejected".');
    }
    if (status === 'rejected' && !note) {
        throw new HttpsError('invalid-argument', 'Please explain why the documents were rejected.');
    }

    const db = admin.firestore();

    const staff = await checkStaff(reviewerUid, request.auth.token?.email);
    if (!staff.isAdmin) {
        throw new HttpsError(
            'permission-denied',
            'Only admins can review freelancer accreditation.'
        );
    }

    const targetRef = db.collection('users').doc(uid);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
        throw new HttpsError('not-found', 'That user no longer exists.');
    }
    const target = targetSnap.data() as any;
    if (target?.role !== 'va') {
        throw new HttpsError(
            'failed-precondition',
            'Only freelancer accounts go through accreditation review.'
        );
    }
    if (status === 'approved' && !(target?.vaCertificates?.length > 0)) {
        throw new HttpsError(
            'failed-precondition',
            'This freelancer has not uploaded any accreditation documents yet.'
        );
    }

    await targetRef.update({
        vaVerificationStatus: status,
        vaVerificationNote: status === 'rejected' ? note : '',
        vaVerificationReviewedAt: admin.firestore.FieldValue.serverTimestamp(),
        vaVerificationReviewedBy: reviewerUid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`VA ${uid} ${status} by admin ${reviewerUid}`);
    return { success: true };
});

// ----------------------------------------------------------------------------
// 6. modemPayWebhook — HMAC-SHA512 verified webhook from Modem Pay.
//    Handles charge.succeeded (wallet deposit / internship subscription),
//    transfer.succeeded, transfer.failed (refund).
// ----------------------------------------------------------------------------
export const modemPayWebhook = onRequest(async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    const signature = (req.headers['x-modem-signature'] as string) || '';
    if (!signature) {
        console.error('Missing Modem Pay signature header');
        res.status(401).send('Missing signature');
        return;
    }
    if (!MODEM_PAY_WEBHOOK_SECRET) {
        console.error('MODEM_PAY_WEBHOOK_SECRET not configured');
        res.status(500).send('Webhook not configured');
        return;
    }

    const rawBody = (req as any).rawBody
        ? ((req as any).rawBody as Buffer).toString('utf8')
        : JSON.stringify(req.body);

    const hash = crypto
        .createHmac('sha512', MODEM_PAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

    if (hash !== signature) {
        console.error('Invalid Modem Pay webhook signature');
        res.status(401).send('Invalid signature');
        return;
    }

    try {
        const event = req.body as { event?: string; payload?: any };
        const eventType = event.event || '';
        const payload = event.payload || {};
        console.log('Modem Pay webhook:', eventType, payload?.id);

        const db = admin.firestore();
        const rtdb = admin.database();

        if (eventType === 'charge.succeeded') {
            const paymentId: string | undefined =
                payload.id || payload.payment_intent_id || payload.reference;
            const uid: string | undefined = payload.metadata?.uid;
            const type: string = payload.metadata?.type || 'wallet_deposit';
            const amount = Number(payload.amount);

            if (!paymentId || !uid || !amount) {
                console.error('charge.succeeded missing fields', { paymentId, uid, amount });
                res.status(200).send('OK (missing fields)');
                return;
            }

            const payRef = db.collection('payments').doc(paymentId);
            const payDoc = await payRef.get();
            if (payDoc.exists && payDoc.data()?.status !== 'completed') {
                await payRef.update({
                    status: 'completed',
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            } else if (!payDoc.exists) {
                await payRef.set({
                    reference: paymentId,
                    uid,
                    amount,
                    currency: payload.currency || 'GMD',
                    type,
                    status: 'completed',
                    method: 'modem-pay',
                    metadata: payload.metadata || {},
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    completedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }

            if (type === 'wallet_deposit') {
                const processedRef = rtdb.ref(`wallets/${uid}/processed_deposits/${paymentId}`);
                const processedSnap = await processedRef.get();
                if (!processedSnap.exists()) {
                    await rtdb
                        .ref(`wallets/${uid}/balance`)
                        .transaction((current: number | null) => (current || 0) + amount);
                    await processedRef.set(true);
                    await rtdb.ref(`wallets/${uid}/transactions/${paymentId}`).set({
                        id: paymentId,
                        type: 'deposit',
                        amount,
                        timestamp: Date.now(),
                        status: 'completed',
                    });
                    console.log(`Credited ${amount} GMD to ${uid} for deposit ${paymentId}`);
                } else {
                    console.log(`Deposit ${paymentId} already processed for ${uid}`);
                }
            } else if (type.endsWith('_subscription')) {
                // Membership subscription (internship_subscription, job_subscription, …).
                // The active check is plan-agnostic, so any of these unlocks the
                // role's gated area. We record the plan for bookkeeping.
                const plan = type.replace('_subscription', '');
                const subRef = db.collection('subscriptions').doc(uid);
                const subSnap = await subRef.get();
                const existing = subSnap.exists ? (subSnap.data() as any) : null;
                if (existing?.lastPaymentRef === paymentId) {
                    console.log(`Subscription payment ${paymentId} already applied for ${uid}`);
                } else {
                    const now = Date.now();
                    const currentEndMs =
                        typeof existing?.currentPeriodEnd?.toMillis === 'function'
                            ? existing.currentPeriodEnd.toMillis()
                            : 0;
                    const baseMs = currentEndMs > now ? currentEndMs : now;
                    const newEndMs = baseMs + INTERNSHIP_PERIOD_MS;

                    await subRef.set(
                        {
                            uid,
                            plan,
                            status: 'active',
                            amount,
                            currency: payload.currency || 'GMD',
                            startedAt:
                                existing?.startedAt || admin.firestore.FieldValue.serverTimestamp(),
                            currentPeriodEnd: admin.firestore.Timestamp.fromMillis(newEndMs),
                            lastPaymentRef: paymentId,
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            createdAt:
                                existing?.createdAt || admin.firestore.FieldValue.serverTimestamp(),
                        },
                        { merge: true }
                    );
                    console.log(
                        `Membership (${plan}) active for ${uid} until ${new Date(newEndMs).toISOString()}`
                    );
                }
            }
        } else if (eventType === 'transfer.succeeded') {
            const reference: string | undefined =
                payload.transfer_reference || payload.reference || payload.id;
            if (reference) {
                const withdrawalRef = db.collection('withdrawals').doc(reference);
                const wSnap = await withdrawalRef.get();
                if (wSnap.exists) {
                    const w = wSnap.data() as any;
                    await withdrawalRef.update({
                        status: 'completed',
                        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                    if (w.uid) {
                        await rtdb
                            .ref(`wallets/${w.uid}/transactions/${reference}/status`)
                            .set('completed');
                    }
                    console.log(`Transfer ${reference} completed for ${w.uid}`);
                }
            }
        } else if (eventType === 'transfer.failed') {
            const reference: string | undefined =
                payload.transfer_reference || payload.reference || payload.id;
            if (reference) {
                const withdrawalRef = db.collection('withdrawals').doc(reference);
                const wSnap = await withdrawalRef.get();
                if (wSnap.exists) {
                    const w = wSnap.data() as any;
                    if (w.status !== 'failed' && w.status !== 'completed') {
                        if (w.uid && typeof w.amount === 'number') {
                            await rtdb
                                .ref(`wallets/${w.uid}/balance`)
                                .transaction((current: number | null) => (current || 0) + w.amount);
                            await rtdb
                                .ref(`wallets/${w.uid}/transactions/${reference}/status`)
                                .set('failed');
                        }
                        await withdrawalRef.update({
                            status: 'failed',
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                        console.log(`Transfer ${reference} failed; refunded ${w.amount} to ${w.uid}`);
                    }
                }
            }
        }

        res.status(200).send('OK');
    } catch (error: any) {
        console.error('Webhook processing error:', error);
        res.status(500).send('Webhook processing failed');
    }
});

// ----------------------------------------------------------------------------
// 7. syncJobsDaily — refresh the imported job board once a day.
//    Re-reads every source, updates the listings we already carry, imports
//    what is new, drops what has closed, and messages members about openings
//    that suit them. See functions/src/jobs/sync.ts for the rules it follows.
// ----------------------------------------------------------------------------
export const syncJobsDaily = onSchedule(
    {
        // 05:00 Banjul, so the board is fresh before the working day starts.
        schedule: '0 5 * * *',
        timeZone: 'Africa/Banjul',
        // 30 minutes is the ceiling for a scheduled function, and comfortably
        // more than a full pass over every source takes.
        timeoutSeconds: 1800,
        memory: '1GiB',
        retryCount: 1,
    },
    async () => {
        const summary = await runJobSync();
        const alerts = await sendNewJobAlerts(summary);
        console.log(
            'daily job sync complete',
            JSON.stringify({
                summary: { ...summary, newJobs: summary.newJobs.length },
                alerts,
            })
        );
    }
);

// ----------------------------------------------------------------------------
// 8. syncJobsNow — the same run, on demand, from the admin console.
// ----------------------------------------------------------------------------
export const syncJobsNow = onCall(
    { timeoutSeconds: 1800, memory: '1GiB' },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError('unauthenticated', 'You must be signed in.');
        }
        const staff = await checkStaff(request.auth.uid, request.auth.token?.email);
        if (!staff.isAdmin) {
            throw new HttpsError('permission-denied', 'Only admins can run the job sync.');
        }

        const summary = await runJobSync();
        const notify = request.data?.notify !== false;
        const alerts = notify ? await sendNewJobAlerts(summary) : null;

        return {
            success: true,
            summary: { ...summary, newJobs: summary.newJobs.length },
            alerts,
        };
    }
);

// ----------------------------------------------------------------------------
// 9. getJobApplyLink — hand over the original advert, but only to a member
//    whose subscription is live. firestore.rules enforces the same thing on
//    the jobLinks collection; this exists so the client has one call that
//    either returns a link or explains why it cannot.
// ----------------------------------------------------------------------------
export const getJobApplyLink = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Sign in to apply for this job.');
    }
    const uid = request.auth.uid;
    const jobId = String(request.data?.jobId || '');
    if (!jobId) throw new HttpsError('invalid-argument', 'A job id is required.');

    const db = admin.firestore();
    const [jobSnap, linkSnap, subSnap] = await Promise.all([
        db.collection('jobs').doc(jobId).get(),
        db.collection('jobLinks').doc(jobId).get(),
        db.collection('subscriptions').doc(uid).get(),
    ]);

    if (!jobSnap.exists) {
        throw new HttpsError('not-found', 'That listing is no longer on the board.');
    }
    if (!linkSnap.exists) {
        throw new HttpsError('not-found', 'This listing is applied to on CONNEKT, not elsewhere.');
    }

    const job = jobSnap.data() as any;
    const staff = await checkStaff(uid, request.auth.token?.email);
    const isOwner = job.postedBy === uid;

    const sub = subSnap.exists ? (subSnap.data() as any) : null;
    const periodEnd = sub?.currentPeriodEnd?.toMillis?.() ?? 0;
    const membershipActive = !!sub && sub.status !== 'expired' && periodEnd > Date.now();

    if (!membershipActive && !staff.isAdmin && !isOwner) {
        throw new HttpsError(
            'permission-denied',
            'An active membership is required to open the application page.'
        );
    }

    const link = linkSnap.data() as any;
    return {
        applyUrl: link.applyUrl || link.sourceUrl || '',
        sourceUrl: link.sourceUrl || '',
        sourceName: link.sourceName || job.sourceName || '',
    };
});

// ----------------------------------------------------------------------------
// 10. saveNotificationPrefs — record a member's WhatsApp number and what they
//     agreed to hear about. The number is normalised to E.164 here so every
//     later send is guaranteed a valid destination, and the first opt-in gets
//     a welcome message so the member can see the channel works.
// ----------------------------------------------------------------------------
export const saveNotificationPrefs = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const uid = request.auth.uid;
    const data = request.data || {};

    const rawNumber = String(data.whatsappNumber || '').trim();
    const whatsappOptIn = data.whatsappOptIn === true;
    const emailOptIn = data.emailOptIn !== false;

    let number = '';
    if (whatsappOptIn || rawNumber) {
        const normalised = toE164(rawNumber);
        if (!normalised) {
            throw new HttpsError(
                'invalid-argument',
                'That does not look like a WhatsApp number. Include the country code, e.g. +220 700 0000.'
            );
        }
        number = normalised;
    }
    if (whatsappOptIn && !number) {
        throw new HttpsError('invalid-argument', 'Please enter the WhatsApp number to use.');
    }

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const before = await userRef.get();
    const prior = before.exists ? (before.data() as any) : {};

    await userRef.set(
        {
            whatsappNumber: number,
            whatsappOptIn,
            emailOptIn,
            ...(whatsappOptIn && !prior.whatsappOptIn
                ? { whatsappOptInAt: admin.firestore.FieldValue.serverTimestamp() }
                : {}),
            notificationsPromptedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
    );

    // Say hello once, the first time a number is switched on.
    let welcomed = false;
    const numberChanged = !!number && number !== prior.whatsappNumber;
    if (whatsappOptIn && (numberChanged || !prior.whatsappOptIn)) {
        const firstName = prior.firstName || String(prior.displayName || '').split(' ')[0] || '';
        const res = await sendWhatsApp(number, welcomeWhatsApp(firstName));
        await logNotification({
            uid,
            channel: 'whatsapp',
            kind: 'welcome',
            to: number,
            result: res,
        });
        welcomed = res.ok;
    }

    return { success: true, whatsappNumber: number, welcomed };
});

// ----------------------------------------------------------------------------
// 11. dismissNotificationPrompt — the member closed the WhatsApp prompt
//     without giving a number. Record that so we stop asking on every visit.
// ----------------------------------------------------------------------------
export const dismissNotificationPrompt = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    await admin
        .firestore()
        .collection('users')
        .doc(request.auth.uid)
        .set(
            {
                notificationsPromptedAt: admin.firestore.FieldValue.serverTimestamp(),
                whatsappOptIn: false,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
        );
    return { success: true };
});

// ----------------------------------------------------------------------------
// 12. setAdminRole — a super admin grants or revokes admin rights.
//     Super admin itself is an email allowlist (functions/src/staff.ts) and is
//     deliberately not grantable through the API.
// ----------------------------------------------------------------------------
export const setAdminRole = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const staff = await checkStaff(request.auth.uid, request.auth.token?.email);
    if (!staff.isSuperAdmin) {
        throw new HttpsError('permission-denied', 'Only a super admin can change admin rights.');
    }

    const uid = String(request.data?.uid || '');
    const value = request.data?.isAdmin === true;
    if (!uid) throw new HttpsError('invalid-argument', 'A user id is required.');

    const db = admin.firestore();
    const targetRef = db.collection('users').doc(uid);
    const target = await targetRef.get();
    if (!target.exists) throw new HttpsError('not-found', 'That user no longer exists.');

    // A super admin's own access is pinned to their email; the flag on the
    // document is only a cache of that, and must not be turned off here.
    if (isSuperAdminEmail((target.data() as any)?.email)) {
        throw new HttpsError(
            'failed-precondition',
            'That account is a super admin. Change the allowlist to alter its access.'
        );
    }

    await targetRef.update({
        isAdmin: value,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`admin ${value ? 'granted to' : 'revoked from'} ${uid} by ${request.auth.uid}`);
    return { success: true };
});

// ----------------------------------------------------------------------------
// 13. claimStaffAccess — stamp the super-admin flags onto the caller's own
//     profile when their email is on the allowlist.
//     The allowlist alone already grants access (firestore.rules checks the
//     token), but the admin console lists staff from the documents, so the
//     flag needs to exist there too. Calling this is safe for anyone: it only
//     ever writes what the allowlist already says.
// ----------------------------------------------------------------------------
export const claimStaffAccess = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const uid = request.auth.uid;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) return { success: false, isAdmin: false, isSuperAdmin: false };

    const profile = snap.data() as any;
    const email = String(request.auth.token?.email || profile.email || '').toLowerCase();
    const superAdmin = isSuperAdminEmail(email);

    if (superAdmin && !(profile.isSuperAdmin === true && profile.isAdmin === true)) {
        await userRef.update({
            isAdmin: true,
            isSuperAdmin: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`super admin flags stamped on ${uid} (${email})`);
    }

    return {
        success: true,
        isAdmin: superAdmin || profile.isAdmin === true,
        isSuperAdmin: superAdmin,
    };
});

// ----------------------------------------------------------------------------
// 14. notificationChannels — what the app can actually send right now, so the
//     admin console can show whether WhatsApp and email are wired up.
// ----------------------------------------------------------------------------
export const notificationChannels = onCall(async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'You must be signed in.');
    }
    const staff = await checkStaff(request.auth.uid, request.auth.token?.email);
    if (!staff.isAdmin) {
        throw new HttpsError('permission-denied', 'Admins only.');
    }
    return { whatsapp: whatsappConfigured(), email: emailConfigured() };
});
