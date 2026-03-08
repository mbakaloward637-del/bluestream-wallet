import { useState } from "react";
import { CreditCard, Smartphone, Building2, Save, Eye, EyeOff, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface Gateway {
  id: string;
  name: string;
  icon: typeof CreditCard;
  enabled: boolean;
  mode: "sandbox" | "production";
  apiKey: string;
  secretKey: string;
  webhookUrl: string;
  callbackUrl: string;
}

const SuperAdminPaymentGateway = () => {
  const { isSuperAdmin } = useAuth();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [gateways, setGateways] = useState<Gateway[]>([
    { id: "paystack", name: "Paystack", icon: CreditCard, enabled: true, mode: "sandbox", apiKey: "pk_test_xxxxxxxxxxxx", secretKey: "sk_test_xxxxxxxxxxxx", webhookUrl: "https://api.abanremit.com/webhooks/paystack", callbackUrl: "https://abanremit.com/payment/callback" },
    { id: "mpesa", name: "M-Pesa (Daraja)", icon: Smartphone, enabled: true, mode: "sandbox", apiKey: "mpesa_consumer_key_xxx", secretKey: "mpesa_consumer_secret_xxx", webhookUrl: "https://api.abanremit.com/webhooks/mpesa", callbackUrl: "https://abanremit.com/mpesa/callback" },
    { id: "bank", name: "Bank Transfer", icon: Building2, enabled: false, mode: "sandbox", apiKey: "", secretKey: "", webhookUrl: "https://api.abanremit.com/webhooks/bank", callbackUrl: "https://abanremit.com/bank/callback" },
  ]);

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can configure payment gateways.</p>
      </div>
    );
  }

  const toggleGateway = (id: string) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, enabled: !g.enabled } : g));
    toast.success("Gateway status updated");
  };

  const toggleMode = (id: string) => {
    setGateways(prev => prev.map(g => g.id === id ? { ...g, mode: g.mode === "sandbox" ? "production" : "sandbox" } : g));
    toast.info("Mode switched");
  };

  const maskKey = (key: string) => key.length > 8 ? key.slice(0, 8) + "••••••••" : "••••••••";

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <CreditCard size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Payment Gateway Configuration</p>
          <p className="text-xs text-muted-foreground">Manage API keys, webhooks, and enable/disable payment providers.</p>
        </div>
      </div>

      {gateways.map((gw) => (
        <div key={gw.id} className={`section-card ${!gw.enabled ? "opacity-60" : ""}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <gw.icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{gw.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${gw.enabled ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                    {gw.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${gw.mode === "production" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                    {gw.mode}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleMode(gw.id)} className="text-[10px] text-primary font-medium underline">
                Switch to {gw.mode === "sandbox" ? "Production" : "Sandbox"}
              </button>
              <button onClick={() => toggleGateway(gw.id)}>
                {gw.enabled ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} className="text-muted-foreground" />}
              </button>
            </div>
          </div>

          {gw.enabled && (
            <div className="space-y-3">
              <div>
                <label className="label-text">API Key</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1 font-mono text-xs" value={showSecrets[gw.id + "_api"] ? gw.apiKey : maskKey(gw.apiKey)} readOnly />
                  <button onClick={() => setShowSecrets(prev => ({ ...prev, [gw.id + "_api"]: !prev[gw.id + "_api"] }))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-secondary transition-colors">
                    {showSecrets[gw.id + "_api"] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label-text">Secret Key</label>
                <div className="flex gap-2">
                  <input className="input-field flex-1 font-mono text-xs" value={showSecrets[gw.id + "_secret"] ? gw.secretKey : maskKey(gw.secretKey)} readOnly />
                  <button onClick={() => setShowSecrets(prev => ({ ...prev, [gw.id + "_secret"]: !prev[gw.id + "_secret"] }))} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-secondary transition-colors">
                    {showSecrets[gw.id + "_secret"] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label-text">Webhook URL</label>
                <input className="input-field font-mono text-xs" value={gw.webhookUrl} readOnly />
              </div>
              <div>
                <label className="label-text">Callback URL</label>
                <input className="input-field font-mono text-xs" value={gw.callbackUrl} readOnly />
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={() => toast.success("Gateway configuration saved")} className="btn-primary flex items-center justify-center gap-2">
        <Save size={16} /> Save All Changes
      </button>
    </div>
  );
};

export default SuperAdminPaymentGateway;
