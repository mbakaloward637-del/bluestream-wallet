import { useState } from "react";
import { Wallet, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SuperAdminWalletConfig = () => {
  const { isSuperAdmin } = useAuth();
  const [config, setConfig] = useState({
    minBalance: "0",
    maxBalance: "1000000",
    dailyTransferLimit: "500000",
    dailyWithdrawalLimit: "200000",
    singleTransactionLimit: "100000",
    pinLength: "4",
    failedPinAttempts: "5",
    autoLockDuration: "30",
  });

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can configure wallet settings.</p>
      </div>
    );
  }

  const handleSave = () => toast.success("Wallet configuration updated successfully");

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Wallet size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Wallet System Configuration</p>
          <p className="text-xs text-muted-foreground">Configure wallet limits, security rules, and behavior across the platform.</p>
        </div>
      </div>

      {/* Balance Limits */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Balance Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Minimum Wallet Balance (KES)</label>
            <input className="input-field" type="number" value={config.minBalance} onChange={(e) => setConfig({ ...config, minBalance: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Maximum Wallet Balance (KES)</label>
            <input className="input-field" type="number" value={config.maxBalance} onChange={(e) => setConfig({ ...config, maxBalance: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Transaction Limits */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Transaction Limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Daily Transfer Limit (KES)</label>
            <input className="input-field" type="number" value={config.dailyTransferLimit} onChange={(e) => setConfig({ ...config, dailyTransferLimit: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Daily Withdrawal Limit (KES)</label>
            <input className="input-field" type="number" value={config.dailyWithdrawalLimit} onChange={(e) => setConfig({ ...config, dailyWithdrawalLimit: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Single Transaction Limit (KES)</label>
            <input className="input-field" type="number" value={config.singleTransactionLimit} onChange={(e) => setConfig({ ...config, singleTransactionLimit: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Wallet Security</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">PIN Length (digits)</label>
            <select className="input-field" value={config.pinLength} onChange={(e) => setConfig({ ...config, pinLength: e.target.value })}>
              <option value="4">4 digits</option>
              <option value="5">5 digits</option>
              <option value="6">6 digits</option>
            </select>
          </div>
          <div>
            <label className="label-text">Failed PIN Attempts Before Lock</label>
            <input className="input-field" type="number" value={config.failedPinAttempts} onChange={(e) => setConfig({ ...config, failedPinAttempts: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Auto-Lock Duration (minutes)</label>
            <input className="input-field" type="number" value={config.autoLockDuration} onChange={(e) => setConfig({ ...config, autoLockDuration: e.target.value })} />
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn-primary flex items-center justify-center gap-2">
        <Save size={16} /> Save Configuration
      </button>
    </div>
  );
};

export default SuperAdminWalletConfig;
