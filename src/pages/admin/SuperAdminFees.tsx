import { useState } from "react";
import { DollarSign, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface FeeConfig {
  id: string;
  name: string;
  type: "flat" | "percentage" | "tiered";
  value: number;
  tiers?: { min: number; max: number; fee: number }[];
}

const SuperAdminFees = () => {
  const { isSuperAdmin } = useAuth();
  const [fees, setFees] = useState<FeeConfig[]>([
    { id: "transfer", name: "Wallet Transfer Fee", type: "percentage", value: 1.5 },
    { id: "withdrawal", name: "Withdrawal Fee", type: "tiered", value: 0, tiers: [
      { min: 0, max: 1000, fee: 30 },
      { min: 1001, max: 5000, fee: 50 },
      { min: 5001, max: 20000, fee: 100 },
      { min: 20001, max: 100000, fee: 200 },
    ]},
    { id: "deposit", name: "Deposit Fee", type: "flat", value: 0 },
    { id: "airtime", name: "Airtime Commission", type: "percentage", value: 3.0 },
    { id: "exchange", name: "Currency Exchange Margin", type: "percentage", value: 2.5 },
  ]);

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can configure fees.</p>
      </div>
    );
  }

  const updateFee = (id: string, updates: Partial<FeeConfig>) => {
    setFees(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <DollarSign size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Fees & Commissions</p>
          <p className="text-xs text-muted-foreground">Configure platform transaction fees, withdrawal charges, and commissions.</p>
        </div>
      </div>

      {fees.map((fee) => (
        <div key={fee.id} className="section-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">{fee.name}</h3>
            <div className="flex gap-1.5">
              {(["flat", "percentage", "tiered"] as const).map((t) => (
                <button key={t} onClick={() => updateFee(fee.id, { type: t })} className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-lg transition-all ${fee.type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {fee.type === "flat" && (
            <div>
              <label className="label-text">Fixed Amount (KES)</label>
              <input className="input-field" type="number" value={fee.value} onChange={(e) => updateFee(fee.id, { value: parseFloat(e.target.value) || 0 })} />
            </div>
          )}

          {fee.type === "percentage" && (
            <div>
              <label className="label-text">Percentage (%)</label>
              <input className="input-field" type="number" step="0.1" value={fee.value} onChange={(e) => updateFee(fee.id, { value: parseFloat(e.target.value) || 0 })} />
              <p className="text-[10px] text-muted-foreground mt-1">Example: KES 10,000 transfer → KES {(10000 * fee.value / 100).toFixed(0)} fee</p>
            </div>
          )}

          {fee.type === "tiered" && fee.tiers && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-[10px] font-semibold text-muted-foreground uppercase">
                <span>Min (KES)</span>
                <span>Max (KES)</span>
                <span>Fee (KES)</span>
              </div>
              {fee.tiers.map((tier, i) => (
                <div key={i} className="grid grid-cols-3 gap-2">
                  <input className="input-field text-xs" type="number" value={tier.min} readOnly />
                  <input className="input-field text-xs" type="number" value={tier.max} readOnly />
                  <input className="input-field text-xs" type="number" value={tier.fee} readOnly />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <button onClick={() => toast.success("Fee configuration saved")} className="btn-primary flex items-center justify-center gap-2">
        <Save size={16} /> Save Fee Configuration
      </button>
    </div>
  );
};

export default SuperAdminFees;
