"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import ConnektWalletLogo from "@/components/branding/ConnektWalletLogo";

function CallbackContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  
  const [fallbackId] = useState(`local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const transactionId = searchParams.get("transaction_id") || searchParams.get("id") || searchParams.get("payment_intent_id") || searchParams.get("reference") || fallbackId;
  
  const uid = searchParams.get("uid");
  const amount = searchParams.get("amount");
  
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const isSuccess = status === "completed" || status === "success";

    const processPayment = async () => {
      if (isSuccess && transactionId && uid && amount) {
        try {
          // This local endpoint confirms the redirect success and credits the user 
          // because Webhooks won't reach localhost
          await fetch("/api/modem-pay/confirm-local", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              transactionId,
              uid,
              amount: Number(amount)
            })
          });
        } catch (error) {
          console.error("Failed to process local confirmation", error);
        }
      }
      setProcessing(false);
      
      // Attempt to automatically close the popup window
      const closeTimer = setTimeout(() => {
        window.close();
      }, 1500);
      
      return () => clearTimeout(closeTimer);
    };

    processPayment();
  }, [status, transactionId, uid, amount]);

  const isError = status === "error" || status === "cancelled";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center">
        <div className={`w-20 h-20 mx-auto mb-6 ${isError ? 'opacity-100' : (processing ? 'animate-pulse' : 'opacity-75 grayscale')}`}>
          {isError ? (
            <div className="w-full h-full bg-red-100 rounded-full flex items-center justify-center text-red-500">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : (
            <ConnektWalletLogo />
          )}
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {isError ? "Payment Incomplete" : (processing ? "Confirming Payment..." : "Payment Complete")}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {processing ? "Please wait a moment." : "You can now close this secure window and return to your dashboard."}
        </p>
        <button
          onClick={() => window.close()}
          disabled={processing}
          className={`w-full transition-colors text-white font-medium py-3 rounded-xl ${
            isError ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed"
          }`}
        >
          Close Window
        </button>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}
