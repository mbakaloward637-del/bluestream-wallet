import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, FileText, Download, Calendar, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const STATEMENT_FEE = 50; // KES

const StatementDownload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const handleDownload = () => {
    if (!agreed) {
      toast.error("Please agree to the statement fee");
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast.success("Statement downloaded! KES 50 deducted from wallet.");
      navigate("/dashboard");
    }, 2000);
  };

  return (
    <div className="min-h-screen gradient-hero pb-24">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Download Statement</h1>
        </div>

        <div className="space-y-5">
          {/* Fee Notice */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 flex items-start gap-3 border-warning/20"
            style={{ borderColor: "hsl(38 92% 50% / 0.2)" }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 shrink-0 mt-0.5">
              <AlertCircle size={18} className="text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Statement Fee: KES {STATEMENT_FEE}</p>
              <p className="text-xs text-muted-foreground mt-0.5">A fee of KES {STATEMENT_FEE} will be deducted from your wallet for each statement download.</p>
            </div>
          </motion.div>

          {/* Account Info */}
          <div className="glass-card rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase">Account</p>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Name</span>
              <span className="font-semibold text-foreground">{user?.firstName} {user?.lastName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Wallet</span>
              <span className="font-semibold text-foreground font-mono">{user?.walletNumber}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Currency</span>
              <span className="font-semibold text-foreground">{user?.currency}</span>
            </div>
          </div>

          {/* Period Selection */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block flex items-center gap-1">
              <Calendar size={12} /> Statement Period
            </label>
            <div className="grid grid-cols-2 gap-2">
              {periods.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`glass-card rounded-xl py-3 text-xs font-bold transition-all ${
                    period === p.id ? "gradient-primary text-primary-foreground" : "text-foreground/80 hover:border-primary/30"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">Format</label>
            <div className="glass-card flex rounded-xl p-1">
              {(["pdf", "csv"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded-lg py-3 text-xs font-semibold uppercase transition-all ${
                    format === f ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Agree to fee */}
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-center gap-3 w-full"
          >
            <div className={`flex h-5 w-5 items-center justify-center rounded border transition-all ${
              agreed ? "gradient-primary border-transparent" : "border-muted-foreground/30"
            }`}>
              {agreed && <span className="text-primary-foreground text-[10px] font-bold">✓</span>}
            </div>
            <p className="text-xs text-muted-foreground text-left">
              I agree to pay <span className="font-bold text-foreground">KES {STATEMENT_FEE}</span> for this statement
            </p>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={processing || !agreed}
            className="btn-primary-glow w-full rounded-xl py-4 text-sm font-bold text-primary-foreground transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Download size={16} />
            {processing ? "Generating Statement..." : `Download Statement (KES ${STATEMENT_FEE})`}
          </button>
        </div>
      </motion.div>
      <BottomNav />
    </div>
  );
};

export default StatementDownload;
