import { useState, useEffect } from "react";
import { Wallet, Save, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const CONFIG_KEY = "wallet_config";
const defaultConfig = {
  minBalance: "0", maxBalance: "1000000", dailyTransferLimit: "500000", dailyWithdrawalLimit: "200000",
  singleTransactionLimit: "100000", pinLength: "4", failedPinAttempts: "5", autoLockDuration: "30",
};

const SuperAdminWalletConfig = () => {
  const { isSuperAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(defaultConfig);

  const { data: dbConfig, isLoading } = useQuery({
    queryKey: ["platform-config", CONFIG_KEY],
    queryFn: async () => { return await api.admin.platformConfig.get(CONFIG_KEY); },
  });

  useEffect(() => {
    if (dbConfig?.value && typeof dbConfig.value === "object") {
      setConfig({ ...defaultConfig, ...(dbConfig.value as Record<string, string>) });
    }
  }, [dbConfig]);

  if (!isSuperAdmin) {
    return (<div className="section-card text-center py-12"><Shield size={48} className="mx-auto text-destructive mb-4" /><h2 className="text-lg font-bold text-foreground">Access Denied</h2></div>);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.platformConfig.update(CONFIG_KEY, config);
      queryClient.invalidateQueries({ queryKey: ["platform-config", CONFIG_KEY] });
      toast.success("Wallet configuration updated successfully");
    } catch (err: any) { toast.error(err.message || "Failed to save config"); } finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0"><Wallet size={18} className="text-primary" /></div>
        <div><p className="text-sm font-semibold text-foreground">Wallet System Configuration</p><p className="text-xs text-muted-foreground">Configure wallet limits, security rules, and behavior.</p></div>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Balance Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label-text">Minimum Balance (KES)</label><input className="input-field" type="number" value={config.minBalance} onChange={(e) => setConfig({ ...config, minBalance: e.target.value })} /></div>
          <div><label className="label-text">Maximum Balance (KES)</label><input className="input-field" type="number" value={config.maxBalance} onChange={(e) => setConfig({ ...config, maxBalance: e.target.value })} /></div>
        </div>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Transaction Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label-text">Daily Transfer Limit</label><input className="input-field" type="number" value={config.dailyTransferLimit} onChange={(e) => setConfig({ ...config, dailyTransferLimit: e.target.value })} /></div>
          <div><label className="label-text">Daily Withdrawal Limit</label><input className="input-field" type="number" value={config.dailyWithdrawalLimit} onChange={(e) => setConfig({ ...config, dailyWithdrawalLimit: e.target.value })} /></div>
          <div><label className="label-text">Single Transaction Limit</label><input className="input-field" type="number" value={config.singleTransactionLimit} onChange={(e) => setConfig({ ...config, singleTransactionLimit: e.target.value })} /></div>
        </div>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Wallet Security</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label-text">PIN Length</label><select className="input-field" value={config.pinLength} onChange={(e) => setConfig({ ...config, pinLength: e.target.value })}><option value="4">4 digits</option><option value="6">6 digits</option></select></div>
          <div><label className="label-text">Failed PIN Attempts</label><input className="input-field" type="number" value={config.failedPinAttempts} onChange={(e) => setConfig({ ...config, failedPinAttempts: e.target.value })} /></div>
          <div><label className="label-text">Auto-Lock Duration (min)</label><input className="input-field" type="number" value={config.autoLockDuration} onChange={(e) => setConfig({ ...config, autoLockDuration: e.target.value })} /></div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Configuration
      </button>
    </div>
  );
};

export default SuperAdminWalletConfig;
