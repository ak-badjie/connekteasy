import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// ─── createPayment ─────────────────────────────────────────
export type PaymentType = "wallet_deposit" | "internship_subscription";

export interface CreatePaymentInput {
  amount: number;
  currency?: string;
  type?: PaymentType;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  metadata?: Record<string, unknown>;
}

export interface CreatePaymentResult {
  success: boolean;
  reference: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  status: string;
}

export async function createPayment(
  input: CreatePaymentInput
): Promise<CreatePaymentResult> {
  const callable = httpsCallable<CreatePaymentInput, CreatePaymentResult>(
    functions,
    "createPayment"
  );
  const result = await callable(input);
  return result.data;
}

// ─── requestWithdrawal ─────────────────────────────────────
export interface WithdrawInput {
  amount: number;
  network: string;
  account_number: string;
  beneficiary_name: string;
}

export interface WithdrawResult {
  success: boolean;
  reference: string;
  message: string;
}

export async function requestWithdrawal(
  input: WithdrawInput
): Promise<WithdrawResult> {
  const callable = httpsCallable<WithdrawInput, WithdrawResult>(
    functions,
    "requestWithdrawal"
  );
  const result = await callable(input);
  return result.data;
}

// ─── escrowHold ────────────────────────────────────────────
export interface EscrowHoldInput {
  amount: number;
}

export interface EscrowHoldResult {
  success: boolean;
  newBalance: number;
}

export async function escrowHold(
  input: EscrowHoldInput
): Promise<EscrowHoldResult> {
  const callable = httpsCallable<EscrowHoldInput, EscrowHoldResult>(
    functions,
    "escrowHold"
  );
  const result = await callable(input);
  return result.data;
}

// ─── escrowRelease ─────────────────────────────────────────
export interface EscrowReleaseInput {
  projectId: string;
  finalAmount: number;
}

export interface EscrowReleaseResult {
  success: boolean;
  vaPayout: number;
  refundAmount: number;
  platformFee: number;
}

export async function escrowRelease(
  input: EscrowReleaseInput
): Promise<EscrowReleaseResult> {
  const callable = httpsCallable<EscrowReleaseInput, EscrowReleaseResult>(
    functions,
    "escrowRelease"
  );
  const result = await callable(input);
  return result.data;
}
