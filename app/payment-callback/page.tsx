"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ConnektWalletLogo from "@/components/branding/ConnektWalletLogo";

function CallbackContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const isError = status === "error" || status === "cancelled";

  useEffect(() => {
    const timer = setTimeout(() => {
      window.close();
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center">
        <div className={`w-20 h-20 mx-auto mb-6 ${isError ? 'opacity-100' : 'opacity-75 grayscale'}`}>
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
          {isError ? "Payment Incomplete" : "Payment Complete"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          You can now close this secure window and return to your dashboard.
        </p>
        <button
          onClick={() => window.close()}
          className={`w-full transition-colors text-white font-medium py-3 rounded-xl ${
            isError ? "bg-red-600 hover:bg-red-700" : "bg-teal-600 hover:bg-teal-700"
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
