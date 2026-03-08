import { mockSecurityAlerts, mockActivityLogs } from "@/data/mockData";
import { ShieldAlert, AlertTriangle, Eye, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const severityColors = {
  low: "bg-primary/10 text-primary",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

const typeLabels = {
  failed_login: "Failed Login",
  failed_pin: "Failed PIN",
  suspicious_transaction: "Suspicious Transaction",
  unusual_pattern: "Unusual Pattern",
};

const AdminSecurity = () => {
  const activeAlerts = mockSecurityAlerts.filter(a => !a.resolved);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Alerts", value: activeAlerts.length, color: "text-destructive" },
          { label: "Critical", value: activeAlerts.filter(a => a.severity === "critical").length, color: "text-destructive" },
          { label: "High", value: activeAlerts.filter(a => a.severity === "high").length, color: "text-warning" },
          { label: "Resolved Today", value: mockSecurityAlerts.filter(a => a.resolved).length, color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Security Alerts */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ShieldAlert size={14} className="text-destructive" /> Security Alerts
        </h3>
        <div className="space-y-2">
          {mockSecurityAlerts.map((alert) => (
            <div key={alert.id} className={`section-card ${alert.resolved ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                    {typeLabels[alert.type]}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{alert.timestamp}</p>
              </div>
              <p className="text-xs text-foreground mb-1">{alert.description}</p>
              <p className="text-[10px] text-muted-foreground mb-2">User: {alert.user} ({alert.walletNumber})</p>
              {!alert.resolved && (
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.info(`Investigating ${alert.user}'s account`)}
                    className="flex items-center gap-1.5 rounded-lg border border-border py-1.5 px-3 text-[10px] font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Eye size={12} /> Investigate
                  </button>
                  <button
                    onClick={() => toast.success("Alert resolved")}
                    className="flex items-center gap-1.5 rounded-lg border border-border py-1.5 px-3 text-[10px] font-medium text-success hover:bg-success/10 transition-colors"
                  >
                    <CheckCircle2 size={12} /> Resolve
                  </button>
                  <button
                    onClick={() => toast.warning("Account flagged")}
                    className="flex items-center gap-1.5 rounded-lg border border-border py-1.5 px-3 text-[10px] font-medium text-warning hover:bg-warning/10 transition-colors"
                  >
                    <AlertTriangle size={12} /> Flag Account
                  </button>
                </div>
              )}
              {alert.resolved && (
                <p className="text-[10px] text-success font-medium">✓ Resolved</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSecurity;
