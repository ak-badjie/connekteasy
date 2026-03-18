import { NextResponse } from "next/server";
import { getDatabase, ref, runTransaction, set } from "firebase/database";
import app from "@/app/lib/firebase";
import ModemPay from "modem-pay";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { uid, amount, network, accountNumber, beneficiaryName } = await req.json();

    if (!uid || typeof amount !== "number" || amount <= 0 || !network || !accountNumber || !beneficiaryName) {
      return NextResponse.json({ success: false, error: "Missing or invalid parameters" }, { status: 400 });
    }

    const secretKey = process.env.MODEM_PAY_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ success: false, error: "Modem Pay config missing" }, { status: 500 });
    }

    const rtdb = getDatabase(app);
    const balanceRef = ref(rtdb, `wallets/${uid}/balance`);

    let deductionSuccess = false;

    // 1. Safely deduct balance first
    await runTransaction(balanceRef, (currentBalance) => {
      if (currentBalance === null || currentBalance < amount) {
        return; // Abort if insufficient funds
      }
      deductionSuccess = true;
      return currentBalance - amount;
    });

    if (!deductionSuccess) {
      return NextResponse.json({ success: false, error: "Insufficient funds" }, { status: 400 });
    }

    const idempotencyKey = crypto.randomUUID();

    try {
      // 2. Initiate payout via Modem Pay
      const modempay = new ModemPay(secretKey);
      
      const transfer = await modempay.transfers.initiate({
        amount: amount,
        currency: "GMD",
        network: network as "afrimoney" | "wave",
        account_number: accountNumber,
        beneficiary_name: beneficiaryName,
        narration: "CONNEKT Wallet Withdrawal",
        metadata: { uid }
      }, idempotencyKey);

      // 3. Log transaction
      const txRefNode = ref(rtdb, `wallets/${uid}/transactions/${idempotencyKey}`);
      await set(txRefNode, {
        id: idempotencyKey,
        type: "withdrawal",
        amount: amount,
        timestamp: Date.now(),
        status: "completed",
        network,
        accountNumber,
        beneficiaryName,
        transferReference: transfer?.transfer_reference || idempotencyKey
      });

      return NextResponse.json({ success: true, transfer }, { status: 200 });

    } catch (apiError: unknown) {
      console.error("Modem Pay Transfer Error:", apiError);
      
      // Refund the user if the external API call failed securely
      await runTransaction(balanceRef, (currentBalance) => {
        return (currentBalance || 0) + amount;
      });

      const msg = apiError instanceof Error ? apiError.message : "Transfer failed. Funds refunded.";
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }

  } catch (error) {
    console.error("Withdrawal error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
