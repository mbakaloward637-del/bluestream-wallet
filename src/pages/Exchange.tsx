import { useState } from "react";
import { ArrowLeft, ArrowUpDown, Loader2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const Exchange = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [from, setFrom] = useState(user?.currency || "KES");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  const { data: rates = [] } = useQuery({
    queryKey: ["exchange-rates"],
    queryFn: async () => {
      const { data } = await supabase.from("exchange_rates").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const currentRate = rates.find(r => r.from_currency === from && r.to_currency === to);
  const rate = currentRate ? Number(currentRate.rate) : 0;
  const converted = amount ? (parseFloat(amount) * rate).toFixed(2) : "0.00";

  const currencies = [...new Set(rates.flatMap(r => [r.from_currency, r.to_currency]))];
  if (currencies.length === 0) currencies.push("KES", "USD", "GBP", "EUR");

  const handleExchange = async () => {
    if (!user || !amount || !rate) return;
    setProcessing(true);
    try {
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (!wallet) throw new Error("Wallet not found");
      if (from !== wallet.currency) throw new Error("Can only exchange from your wallet currency");
      if (Number(wallet.balance) < Number(amount)) throw new Error("Insufficient balance");

      // Debit and record (in production, separate wallets per currency)
      await supabase.from("wallets").update({ balance: Number(wallet.balance) - Number(amount) }).eq("id", wallet.id);
      await supabase.from("transactions").insert({
        reference: `EXC${Date.now()}`,
        type: "exchange",
        sender_user_id: user.id,
        sender_wallet_id: wallet.id,
        receiver_user_id: user.id,
        receiver_wallet_id: wallet.id,
        amount: Number(amount),
        currency: from,
        description: `${from} → ${to} Exchange`,
        status: "completed",
        metadata: { to_currency: to, rate, converted_amount: Number(converted) },
      });

      await refreshUser();
      setDone(true);
      toast.success(`Exchanged ${from} ${amount} → ${to} ${converted}`);
    } catch (err: any) {
      toast.error(err.message || "Exchange failed");
    } finally {
      setProcessing(false);
    }
  };

  if (done) {
    return (
      <div className="page-container flex flex-col">
        <div className="px-5 pt-6"><div className="page-header px-0 pt-0">
          <button onClick={() => navigate("/dashboard")} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">Exchange</h1>
        </div></div>
        <div className="flex-1 flex items-center justify-center px-5">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-success/10"><Check size={40} className="text-success" /></div>
            <h2 className="text-xl font-bold text-foreground">Exchange Complete!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{from} {amount} → {to} {converted}</p>
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
          <h1 className="text-lg font-bold text-foreground">Exchange Currency</h1>
        </div>

        <div className="space-y-4">
          <div className="section-card">
            <p className="text-[10px] text-muted-foreground uppercase mb-2 font-medium">You Send</p>
            <div className="flex gap-3">
              <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field flex-1 text-xl font-bold" />
              <select value={from} onChange={(e) => setFrom(e.target.value)} className="input-field w-20 text-sm font-medium">
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-center">
            <button onClick={() => { const t = from; setFrom(to); setTo(t); }}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card hover:bg-secondary transition-colors">
              <ArrowUpDown size={20} className="text-primary" />
            </button>
          </div>

          <div className="section-card">
            <p className="text-[10px] text-muted-foreground uppercase mb-2 font-medium">You Receive</p>
            <div className="flex gap-3">
              <div className="input-field flex-1 text-xl font-bold text-muted-foreground">{converted}</div>
              <select value={to} onChange={(e) => setTo(e.target.value)} className="input-field w-20 text-sm font-medium">
                {currencies.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="section-card">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium text-foreground">{rate ? `1 ${from} = ${rate} ${to}` : "Rate unavailable"}</span>
            </div>
          </div>

          <button onClick={handleExchange} disabled={!amount || !rate || processing} className="btn-primary flex items-center justify-center gap-2">
            {processing ? <Loader2 size={16} className="animate-spin" /> : "Convert Currency"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Exchange;
