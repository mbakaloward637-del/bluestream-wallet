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
  const [txResult, setTxResult] = useState<{ reference: string; fee: number; currency: string } | null>(null);

  // Lookup recipient using server-side function (bypasses RLS)
  const lookupRecipient = async () => {
    if (recipient.length < 5) return;
    try {
      const { data, error } = await supabase.rpc("lookup_recipient", {
        lookup_type: method,
        lookup_value: recipient,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.found) {
        setRecipientInfo({ name: result.name, wallet: result.wallet || "" });
      } else {
        setRecipientInfo(null);
        toast.error("Recipient not found");
      }
    } catch (err: any) {
      console.error("Lookup error:", err);
      setRecipientInfo(null);
    }
  };

  const handleSend = async () => {
    if (!user || !amount || !pin) return;
    setProcessing(true);

    try {
      const { data, error } = await supabase.rpc("transfer_funds", {
        p_sender_id: user.id,
        p_recipient_wallet: method === "wallet" ? recipient : "",
        p_recipient_phone: method === "phone" ? recipient : "",
        p_amount: Number(amount),
        p_pin: pin,
      });

      if (error) throw error;
      const result = data as any;

      if (!result?.success) {
        throw new Error(result?.error || "Transfer failed");
      }

      setTxResult({
        reference: result.reference,
        fee: result.fee,
        currency: result.currency,
      });

      await refreshUser();
      setDone(true);
      toast.success(`${result.currency} ${amount} sent successfully!`);
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
            <p className="mt-1 text-sm text-muted-foreground">
              {txResult?.currency || user?.currency} {amount} to {recipientInfo?.name || recipient}
            </p>
            {txResult?.fee ? (
              <p className="mt-1 text-xs text-muted-foreground">Fee: {txResult.currency} {txResult.fee.toFixed(2)}</p>
            ) : null}
            <p className="mt-1 text-xs text-muted-foreground">Ref: {txResult?.reference}</p>
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

              <button onClick={() => setStep(2)} disabled={recipient.length < 5 || !recipientInfo} className="btn-primary">Continue</button>
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
