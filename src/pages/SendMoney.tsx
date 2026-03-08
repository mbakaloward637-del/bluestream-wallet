import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search, User, Phone, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const SendMoney = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [method, setMethod] = useState<"wallet" | "phone">("wallet");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [step, setStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [recipientInfo, setRecipientInfo] = useState<{ name: string; wallet: string } | null>(null);

  // Lookup recipient
  const lookupRecipient = async () => {
    if (recipient.length < 5) return;
    const field = method === "wallet" ? "wallet_number" : undefined;
    
    let query;
    if (method === "wallet") {
      query = supabase.from("wallets").select("wallet_number, user_id").eq("wallet_number", recipient).single();
    } else {
      query = supabase.from("profiles").select("first_name, last_name, user_id").eq("phone", recipient).single();
    }
    
    const { data } = await query;
    if (data) {
      if (method === "phone") {
        const p = data as any;
        setRecipientInfo({ name: `${p.first_name} ${p.last_name}`, wallet: "" });
      } else {
        // Get profile for wallet user
        const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", (data as any).user_id).single();
        if (profile) setRecipientInfo({ name: `${profile.first_name} ${profile.last_name}`, wallet: (data as any).wallet_number });
      }
    }
  };

  const handleSend = async () => {
    if (!user || !amount || !pin) return;
    setProcessing(true);

    try {
      // Get sender wallet
      const { data: senderWallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (!senderWallet) throw new Error("Wallet not found");
      if (Number(senderWallet.balance) < Number(amount)) throw new Error("Insufficient balance");

      // Get receiver wallet
      let receiverWallet;
      if (method === "wallet") {
        const { data } = await supabase.from("wallets").select("*").eq("wallet_number", recipient).single();
        receiverWallet = data;
      } else {
        const { data: profile } = await supabase.from("profiles").select("user_id").eq("phone", recipient).single();
        if (profile) {
          const { data } = await supabase.from("wallets").select("*").eq("user_id", profile.user_id).single();
          receiverWallet = data;
        }
      }
      if (!receiverWallet) throw new Error("Recipient not found");

      // Get fee
      const { data: feeConfig } = await supabase.from("fee_config").select("*").eq("transaction_type", "send").eq("is_active", true).single();
      let fee = 0;
      if (feeConfig) {
        fee = feeConfig.fee_type === "flat" ? Number(feeConfig.flat_amount || 0) : Number(amount) * Number(feeConfig.percentage || 0) / 100;
      }

      const totalDebit = Number(amount) + fee;
      if (Number(senderWallet.balance) < totalDebit) throw new Error("Insufficient balance including fee");

      // Debit sender
      await supabase.from("wallets").update({ balance: Number(senderWallet.balance) - totalDebit }).eq("id", senderWallet.id);
      // Credit receiver
      await supabase.from("wallets").update({ balance: Number(receiverWallet.balance) + Number(amount) }).eq("id", receiverWallet.id);

      // Create transaction record
      const ref = `TRF${Date.now()}`;
      await supabase.from("transactions").insert({
        reference: ref,
        type: "send",
        sender_user_id: user.id,
        sender_wallet_id: senderWallet.id,
        receiver_user_id: receiverWallet.user_id,
        receiver_wallet_id: receiverWallet.id,
        amount: Number(amount),
        fee,
        currency: senderWallet.currency,
        description: `Sent to ${recipientInfo?.name || recipient}`,
        status: "completed",
      });

      await refreshUser();
      setDone(true);
      toast.success(`${senderWallet.currency} ${amount} sent successfully!`);
    } catch (err: any) {
      toast.error(err.message || "Transfer failed");
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
            <h1 className="text-lg font-bold text-foreground">Send Money</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <Check size={40} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Money Sent!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.currency} {amount} to {recipientInfo?.name || recipient}</p>
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
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Send Money</h1>
        </div>

        <div className="flex rounded-xl border border-border p-1 mb-6 bg-secondary">
          {(["wallet", "phone"] as const).map((m) => (
            <button key={m} onClick={() => { setMethod(m); setRecipient(""); setRecipientInfo(null); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all ${
                method === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}>
              {m === "wallet" ? <User size={16} /> : <Phone size={16} />}
              {m === "wallet" ? "To Wallet" : "To Phone"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="label-text">{method === "wallet" ? "Wallet Number" : "Phone Number"}</label>
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input type="text" placeholder={method === "wallet" ? "WLT..." : "+254 7XX XXX XXX"}
                    value={recipient} onChange={(e) => setRecipient(e.target.value)}
                    onBlur={lookupRecipient} className="input-field pl-11" />
                </div>
              </div>

              {recipientInfo && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-card flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {recipientInfo.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{recipientInfo.name}</p>
                    <p className="text-xs text-muted-foreground">{recipientInfo.wallet || recipient}</p>
                  </div>
                </motion.div>
              )}

              <button onClick={() => setStep(2)} disabled={recipient.length < 5} className="btn-primary">Continue</button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className="label-text">Amount ({user?.currency})</label>
                <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="input-field text-center text-2xl font-bold" />
              </div>

              <div className="section-card space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-medium text-foreground">{recipientInfo?.name || recipient}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="font-medium text-foreground">{user?.currency} {user?.walletBalance.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="label-text">Wallet PIN</label>
                <input type="password" maxLength={6} placeholder="••••••" value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="input-field text-center text-xl tracking-[0.5em]" />
              </div>

              <button onClick={handleSend} disabled={!amount || !pin || processing} className="btn-primary flex items-center justify-center gap-2">
                {processing ? <Loader2 size={16} className="animate-spin" /> : `Send ${user?.currency} ${amount || "0.00"}`}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default SendMoney;
