import { useState } from "react";
import { ArrowLeft, Building2, Smartphone, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Withdraw = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [method, setMethod] = useState<"bank" | "mobile">("bank");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [destination, setDestination] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const handleWithdraw = async () => {
    if (!user || !amount || !pin) return;
    setProcessing(true);

    try {
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (!wallet) throw new Error("Wallet not found");

      // Get fee
      const { data: feeConfig } = await supabase.from("fee_config").select("*").eq("transaction_type", "withdraw").eq("is_active", true).single();
      let fee = 0;
      if (feeConfig) {
        fee = feeConfig.fee_type === "flat" ? Number(feeConfig.flat_amount || 0) : Number(amount) * Number(feeConfig.percentage || 0) / 100;
      }

      const totalDebit = Number(amount) + fee;
      if (Number(wallet.balance) < totalDebit) throw new Error("Insufficient balance");

      // Debit wallet
      await supabase.from("wallets").update({ balance: Number(wallet.balance) - totalDebit }).eq("id", wallet.id);

      const dest = method === "bank" ? `${bankName} - ${destination}` : destination;
      const ref = `WDR${Date.now()}`;

      // Create withdrawal request
      await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        amount: Number(amount),
        currency: wallet.currency,
        method,
        destination: dest,
        status: "pending",
      });

      // Create transaction record
      await supabase.from("transactions").insert({
        reference: ref,
        type: "withdraw",
        sender_user_id: user.id,
        sender_wallet_id: wallet.id,
        amount: Number(amount),
        fee,
        currency: wallet.currency,
        description: `Withdrawal to ${dest}`,
        status: "pending",
        method,
      });

      await refreshUser();
      setDone(true);
      toast.success("Withdrawal request submitted!");
    } catch (err: any) {
      toast.error(err.message || "Withdrawal failed");
    } finally {
      setProcessing(false);
    }
  };

  if (done) {
    return (
      <div className="page-container flex flex-col">
        <div className="px-5 pt-6"><div className="page-header px-0 pt-0">
          <button onClick={() => navigate("/dashboard")} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">Withdraw</h1>
        </div></div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"><Check size={40} className="text-success" /></div>
            <h2 className="text-xl font-bold text-foreground">Withdrawal Submitted!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{user?.currency} {amount} · Pending approval</p>
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
          <h1 className="text-lg font-bold text-foreground">Withdraw</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label-text">Amount ({user?.currency})</label>
            <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field text-center text-2xl font-bold" />
            <p className="text-[10px] text-muted-foreground mt-1 text-center">Available: {user?.currency} {user?.walletBalance.toFixed(2)}</p>
          </div>

          <div className="flex rounded-xl border border-border p-1 bg-secondary">
            {([{ id: "bank" as const, icon: Building2, label: "Bank" }, { id: "mobile" as const, icon: Smartphone, label: "Mobile Money" }]).map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-medium transition-all ${
                  method === m.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}><m.icon size={14} />{m.label}</button>
            ))}
          </div>

          <div className="section-card space-y-3">
            {method === "bank" ? (
              <>
                <input placeholder="Bank Name" className="input-field" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                <input placeholder="Account Number" className="input-field" value={destination} onChange={(e) => setDestination(e.target.value)} />
                <input placeholder="Account Holder Name" className="input-field" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
              </>
            ) : (
              <input placeholder="M-Pesa Number (+254...)" className="input-field" value={destination} onChange={(e) => setDestination(e.target.value)} />
            )}
          </div>

          <div>
            <label className="label-text">Wallet PIN</label>
            <input type="password" maxLength={6} className="input-field text-center text-xl tracking-[0.5em]" placeholder="••••"
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          </div>

          <button onClick={handleWithdraw} disabled={!amount || !pin || !destination || processing} className="btn-primary flex items-center justify-center gap-2">
            {processing ? <Loader2 size={16} className="animate-spin" /> : `Withdraw ${user?.currency} ${amount || "0.00"}`}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Withdraw;
