import { NextResponse } from "next/server";
import { getDatabase, ref, runTransaction, get, set } from "firebase/database";
import app from "@/app/lib/firebase";

export async function POST(req: Request) {
  try {
    const { transactionId, uid, amount } = await req.json();

    if (!transactionId || !uid || typeof amount !== 'number') {
      return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
    }

    const rtdb = getDatabase(app);
    
    // Check if this transaction was already processed by a webhook to prevent double crediting
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
      
      // Mark transaction as processed
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

      console.log(`Local confirmation successfully deposited ${amount} GMD to user ${uid}`);
    } else {
      console.log(`Local confirmation ignored: Transaction ${transactionId} already processed.`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Local confirmation error:", error);
    return NextResponse.json({ success: false, error: "Confirmation failed" }, { status: 500 });
  }
}
