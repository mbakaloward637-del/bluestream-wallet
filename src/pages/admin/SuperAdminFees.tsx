import { useState } from "react";
import { DollarSign, Save, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const FEE_TYPES = ["flat", "percentage", "tiered"] as const;

const SuperAdminFees = () => {
  const { isSuperAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: fees = [], isLoading } = useQuery({
    queryKey: ["admin-fee-config"],
    queryFn: async () => {
      return await api.admin.fees.list();
    },
  });

  const [localFees, setLocalFees] = useState<any[]>([]);
  const displayFees = localFees.length > 0 ? localFees : fees;

  const updateLocalFee = (id: string, updates: Record<string, any>) => {
    const current = localFees.length > 0 ? localFees : fees;
    setLocalFees(current.map((f: any) => f.id === id ? { ...f, ...updates } : f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const fee of displayFees) {
        await api.admin.fees.update(fee.id, {
          fee_type: fee.fee_type, flat_amount: fee.flat_amount, percentage: fee.percentage,
          min_amount: fee.min_amount, max_amount: fee.max_amount, is_active: fee.is_active,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-fee-config"] });
      setLocalFees([]);
      toast.success("Fee configuration saved successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save fees");
    } finally { setSaving(false); }
  };

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can configure fees.</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0"><DollarSign size={18} className="text-primary" /></div>
        <div>
          <p className="text-sm font-semibold text-foreground">Fees & Commissions</p>
          <p className="text-xs text-muted-foreground">Configure platform transaction fees, withdrawal charges, and commissions.</p>
        </div>
      </div>

      {displayFees.map((fee: any) => (
        <div key={fee.id} className="section-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{fee.name}</h3>
              <p className="text-[10px] text-muted-foreground capitalize">{fee.transaction_type} transactions</p>
            </div>
            <div className="flex gap-1.5">
              {FEE_TYPES.map((t) => (
                <button key={t} onClick={() => updateLocalFee(fee.id, { fee_type: t })} className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-lg transition-all ${fee.fee_type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {fee.fee_type === "flat" && (
            <div>
              <label className="label-text">Fixed Amount (KES)</label>
              <input className="input-field" type="number" value={fee.flat_amount ?? 0} onChange={(e) => updateLocalFee(fee.id, { flat_amount: parseFloat(e.target.value) || 0 })} />
            </div>
          )}
          {fee.fee_type === "percentage" && (
            <div>
              <label className="label-text">Percentage (%)</label>
              <input className="input-field" type="number" step="0.1" value={fee.percentage ?? 0} onChange={(e) => updateLocalFee(fee.id, { percentage: parseFloat(e.target.value) || 0 })} />
            </div>
          )}
          {fee.fee_type === "tiered" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label-text">Min Amount</label><input className="input-field text-xs" type="number" value={fee.min_amount ?? 0} onChange={(e) => updateLocalFee(fee.id, { min_amount: parseFloat(e.target.value) || 0 })} /></div>
                <div><label className="label-text">Max Amount</label><input className="input-field text-xs" type="number" value={fee.max_amount ?? 0} onChange={(e) => updateLocalFee(fee.id, { max_amount: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div><label className="label-text">Fee Amount</label><input className="input-field text-xs" type="number" value={fee.flat_amount ?? 0} onChange={(e) => updateLocalFee(fee.id, { flat_amount: parseFloat(e.target.value) || 0 })} /></div>
            </div>
          )}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <span className="text-[10px] text-muted-foreground">Active</span>
            <button onClick={() => updateLocalFee(fee.id, { is_active: !fee.is_active })} className={`w-10 h-5 rounded-full transition-colors ${fee.is_active ? "bg-success" : "bg-border"}`}>
              <div className={`w-4 h-4 rounded-full bg-card transition-transform mx-0.5 ${fee.is_active ? "translate-x-5" : ""}`} />
            </button>
          </div>
        </div>
      ))}

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Fee Configuration
      </button>
    </div>
  );
};

export default SuperAdminFees;
