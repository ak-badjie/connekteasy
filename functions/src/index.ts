import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import ModemPay from 'modem-pay';
import * as crypto from 'crypto';

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
// 5. modemPayWebhook — HMAC-SHA512 verified webhook from Modem Pay.
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
            } else if (type === 'internship_subscription') {
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
                            plan: 'internship',
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
                        `Internship subscription active for ${uid} until ${new Date(newEndMs).toISOString()}`
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
