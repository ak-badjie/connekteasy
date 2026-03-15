import { NextResponse } from "next/server";
import { getDatabase, ref, runTransaction, set } from "firebase/database";
import app from "@/app/lib/firebase";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { uid, amount } = await req.json();

    if (!uid || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    const rtdb = getDatabase(app);
    const balanceRef = ref(rtdb, `wallets/${uid}/balance`);

    const { committed, snapshot } = await runTransaction(balanceRef, (currentBalance) => {
      if (currentBalance === null || currentBalance < amount) {
        return; // Abort transaction
      }
      return currentBalance - amount;
    });

    if (!committed) {
      return NextResponse.json({ error: "Insufficient funds" }, { status: 400 });
    }

    // Log transaction history
    const txId = crypto.randomUUID();
    const txRefNode = ref(rtdb, `wallets/${uid}/transactions/${txId}`);
    await set(txRefNode, {
      id: txId,
      type: "escrow_hold",
      amount: amount,
      timestamp: Date.now(),
      status: "completed"
    });

    return NextResponse.json({ success: true, newBalance: snapshot.val() });
  } catch (error) {
    console.error("Escrow hold error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
