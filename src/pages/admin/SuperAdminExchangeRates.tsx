import { useState } from "react";
import { ArrowRightLeft, Save, RefreshCw, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface ExchangeRate {
  id: string;
  from: string;
  to: string;
  rate: number;
  lastUpdated: string;
}

const SuperAdminExchangeRates = () => {
  const { isSuperAdmin } = useAuth();
  const [rateMode, setRateMode] = useState<"manual" | "automatic">("manual");
  const [updateInterval, setUpdateInterval] = useState("60");
  const [rates, setRates] = useState<ExchangeRate[]>([
    { id: "1", from: "USD", to: "KES", rate: 129.50, lastUpdated: "Today, 9:00 AM" },
    { id: "2", from: "GBP", to: "KES", rate: 163.20, lastUpdated: "Today, 9:00 AM" },
    { id: "3", from: "EUR", to: "KES", rate: 140.80, lastUpdated: "Today, 9:00 AM" },
    { id: "4", from: "USD", to: "UGX", rate: 3750.00, lastUpdated: "Today, 9:00 AM" },
    { id: "5", from: "USD", to: "TZS", rate: 2520.00, lastUpdated: "Today, 9:00 AM" },
    { id: "6", from: "KES", to: "UGX", rate: 28.96, lastUpdated: "Today, 9:00 AM" },
  ]);

  const rateHistory = [
    { date: "Mar 8", pair: "USD/KES", oldRate: 128.90, newRate: 129.50, by: "Manual" },
    { date: "Mar 7", pair: "GBP/KES", oldRate: 162.50, newRate: 163.20, by: "Auto" },
    { date: "Mar 7", pair: "EUR/KES", oldRate: 141.20, newRate: 140.80, by: "Auto" },
    { date: "Mar 6", pair: "USD/KES", oldRate: 129.10, newRate: 128.90, by: "Manual" },
    { date: "Mar 5", pair: "USD/UGX", oldRate: 3740.00, newRate: 3750.00, by: "Auto" },
  ];

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can manage exchange rates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <ArrowRightLeft size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Exchange Rate Management</p>
          <p className="text-xs text-muted-foreground">Set and manage currency exchange rates for international remittance.</p>
        </div>
      </div>

      {/* Rate Mode */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Update Mode</h3>
        <div className="flex gap-2 mb-4">
          {(["manual", "automatic"] as const).map((m) => (
            <button key={m} onClick={() => setRateMode(m)} className={`rounded-xl border py-2.5 px-4 text-xs font-medium capitalize transition-all ${rateMode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
              {m} Updates
            </button>
          ))}
        </div>
        {rateMode === "automatic" && (
          <div>
            <label className="label-text">Update Interval (minutes)</label>
            <select className="input-field" value={updateInterval} onChange={(e) => setUpdateInterval(e.target.value)}>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every 1 hour</option>
              <option value="360">Every 6 hours</option>
              <option value="1440">Every 24 hours</option>
            </select>
          </div>
        )}
      </div>

      {/* Current Rates */}
      <div className="section-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Current Exchange Rates</h3>
          <button onClick={() => toast.info("Rates refreshed from market data")} className="flex items-center gap-1.5 text-[10px] text-primary font-medium">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
        <div className="space-y-3">
          {rates.map((rate) => (
            <div key={rate.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-2 min-w-[100px]">
                <span className="text-xs font-bold text-foreground">{rate.from}</span>
                <ArrowRightLeft size={12} className="text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">{rate.to}</span>
              </div>
              <input className="input-field flex-1 text-center font-mono font-bold" type="number" step="0.01" value={rate.rate} onChange={(e) => setRates(prev => prev.map(r => r.id === rate.id ? { ...r, rate: parseFloat(e.target.value) || 0 } : r))} />
              <p className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">{rate.lastUpdated}</p>
            </div>
          ))}
        </div>
        <button onClick={() => toast.success("Exchange rates updated")} className="btn-primary flex items-center justify-center gap-2 mt-4">
          <Save size={16} /> Save Rates
        </button>
      </div>

      {/* Rate History */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Clock size={14} className="text-primary" /> Rate Change History
        </h3>
        <div className="space-y-0">
          {rateHistory.map((h, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-xs font-medium text-foreground">{h.pair}</p>
                <p className="text-[10px] text-muted-foreground">{h.date} • {h.by}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground line-through">{h.oldRate}</p>
                <p className="text-xs font-bold text-foreground">{h.newRate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminExchangeRates;
