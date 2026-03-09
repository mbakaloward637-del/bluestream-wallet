import { useState } from "react";
import { ArrowRightLeft, Save, RefreshCw, Clock, Shield, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const SuperAdminExchangeRates = () => {
  const { isSuperAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: rates = [], isLoading } = useQuery({
    queryKey: ["admin-exchange-rates"],
    queryFn: async () => {
      return await api.admin.exchangeRates.list();
    },
  });

  const [localRates, setLocalRates] = useState<any[]>([]);
  const displayRates = localRates.length > 0 ? localRates : rates;

  const [newFrom, setNewFrom] = useState("");
  const [newTo, setNewTo] = useState("");
  const [newRate, setNewRate] = useState("");

  const updateLocalRate = (id: string, updates: Record<string, any>) => {
    const current = localRates.length > 0 ? localRates : rates;
    setLocalRates(current.map((r: any) => r.id === id ? { ...r, ...updates } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const rate of displayRates) {
        await api.admin.exchangeRates.update(rate.id, {
          rate: rate.rate, margin_percent: rate.margin_percent, is_active: rate.is_active,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["admin-exchange-rates"] });
      setLocalRates([]);
      toast.success("Exchange rates updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to save rates");
    } finally { setSaving(false); }
  };

  const handleAddRate = async () => {
    if (!newFrom || !newTo || !newRate) { toast.error("Fill all fields"); return; }
    try {
      await api.admin.exchangeRates.create({ from_currency: newFrom.toUpperCase(), to_currency: newTo.toUpperCase(), rate: parseFloat(newRate) });
      queryClient.invalidateQueries({ queryKey: ["admin-exchange-rates"] });
      setNewFrom(""); setNewTo(""); setNewRate(""); setLocalRates([]);
      toast.success("Rate added");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteRate = async (id: string) => {
    try {
      await api.admin.exchangeRates.delete(id);
      queryClient.invalidateQueries({ queryKey: ["admin-exchange-rates"] });
      setLocalRates([]);
      toast.success("Rate removed");
    } catch { toast.error("Failed"); }
  };

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can manage exchange rates.</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0"><ArrowRightLeft size={18} className="text-primary" /></div>
        <div>
          <p className="text-sm font-semibold text-foreground">Exchange Rate Management</p>
          <p className="text-xs text-muted-foreground">Set and manage currency exchange rates for international remittance.</p>
        </div>
      </div>

      <div className="section-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Current Exchange Rates</h3>
          <button onClick={() => { queryClient.invalidateQueries({ queryKey: ["admin-exchange-rates"] }); setLocalRates([]); toast.info("Rates refreshed"); }}
            className="flex items-center gap-1.5 text-[10px] text-primary font-medium"><RefreshCw size={12} /> Refresh</button>
        </div>
        {displayRates.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No exchange rates configured yet.</p>}
        <div className="space-y-3">
          {displayRates.map((rate: any) => (
            <div key={rate.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
              <div className="flex items-center gap-2 min-w-[100px]">
                <span className="text-xs font-bold text-foreground">{rate.from_currency}</span>
                <ArrowRightLeft size={12} className="text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">{rate.to_currency}</span>
              </div>
              <input className="input-field flex-1 text-center font-mono font-bold" type="number" step="0.01" value={rate.rate}
                onChange={(e) => updateLocalRate(rate.id, { rate: parseFloat(e.target.value) || 0 })} />
              <input className="input-field w-16 text-center text-xs" type="number" step="0.1" placeholder="%" value={rate.margin_percent}
                onChange={(e) => updateLocalRate(rate.id, { margin_percent: parseFloat(e.target.value) || 0 })} />
              <button onClick={() => handleDeleteRate(rate.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 size={12} className="text-destructive" /></button>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2 mt-4">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Rates
        </button>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Add New Rate</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input className="input-field text-xs uppercase" placeholder="From (e.g. USD)" value={newFrom} onChange={(e) => setNewFrom(e.target.value)} />
          <input className="input-field text-xs uppercase" placeholder="To (e.g. KES)" value={newTo} onChange={(e) => setNewTo(e.target.value)} />
          <input className="input-field text-xs" type="number" step="0.01" placeholder="Rate" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
        </div>
        <button onClick={handleAddRate} className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-primary py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors">
          <Plus size={14} /> Add Rate
        </button>
      </div>

      <div className="section-card">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock size={12} className="text-primary" />
          <span>Last updated: {displayRates[0]?.updated_at ? new Date(displayRates[0].updated_at).toLocaleString() : "Never"}</span>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminExchangeRates;
