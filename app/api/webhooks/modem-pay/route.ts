import { NextRequest, NextResponse } from "next/server";
import { getDatabase, ref, runTransaction, get, set } from "firebase/database";
import app from "@/app/lib/firebase";
import crypto from "crypto";

// Webhook secret for verifying Modem Pay signatures
const MODEM_WEBHOOK_SECRET = process.env.MODEM_WEBHOOK_SECRET || process.env.MODEM_PAY_SECRET_KEY || '';

// Verify webhook signature (same pattern as your reference)
function verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!MODEM_WEBHOOK_SECRET) {
        console.warn('Webhook secret not configured, failing securely');
        return false;
    }

    try {
        const expectedSignature = crypto
            .createHmac('sha512', MODEM_WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');

        // Check if lengths match before timingSafeEqual to prevent errors
        if (expectedSignature.length !== signature.length) {
             return false;
        }

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch {
        return false;
    }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text(); // Read raw text for signature verification
    const signature = req.headers.get("x-modem-signature") || "";

    // Verify signature securely
    if (!verifyWebhookSignature(payload, signature)) {
       console.error('Invalid webhook signature');
       return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    console.log("Received Modem Pay webhook:", event.event);

    // Handle successful charges
    if (event.event === "charge.succeeded") {
      const paymentData = event.payload;
      const uid = paymentData.metadata?.uid;
      const amount = paymentData.amount;

      if (!uid || typeof amount !== "number") {
        console.error("Webhook payload missing user ID or amount");
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const rtdb = getDatabase(app);
      
      // Use transaction ID or intent ID to prevent double deposits from local redirect callbacks
      const transactionId = paymentData.id || paymentData.payment_intent_id;
      const processedRef = ref(rtdb, `wallets/${uid}/processed_deposits/${transactionId}`);
      
      const processedSnap = await get(processedRef);

      if (!processedSnap.exists()) {
        const balanceRef = ref(rtdb, `wallets/${uid}/balance`);
        await runTransaction(balanceRef, (currentBalance) => {
          if (currentBalance === null) {
            return amount;
          }
          return currentBalance + amount;
        });
        
        await set(processedRef, true);
        
        // Log transaction history
        const txRefNode = ref(rtdb, `wallets/${uid}/transactions/${transactionId}`);
        await set(txRefNode, {
          id: transactionId,
          type: "deposit",
          amount: amount,
          timestamp: Date.now(),
          status: "completed"
        });

        console.log(`Webhook successfully deposited ${amount} GMD to user ${uid}`);
      } else {
        console.log(`Webhook ignored: Transaction ${transactionId} already processed via callback.`);
      }
    }

    // Always respond with a 200 OK
    return NextResponse.json({ success: true, received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
  }
}

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Modem Pay webhook endpoint is active',
        timestamp: new Date().toISOString(),
    });
}
