import { NextResponse } from "next/server";
import { getDatabase, ref, runTransaction, set } from "firebase/database";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import app, { db } from "@/app/lib/firebase";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { projectId, ownerId, vaId, finalAmount } = await req.json();

    if (!projectId || !ownerId || !vaId || typeof finalAmount !== "number" || finalAmount <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Note: In a production app, verify the caller's auth token here!

    // 1. Get the project to verify escrowAmount
    const projectRef = doc(db, "projects", projectId);
    const projectSnap = await getDoc(projectRef);

    if (!projectSnap.exists()) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectData = projectSnap.data();
    if (projectData.escrowStatus !== "held") {
      return NextResponse.json({ error: "Escrow is not held or already released" }, { status: 400 });
    }
    if (projectData.ownerId !== ownerId) {
      return NextResponse.json({ error: "Only the owner can release funds" }, { status: 403 });
    }

    const escrowAmount = projectData.escrowAmount || 0;
    if (finalAmount > escrowAmount) {
      return NextResponse.json({ error: "Final amount cannot exceed escrowed budget limit" }, { status: 400 });
    }

    // 2. Calculate Splits
    const platformFee = finalAmount * 0.30;
    const vaPayout = finalAmount - platformFee;
    const refundAmount = escrowAmount - finalAmount;

    const rtdb = getDatabase(app);

    // 3. Update VA Wallet & Log Tx
    const vaBalanceRef = ref(rtdb, `wallets/${vaId}/balance`);
    await runTransaction(vaBalanceRef, (currentBalance) => {
      return (currentBalance || 0) + vaPayout;
    });
    
    const vaTxId = crypto.randomUUID();
    await set(ref(rtdb, `wallets/${vaId}/transactions/${vaTxId}`), {
      id: vaTxId,
      type: "escrow_release",
      amount: vaPayout,
      timestamp: Date.now(),
      status: "completed",
      projectId
    });

    // 4. Update Owner Wallet (Refund) & Log Tx
    if (refundAmount > 0) {
      const ownerBalanceRef = ref(rtdb, `wallets/${ownerId}/balance`);
      await runTransaction(ownerBalanceRef, (currentBalance) => {
        return (currentBalance || 0) + refundAmount;
      });
      
      const ownerTxId = crypto.randomUUID();
      await set(ref(rtdb, `wallets/${ownerId}/transactions/${ownerTxId}`), {
        id: ownerTxId,
        type: "escrow_refund",
        amount: refundAmount,
        timestamp: Date.now(),
        status: "completed",
        projectId
      });
    }

    // 5. Update Firestore Project
    await updateDoc(projectRef, {
      escrowStatus: "released",
      status: "closed",
      finalPayout: finalAmount,
      platformFee: platformFee,
      vaPayout: vaPayout,
      refundAmount: refundAmount,
      completedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      vaPayout, 
      refundAmount, 
      platformFee 
    });
  } catch (error) {
    console.error("Escrow release error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
