import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CreditCard, Smartphone, Building2, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

type Method = "card" | "mpesa" | "bank";

const methods = [
  { id: "card" as Method, icon: CreditCard, label: "Card" },
  { id: "mpesa" as Method, icon: Smartphone, label: "M-Pesa" },
  { id: "bank" as Method, icon: Building2, label: "Bank" },
];

const LoadWallet = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [method, setMethod] = useState<Method>("card");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleDeposit = async () => {
    if (!user || !amount) return;
    setProcessing(true);

    try {
      // Get wallet
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (!wallet) throw new Error("Wallet not found");

      // Call appropriate payment provider edge function
      const providerMap = { card: "Paystack", mpesa: "M-Pesa", bank: "Bank Transfer" };

      if (method === "card") {
        supabase.functions.invoke("process-paystack", {
          body: { action: "initialize", amount, currency: wallet.currency, email: user.email },
        }).catch(() => {});
      } else if (method === "mpesa") {
        supabase.functions.invoke("process-mpesa", {
          body: { action: "stk_push", amount, phone: user.phone, wallet_id: wallet.id },
        }).catch(() => {});
      }

      // In production, wallet credit happens via webhook after payment confirmation
      // For now, simulate immediate credit

      // Credit wallet (in production, this happens via webhook after payment confirmation)
      await supabase.from("wallets").update({ balance: Number(wallet.balance) + Number(amount) }).eq("id", wallet.id);

      // Create transaction record
      await supabase.from("transactions").insert({
        reference: ref,
        type: "deposit",
        receiver_user_id: user.id,
        receiver_wallet_id: wallet.id,
        amount: Number(amount),
        currency: wallet.currency,
        description: `${providerMap[method]} Deposit`,
        status: "completed",
        method,
        provider: providerMap[method],
      });

      await refreshUser();
      setDone(true);
      toast.success(`${wallet.currency} ${amount} deposited successfully!`);

      // Send transaction SMS notification (fire-and-forget)
      supabase.functions.invoke("send-transaction-sms", {
        body: { type: "deposit", amount, currency: wallet.currency, reference: ref },
      }).catch(() => {});
    } catch (err: any) {
      toast.error(err.message || "Deposit failed");
    } finally {
      setProcessing(false);
    }
  };

  if (done) {
    return (
      <div className="page-container flex flex-col">
        <div className="px-5 pt-6">
          <div className="page-header px-0 pt-0">
            <button onClick={() => navigate("/dashboard")} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
            <h1 className="text-lg font-bold text-foreground">Load Wallet</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <Check size={40} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Deposit Successful!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.currency} {amount} added to wallet</p>
            <button onClick={() => navigate("/dashboard")} className="mt-6 bg-primary rounded-xl px-8 py-3 text-sm font-semibold text-primary-foreground">Done</button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">Load Wallet</h1>
        </div>

        <div className="mb-6">
          <label className="label-text">Amount ({user?.currency})</label>
          <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="input-field text-center text-3xl font-bold" />
          <div className="flex gap-2 mt-3">
            {[500, 1000, 5000, 10000].map((v) => (
              <button key={v} onClick={() => setAmount(String(v))}
                className={`flex-1 rounded-lg border py-2 text-xs font-medium transition-all ${
                  amount === String(v) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}>{v.toLocaleString()}</button>
            ))}
          </div>
        </div>

        <div className="flex rounded-xl border border-border p-1 mb-6 bg-secondary">
          {methods.map((m) => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-3 text-xs font-medium transition-all ${
                method === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}>
              <m.icon size={14} />{m.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {method === "card" && (
            <motion.div key="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
              <div className="section-card">
                <p className="text-[10px] text-muted-foreground uppercase mb-3 font-medium">Card Details (Paystack)</p>
                <input placeholder="Card Number" className="input-field mb-3 tracking-widest" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input placeholder="MM/YY" className="input-field" />
                  <input placeholder="CVV" type="password" maxLength={4} className="input-field" />
                </div>
                <input placeholder="Cardholder Name" className="input-field" />
              </div>
              <button onClick={handleDeposit} disabled={!amount || processing} className="btn-primary flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : `Pay ${user?.currency} ${amount || "0.00"}`}
              </button>
            </motion.div>
          )}

          {method === "mpesa" && (
            <motion.div key="mpesa" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="section-card">
                <p className="text-[10px] text-muted-foreground uppercase mb-3 font-medium">M-Pesa Number</p>
                <input placeholder="+254 7XX XXX XXX" className="input-field" defaultValue={user?.phone} />
              </div>
              <button onClick={handleDeposit} disabled={!amount || processing} className="btn-primary flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : "Send STK Push"}
              </button>
              <p className="text-center text-xs text-muted-foreground">You'll receive an M-Pesa prompt on your phone</p>
            </motion.div>
          )}

          {method === "bank" && (
            <motion.div key="bank" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="section-card space-y-3">
                <p className="text-[10px] text-muted-foreground uppercase mb-1 font-medium">Bank Transfer Details</p>
                {[
                  { label: "Bank", value: "AbanRemit Trust" },
                  { label: "Account", value: user?.walletNumber || "" },
                  { label: "Reference", value: user?.walletNumber || "" },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground font-mono">{row.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">Transfer funds to the account above and your wallet will be credited automatically</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default LoadWallet;
