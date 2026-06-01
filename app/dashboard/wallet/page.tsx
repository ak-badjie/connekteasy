"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/lib/AuthContext";
import { rtdb } from "@/app/lib/firebase";
import { ref, onValue } from "firebase/database";
import { getProjectsByOwner } from "@/app/lib/firestore";
import { createPayment, requestWithdrawal } from "@/app/lib/payment";
import { fadeInUp, staggerContainer, staggerItem } from "@/app/lib/animations";
import ConnektWalletLogo from "@/components/branding/ConnektWalletLogo";
import ConnektWalletIcon from "@/components/branding/ConnektWalletIcon";
import { Download, X, Plus, ArrowUpRight, ArrowDownRight, Clock, ShieldCheck, FileText } from "lucide-react";
import type { FirestoreProject } from "@/app/lib/types";

interface Transaction {
  id: string;
  type: "deposit" | "withdrawal" | "escrow_hold" | "escrow_release" | "escrow_refund";
  amount: number;
  timestamp: number;
  status: "completed" | "pending" | "failed";
  network?: string;
  accountNumber?: string;
  beneficiaryName?: string;
  transferReference?: string;
  projectId?: string;
}

function formatGMD(amount: number) {
  return new Intl.NumberFormat('en-GM', { style: 'currency', currency: 'GMD' }).format(amount).replace('GMD', '').trim() + ' GMD';
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('en-GB', { 
    year: 'numeric', month: 'short', day: 'numeric', 
    hour: '2-digit', minute: '2-digit'
  });
}

function DynamicIsland({ status, onClose }: { status: "idle" | "waiting" | "completed" | "error"; onClose: () => void }) {
  if (status === "idle") return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 min-w-[220px] justify-center print:hidden"
    >
      {status === "waiting" && (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
          <span className="text-sm font-medium">Processing payment...</span>
        </>
      )}
      {status === "completed" && (
        <>
          <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-gray-900 shrink-0">
            <ShieldCheck size={14} />
          </div>
          <span className="text-sm font-medium">Payment Successful!</span>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shrink-0">
            <X size={14} strokeWidth={3} />
          </div>
          <span className="text-sm font-medium pr-2">Payment Failed</span>
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-white border-l border-gray-600 pl-2">Dismiss</button>
        </>
      )}
    </motion.div>
  );
}

