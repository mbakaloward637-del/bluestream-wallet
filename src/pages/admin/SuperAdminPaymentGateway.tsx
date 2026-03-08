import { useState } from "react";
import { CreditCard, Smartphone, Building2, Save, Eye, EyeOff, Shield, ToggleLeft, ToggleRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const gatewayIcons: Record<string, typeof CreditCard> = {
  paystack: CreditCard,
  mpesa: Smartphone,
  bank: Building2,
};

const SuperAdminPaymentGateway = () => {
  const { isSuperAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ["admin-payment-gateways"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_gateways").select("*").order("name");
      return data || [];
    },
  });

  const [localGateways, setLocalGateways] = useState<typeof gateways>([]);
  const displayGateways = localGateways.length > 0 ? localGateways : gateways;

  const updateGateway = (id: string, updates: Record<string, any>) => {
    const current = localGateways.length > 0 ? localGateways : gateways;
    setLocalGateways(current.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const updateGatewayConfig = (id: string, configKey: string, value: string) => {
    const current = localGateways.length > 0 ? localGateways : gateways;
    setLocalGateways(current.map(g => {
      if (g.id !== id) return g;
      const config = typeof g.config === "object" && g.config !== null ? { ...(g.config as Record<string, any>) } : {};
      config[configKey] = value;
      return { ...g, config };
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const gw of displayGateways) {
        await supabase.from("payment_gateways").update({
          is_enabled: gw.is_enabled,
          mode: gw.mode,
          config: gw.config,
          updated_by: user?.id || null,
        }).eq("id", gw.id);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-payment-gateways"] });
      setLocalGateways([]);
      toast.success("Gateway configuration saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can configure payment gateways.</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  const maskKey = (key: string) => key && key.length > 8 ? key.slice(0, 8) + "••••••••" : "••••••••";

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

      {displayGateways.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-8">No payment gateways configured yet. Add them via the database.</p>
      )}

      {displayGateways.map((gw) => {
        const Icon = gatewayIcons[gw.provider] || CreditCard;
        const config = typeof gw.config === "object" && gw.config !== null ? gw.config as Record<string, any> : {};
        return (
          <div key={gw.id} className={`section-card ${!gw.is_enabled ? "opacity-60" : ""}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{gw.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${gw.is_enabled ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                      {gw.is_enabled ? "Enabled" : "Disabled"}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${gw.mode === "production" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                      {gw.mode}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateGateway(gw.id, { mode: gw.mode === "sandbox" ? "production" : "sandbox" })} className="text-[10px] text-primary font-medium underline">
                  Switch to {gw.mode === "sandbox" ? "Production" : "Sandbox"}
                </button>
                <button onClick={() => updateGateway(gw.id, { is_enabled: !gw.is_enabled })}>
                  {gw.is_enabled ? <ToggleRight size={28} className="text-success" /> : <ToggleLeft size={28} className="text-muted-foreground" />}
                </button>
              </div>
            </div>

            {gw.is_enabled && (
              <div className="space-y-3">
                {["api_key", "secret_key", "webhook_url", "callback_url"].map((key) => (
                  <div key={key}>
                    <label className="label-text capitalize">{key.replace("_", " ")}</label>
                    <div className="flex gap-2">
                      <input className="input-field flex-1 font-mono text-xs"
                        value={showSecrets[`${gw.id}_${key}`] ? (config[key] || "") : maskKey(config[key] || "")}
                        onChange={(e) => updateGatewayConfig(gw.id, key, e.target.value)} />
                      <button onClick={() => setShowSecrets(prev => ({ ...prev, [`${gw.id}_${key}`]: !prev[`${gw.id}_${key}`] }))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-border hover:bg-secondary transition-colors">
                        {showSecrets[`${gw.id}_${key}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save All Changes
      </button>
    </div>
  );
};

export default SuperAdminPaymentGateway;
