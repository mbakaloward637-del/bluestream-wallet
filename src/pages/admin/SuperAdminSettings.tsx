import { useState, useEffect } from "react";
import { Settings, Save, Globe, Palette, Smartphone, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const CONFIG_KEY = "system_settings";
const defaultSettings = {
  platformName: "AbanRemit", defaultCurrency: "KES", timezone: "Africa/Nairobi", language: "English",
  maintenanceMode: false, maintenanceMessage: "System is under maintenance. Please try again later.",
  appName: "AbanRemit", appDescription: "Secure Digital Wallet & Remittance", offlineBehavior: "cache_first",
};

const SuperAdminSettings = () => {
  const { isSuperAdmin, user } = useAuth();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(defaultSettings);

  const { data: dbConfig, isLoading } = useQuery({
    queryKey: ["platform-config", CONFIG_KEY],
    queryFn: async () => { return await api.admin.platformConfig.get(CONFIG_KEY); },
  });

  useEffect(() => {
    if (dbConfig?.value && typeof dbConfig.value === "object") {
      setSettings({ ...defaultSettings, ...(dbConfig.value as any) });
    }
  }, [dbConfig]);

  if (!isSuperAdmin) {
    return (<div className="section-card text-center py-12"><Shield size={48} className="mx-auto text-destructive mb-4" /><h2 className="text-lg font-bold text-foreground">Access Denied</h2></div>);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.admin.platformConfig.update(CONFIG_KEY, settings);
      queryClient.invalidateQueries({ queryKey: ["platform-config", CONFIG_KEY] });
      toast.success("System settings saved successfully");
    } catch (err: any) { toast.error(err.message || "Failed to save"); } finally { setSaving(false); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0"><Settings size={18} className="text-primary" /></div>
        <div><p className="text-sm font-semibold text-foreground">System Settings</p><p className="text-xs text-muted-foreground">Configure platform identity, localization, and PWA behavior.</p></div>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Palette size={14} className="text-primary" /> Platform Identity</h3>
        <div><label className="label-text">Platform Name</label><input className="input-field" value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} /></div>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Globe size={14} className="text-primary" /> Localization</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label-text">Default Currency</label><select className="input-field" value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}><option value="KES">KES</option><option value="USD">USD</option><option value="GBP">GBP</option><option value="EUR">EUR</option></select></div>
          <div><label className="label-text">Timezone</label><select className="input-field" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}><option value="Africa/Nairobi">Africa/Nairobi</option><option value="UTC">UTC</option></select></div>
          <div><label className="label-text">Language</label><select className="input-field" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}><option value="English">English</option><option value="Swahili">Swahili</option></select></div>
        </div>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Smartphone size={14} className="text-primary" /> PWA Configuration</h3>
        <div className="space-y-4">
          <div><label className="label-text">App Name</label><input className="input-field" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} /></div>
          <div><label className="label-text">App Description</label><input className="input-field" value={settings.appDescription} onChange={(e) => setSettings({ ...settings, appDescription: e.target.value })} /></div>
        </div>
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Shield size={14} className="text-destructive" /> Maintenance Mode</h3>
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-medium text-foreground">Enable Maintenance Mode</p><p className="text-xs text-muted-foreground">Users will be blocked from accessing the platform.</p></div>
          <button onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenanceMode ? "bg-destructive" : "bg-muted"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${settings.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>
        {settings.maintenanceMode && (
          <div className="mt-4"><label className="label-text">Maintenance Message</label><textarea className="input-field min-h-[80px] resize-none" value={settings.maintenanceMessage} onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })} /></div>
        )}
      </div>

      <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center justify-center gap-2">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Settings
      </button>
    </div>
  );
};

export default SuperAdminSettings;