function ReceiptModal({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  const getLabel = () => {
    switch (tx.type) {
      case "deposit": return "Wallet Deposit";
      case "withdrawal": return "Wallet Withdrawal";
      case "escrow_hold": return "Project Escrow Hold";
      case "escrow_release": return "Project Payment Received";
      case "escrow_refund": return "Escrow Refund";
      default: return "Transaction";
    }
  };

  const getIcon = () => {
    if (tx.type === "deposit" || tx.type === "escrow_release" || tx.type === "escrow_refund") {
      return <ArrowDownRight className="text-emerald-500" size={24} />;
    }
    return <ArrowUpRight className="text-red-500" size={24} />;
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden" 
        onClick={onClose}
      />
      
      {/* Modal / Printable Area */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:max-w-none print:w-full print:rounded-none"
      >
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 print:hidden">
            <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-full transition-colors">
              <Download size={16} /> Print Receipt
            </button>
          </div>

          <div className="hidden print:flex items-center justify-center gap-2 mb-8">
            <ConnektWalletIcon />
            <h1 className="font-display text-2xl font-bold text-gray-900">CONNEKT Wallet</h1>
          </div>

          {/* Receipt Content */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              {getIcon()}
            </div>
            <h2 className="font-display text-lg font-medium text-gray-600 mb-1">{getLabel()}</h2>
            <div className="text-4xl font-bold text-gray-900">{formatGMD(tx.amount)}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full uppercase tracking-wide">
               <ShieldCheck size={14} /> {tx.status}
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Transaction ID</span>
              <span className="font-medium text-gray-900 truncate max-w-[180px]" title={tx.id}>{tx.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-medium text-gray-900">{formatDate(tx.timestamp)}</span>
            </div>
            
            {tx.network && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium text-gray-900 capitalize">{tx.network}</span>
              </div>
            )}
            {tx.accountNumber && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account</span>
                <span className="font-medium text-gray-900">{tx.accountNumber}</span>
              </div>
            )}
            {tx.beneficiaryName && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Beneficiary</span>
                <span className="font-medium text-gray-900">{tx.beneficiaryName}</span>
              </div>
            )}
            {tx.projectId && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Project ID</span>
                <span className="font-medium text-gray-900 truncate max-w-[180px]" title={tx.projectId}>{tx.projectId}</span>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t border-dashed border-gray-200 text-center">
            <p className="text-xs text-gray-400">Powered by CONNEKT & Modem Pay</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WalletContent() {
  const { user, userProfile } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [escrowHoldings, setEscrowHoldings] = useState<FirestoreProject[]>([]);
  
  // App States
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [activeModal, setActiveModal] = useState<"deposit" | "withdraw" | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationComplete(true), 5600);
    return () => clearTimeout(timer);
  }, []);

  const [paymentStatus, setPaymentStatus] = useState<"idle" | "waiting" | "completed" | "error">("idle");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  
  // Deposit Form
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Withdraw Form
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [network, setNetwork] = useState<string>("afrimoney");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [beneficiaryName, setBeneficiaryName] = useState<string>("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const paymentStatusRef = useRef(paymentStatus);
  const balanceRefValue = useRef(balance);

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    paymentStatusRef.current = paymentStatus;
    balanceRefValue.current = balance;
  }, [paymentStatus, balance]);

  useEffect(() => {
    if (userProfile?.role) {
      setUserRole(userProfile.role);
    }
  }, [userProfile?.role]);

  useEffect(() => {
    if (!user) return;
    
    let isInitialLoad = true;

    // Listen to Balance
    const balanceRef = ref(rtdb, `wallets/${user.uid}/balance`);
    const unsubBalance = onValue(balanceRef, (snapshot) => {
      const val = snapshot.exists() ? snapshot.val() : 0;
      
      if (!isInitialLoad && activeModal === "deposit") {
         if (val > balanceRefValue.current && paymentStatusRef.current === "waiting") {
            setPaymentStatus("completed");
            setDepositAmount("");
            setTimeout(() => {
              setPaymentStatus("idle");
              setActiveModal(null);
            }, 4000);
         }
      }
      setBalance(val);
      isInitialLoad = false;
      setTimeout(() => setLoadingInitial(false), 500); // tiny delay for visual smoothness
    });

    // Listen to Transactions
    const txRef = ref(rtdb, `wallets/${user.uid}/transactions`);
    const unsubTx = onValue(txRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const txList = Object.values(data) as Transaction[];
        setTransactions(txList.sort((a, b) => b.timestamp - a.timestamp));
      }
    });

    // Fetch Escrow Projects
    if (userRole === "client") {
      getProjectsByOwner(user.uid).then(projects => {
        setEscrowHoldings(projects.filter(p => p.escrowStatus === "held"));
      }).catch(console.error);
    }

    return () => {
      unsubBalance();
      unsubTx();
    };
  }, [user, userRole, activeModal]);

  const handleDeposit = async () => {
    if (!user || !depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0) {
      setDepositError("Please enter a valid amount.");
      return;
    }
    setDepositError(null);
    setDepositLoading(true);

    // Detect mobile/iOS — popups are blocked after async calls on these devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // On desktop, pre-open the popup synchronously (preserves user gesture context)
    let popup: Window | null = null;
    if (!isMobile) {
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      popup = window.open(
        "about:blank",
        "ModemPayCheckout",
        `width=${width},height=${height},top=${top},left=${left},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
      );
    }

    try {
      const result = await createPayment({
        amount: Number(depositAmount),
        type: "wallet_deposit",
        customer_name: userProfile?.displayName,
        customer_email: userProfile?.email,
      });

      if (!result.paymentUrl) {
        if (popup) popup.close();
        throw new Error("Failed to get payment link");
      }

      setPaymentStatus("waiting");

      if (isMobile) {
        // On mobile: redirect in same tab (popups are unreliable on iOS Safari)
        window.location.href = result.paymentUrl;
        return;
      }

      // On desktop: navigate the pre-opened popup to the payment URL
      if (popup && !popup.closed) {
        popup.location.href = result.paymentUrl;

        const pollTimer = window.setInterval(() => {
          if (popup && popup.closed) {
            window.clearInterval(pollTimer);
            if (paymentStatusRef.current === "waiting") {
               setTimeout(() => {
                  if (paymentStatusRef.current === "waiting") {
                     setPaymentStatus("idle");
                  }
               }, 1500);
            }
          }
        }, 500);
      } else {
        // Popup was still blocked somehow — fallback to redirect
        window.location.href = result.paymentUrl;
      }

    } catch (err: unknown) {
      if (popup && !popup.closed) popup.close();
      setDepositError(err instanceof Error ? err.message : "Unknown error");
      setPaymentStatus("error");
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!user || !withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      setWithdrawError("Please enter a valid amount.");
      return;
    }
    if (Number(withdrawAmount) > balance) {
      setWithdrawError("Insufficient funds.");
      return;
    }
    if (!accountNumber || !beneficiaryName) {
      setWithdrawError("Please fill in all mobile money details.");
      return;
    }

    setWithdrawError(null);
    setWithdrawLoading(true);

    try {
      await requestWithdrawal({
        amount: Number(withdrawAmount),
        network,
        account_number: accountNumber,
        beneficiary_name: beneficiaryName,
      });

      // Success
      setActiveModal(null);
      setWithdrawAmount("");
      setAccountNumber("");
      setBeneficiaryName("");
      alert(`Withdrawal of ${formatGMD(Number(withdrawAmount))} initiated via ${network}. It will be confirmed shortly.`);

    } catch (err: unknown) {
      setWithdrawError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (loadingInitial || !animationComplete) {
    return (
      <div className="flex justify-center items-center h-full w-full">
         <ConnektWalletLogo />
      </div>
    );
  }

  const totalEscrow = escrowHoldings.reduce((sum, p) => sum + (p.escrowAmount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col print:p-0 print:m-0 print:h-auto pb-6">
      {/* Exclude DynamicIsland from print automatically by its CSS */}
      <AnimatePresence>
        <DynamicIsland status={paymentStatus} onClose={() => setPaymentStatus("idle")} />
      </AnimatePresence>

      <AnimatePresence>
        {selectedTx && <ReceiptModal tx={selectedTx} onClose={() => setSelectedTx(null)} />}
      </AnimatePresence>

      {/* Main Page Layout (Hidden when printing) */}
      <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="print:hidden flex-1 flex flex-col min-h-0">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4 sm:mb-6 shrink-0">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-mustard-600 shadow-sm border border-teal-100">
            <ConnektWalletIcon />
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">CONNEKT Wallet</h1>
        </motion.div>

        {/* Dashboard Grid */}
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 flex-1 min-h-0 pb-2 overflow-y-auto lg:overflow-hidden">
          
          {/* Left Column: Balance & Actions */}
          <div className="lg:col-span-1 flex flex-col gap-6 lg:overflow-y-auto no-scrollbar shrink-0">
            {/* Balance Card */}
            <motion.div variants={fadeInUp} className="isolate transform-gpu z-0 bg-teal-700 bg-gradient-to-br from-teal-600 to-teal-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
              <p className="text-teal-100 font-medium mb-1">Available Balance</p>
              <div className="text-4xl font-bold tracking-tight mb-8">
                {balance.toLocaleString()} <span className="text-xl text-teal-200 font-medium">GMD</span>
              </div>
              <div className="flex gap-3 relative z-10">
                <button onClick={() => setActiveModal("deposit")} className="flex-1 min-w-0 bg-white text-teal-900 py-2.5 px-4 rounded-xl font-semibold text-sm hover:bg-teal-50 transition-colors shadow-sm flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <Plus size={16} className="shrink-0" /> Deposit
                </button>
                <button onClick={() => setActiveModal("withdraw")} className="flex-1 min-w-0 bg-teal-700/50 hover:bg-teal-600/70 border border-teal-500/30 text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap">
                  <ArrowUpRight size={16} className="shrink-0" /> Withdraw
                </button>
              </div>
            </motion.div>

            {/* Escrow Holdings (Clients Only) */}
            {userProfile?.role === "client" && (
              <motion.div variants={fadeInUp} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-mustard-600" /> Escrow Holdings
                  </h2>
                  <span className="text-sm font-semibold text-gray-900">{formatGMD(totalEscrow)}</span>
                </div>
                {escrowHoldings.length === 0 ? (
                  <p className="text-sm text-gray-500">No funds currently held in escrow.</p>
                ) : (
                  <div className="space-y-3">
                    {escrowHoldings.map(p => (
                      <div key={p.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                          <p className="text-xs text-gray-500">Held for project</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900 shrink-0">{formatGMD(p.escrowAmount || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Right Column: Transaction History */}
          <div className="lg:col-span-2">
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText size={20} className="text-gray-400" /> Transaction History
                </h2>
              </div>
              <div className="p-6 flex-1">
                {transactions.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center py-12">
                    <Clock size={40} className="text-gray-300 mb-3" />
                    <h3 className="font-display text-sm font-semibold text-gray-900 mb-1">No transactions yet</h3>
                    <p className="text-xs text-gray-500">Your deposits, withdrawals, and escrow activity will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map(tx => {
                      const isPositive = tx.type === "deposit" || tx.type === "escrow_release" || tx.type === "escrow_refund";
                      const Icon = isPositive ? ArrowDownRight : ArrowUpRight;
                      return (
                        <div 
                          key={tx.id} 
                          onClick={() => setSelectedTx(tx)}
                          className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 cursor-pointer transition-colors group border border-transparent hover:border-gray-100"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-600'}`}>
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 capitalize">
                                {tx.type.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">{formatDate(tx.timestamp)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-gray-900'}`}>
                              {isPositive ? '+' : '-'}{formatGMD(tx.amount)}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-400 font-medium capitalize mt-0.5 group-hover:text-mustard-600 transition-colors">
                               View Receipt
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Deposit Modal */}
      <AnimatePresence>
        {activeModal === "deposit" && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center print:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-xl font-bold text-gray-900">Deposit Funds</h2>
                <button onClick={() => setActiveModal(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (GMD)</label>
                  <div className="relative">
                    <input type="number" min="1" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} disabled={paymentStatus === "waiting"} className="w-full pl-4 pr-16 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all" placeholder="0" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-gray-500 font-medium">GMD</span>
                    </div>
                  </div>
                </div>
                {depositError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{depositError}</p>}
                <button onClick={handleDeposit} disabled={depositLoading || paymentStatus === "waiting" || !depositAmount} className="w-full bg-teal-600 hover:bg-mustard-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                  {depositLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Connecting...</> : "Deposit via Modem Pay"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {activeModal === "withdraw" && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center print:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-xl font-bold text-gray-900">Withdraw Funds</h2>
                <button onClick={() => setActiveModal(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount to Withdraw</label>
                  <div className="relative">
                    <input type="number" min="1" max={balance} value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full pl-4 pr-16 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all" placeholder="0" />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <span className="text-gray-500 font-medium">GMD</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-gray-500">Avail: {formatGMD(balance)}</span>
                    <button onClick={() => setWithdrawAmount(balance.toString())} className="text-xs font-semibold text-mustard-600 hover:text-mustard-700">Max</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Network</label>
                  <select value={network} onChange={(e) => setNetwork(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 outline-none">
                    <option value="afrimoney">Afrimoney</option>
                    <option value="wave">Wave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number</label>
                  <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 7000000" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Beneficiary Name</label>
                  <input type="text" value={beneficiaryName} onChange={(e) => setBeneficiaryName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mustard-500 transition-all" />
                </div>

                {withdrawError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100">{withdrawError}</p>}
                
                <button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawAmount || !accountNumber || !beneficiaryName} className="w-full bg-teal-600 hover:bg-mustard-600 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all mt-2 flex items-center justify-center gap-2">
                  {withdrawLoading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</> : "Confirm Withdrawal"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-full w-full">
         <ConnektWalletLogo />
      </div>
    }>
      <WalletContent />
    </Suspense>
  );
}
