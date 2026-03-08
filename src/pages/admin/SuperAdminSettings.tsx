import { useState } from "react";
import { Settings, Save, Globe, Palette, Smartphone, Shield } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const SuperAdminSettings = () => {
  const { isSuperAdmin } = useAuth();
  const [settings, setSettings] = useState({
    platformName: "AbanRemit",
    defaultCurrency: "KES",
    timezone: "Africa/Nairobi",
    language: "English",
    maintenanceMode: false,
    maintenanceMessage: "System is under maintenance. Please try again later.",
    appName: "AbanRemit",
    appDescription: "Secure Digital Wallet & Remittance",
    offlineBehavior: "cache_first",
  });

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can modify system settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Settings size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">System Settings</p>
          <p className="text-xs text-muted-foreground">Configure platform identity, localization, and PWA behavior.</p>
        </div>
      </div>

      {/* Platform Identity */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Palette size={14} className="text-primary" /> Platform Identity</h3>
        <div className="space-y-4">
          <div>
            <label className="label-text">Platform Name</label>
            <input className="input-field" value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">Logo</label>
              <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors cursor-pointer">
                <p className="text-[10px] text-muted-foreground">Click to upload</p>
              </div>
            </div>
            <div>
              <label className="label-text">Favicon</label>
              <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors cursor-pointer">
                <p className="text-[10px] text-muted-foreground">Click to upload</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Localization */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Globe size={14} className="text-primary" /> Localization</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label-text">Default Currency</label>
            <select className="input-field" value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}>
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="EUR">EUR - Euro</option>
              <option value="UGX">UGX - Ugandan Shilling</option>
              <option value="TZS">TZS - Tanzanian Shilling</option>
            </select>
          </div>
          <div>
            <label className="label-text">Timezone</label>
            <select className="input-field" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}>
              <option value="Africa/Nairobi">Africa/Nairobi (EAT)</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
          <div>
            <label className="label-text">Language</label>
            <select className="input-field" value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })}>
              <option value="English">English</option>
              <option value="Swahili">Swahili</option>
              <option value="French">French</option>
            </select>
          </div>
        </div>
      </div>

      {/* PWA Configuration */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Smartphone size={14} className="text-primary" /> PWA Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="label-text">App Name</label>
            <input className="input-field" value={settings.appName} onChange={(e) => setSettings({ ...settings, appName: e.target.value })} />
          </div>
          <div>
            <label className="label-text">App Description</label>
            <input className="input-field" value={settings.appDescription} onChange={(e) => setSettings({ ...settings, appDescription: e.target.value })} />
          </div>
          <div>
            <label className="label-text">Offline Behavior</label>
            <select className="input-field" value={settings.offlineBehavior} onChange={(e) => setSettings({ ...settings, offlineBehavior: e.target.value })}>
              <option value="cache_first">Cache First</option>
              <option value="network_first">Network First</option>
              <option value="offline_page">Show Offline Page</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text">App Icon</label>
              <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors cursor-pointer">
                <p className="text-[10px] text-muted-foreground">512x512 PNG</p>
              </div>
            </div>
            <div>
              <label className="label-text">Splash Screen</label>
              <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-border hover:border-primary/30 transition-colors cursor-pointer">
                <p className="text-[10px] text-muted-foreground">Upload image</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Shield size={14} className="text-destructive" /> Maintenance Mode</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Enable Maintenance Mode</p>
              <p className="text-xs text-muted-foreground">Users and admins will be blocked from accessing the platform.</p>
            </div>
            <button onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenanceMode ? "bg-destructive" : "bg-muted"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.maintenanceMode ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          {settings.maintenanceMode && (
            <div>
              <label className="label-text">Maintenance Message</label>
              <textarea className="input-field min-h-[80px] resize-none" value={settings.maintenanceMessage} onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })} />
            </div>
          )}
        </div>
      </div>

      <button onClick={() => toast.success("System settings saved")} className="btn-primary flex items-center justify-center gap-2">
        <Save size={16} /> Save Settings
      </button>
    </div>
  );
};

export default SuperAdminSettings;
