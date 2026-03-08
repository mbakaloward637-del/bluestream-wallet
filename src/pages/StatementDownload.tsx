import { useState } from "react";
import { ArrowLeft, FileText, Download, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const STATEMENT_FEE = 50;

const StatementDownload = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [period, setPeriod] = useState<"1month" | "3months" | "6months" | "1year">("1month");
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [processing, setProcessing] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const periods = [
    { id: "1month" as const, label: "1 Month" },
    { id: "3months" as const, label: "3 Months" },
    { id: "6months" as const, label: "6 Months" },
    { id: "1year" as const, label: "1 Year" },
  ];

  const handleDownload = async () => {
    if (!agreed || !user) { toast.error("Please agree to the statement fee"); return; }
    setProcessing(true);

    try {
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (!wallet || Number(wallet.balance) < STATEMENT_FEE) throw new Error("Insufficient balance");

      await supabase.from("wallets").update({ balance: Number(wallet.balance) - STATEMENT_FEE }).eq("id", wallet.id);
      await supabase.from("transactions").insert({
        reference: `STM${Date.now()}`,
        type: "send",
        sender_user_id: user.id,
        sender_wallet_id: wallet.id,
        amount: STATEMENT_FEE,
        currency: wallet.currency,
        description: `Statement download (${period})`,
        status: "completed",
      });

      await refreshUser();
      toast.success(`Statement downloaded! ${wallet.currency} ${STATEMENT_FEE} deducted.`);
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate statement");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0">
          <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} className="text-foreground" /></button>
          <h1 className="text-lg font-bold text-foreground">Download Statement</h1>
        </div>

        <div className="space-y-5">
          <div className="section-card flex items-start gap-3 border-warning/30">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 shrink-0 mt-0.5"><AlertCircle size={18} className="text-warning" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground">Statement Fee: {user?.currency} {STATEMENT_FEE}</p>
              <p className="text-xs text-muted-foreground mt-0.5">A fee will be deducted from your wallet.</p>
            </div>
          </div>

          <div className="section-card space-y-2">
            <div className="flex items-center gap-2 mb-1"><FileText size={14} className="text-primary" /><p className="text-xs font-medium text-muted-foreground uppercase">Account</p></div>
            {[
              { label: "Name", value: `${user?.firstName} ${user?.lastName}` },
              { label: "Wallet", value: user?.walletNumber },
              { label: "Currency", value: user?.currency },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground">{row.value}</span>
              </div>
            ))}
          </div>

          <div>
            <label className="label-text flex items-center gap-1"><Calendar size={12}/> Statement Period</label>
            <div className="grid grid-cols-2 gap-2">
              {periods.map((p) => (
                <button key={p.id} onClick={() => setPeriod(p.id)}
                  className={`rounded-xl border py-3 text-xs font-semibold transition-all ${
                    period === p.id ? "border-primary bg-primary/10 text-primary" : "border-border text-foreground hover:border-primary/30"
                  }`}>{p.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-text">Format</label>
            <div className="flex rounded-xl border border-border p-1 bg-secondary">
              {(["pdf", "csv"] as const).map((f) => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`flex-1 rounded-lg py-3 text-xs font-medium uppercase transition-all ${
                    format === f ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}>{f}</button>
              ))}
            </div>
          </div>

          <button onClick={() => setAgreed(!agreed)} className="flex items-center gap-3 w-full">
            <div className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${agreed ? "bg-primary border-transparent" : "border-muted-foreground/30"}`}>
              {agreed && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
            </div>
            <p className="text-xs text-muted-foreground text-left">I agree to pay <span className="font-semibold text-foreground">{user?.currency} {STATEMENT_FEE}</span> for this statement</p>
          </button>

          <button onClick={handleDownload} disabled={processing || !agreed} className="btn-primary flex items-center justify-center gap-2">
            {processing ? <Loader2 size={16} className="animate-spin" /> : <><Download size={16} /> Download Statement ({user?.currency} {STATEMENT_FEE})</>}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default StatementDownload;
