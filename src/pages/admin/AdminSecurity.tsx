import { ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const severityColors: Record<string, string> = {
  low: "bg-primary/10 text-primary",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

const typeLabels: Record<string, string> = {
  failed_login: "Failed Login",
  failed_pin: "Failed PIN",
  suspicious_transaction: "Suspicious Transaction",
  unusual_pattern: "Unusual Pattern",
};

const AdminSecurity = () => {
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["admin-security-alerts"],
    queryFn: async () => {
      return await api.admin.securityAlerts();
    },
  });

  const activeAlerts = alerts.filter((a: any) => !a.resolved);

  const handleResolve = async (id: string) => {
    try {
      await api.admin.resolveAlert(id);
      queryClient.invalidateQueries({ queryKey: ["admin-security-alerts"] });
      toast.success("Alert resolved");
    } catch { toast.error("Failed"); }
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Active Alerts", value: activeAlerts.length, color: "text-destructive" },
          { label: "Critical", value: activeAlerts.filter((a: any) => a.severity === "critical").length, color: "text-destructive" },
          { label: "High", value: activeAlerts.filter((a: any) => a.severity === "high").length, color: "text-warning" },
          { label: "Resolved", value: alerts.filter((a: any) => a.resolved).length, color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ShieldAlert size={14} className="text-destructive" /> Security Alerts
        </h3>
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No security alerts</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert: any) => {
              const userName = alert.user_name || "System";
              return (
                <div key={alert.id} className={`section-card ${alert.resolved ? "opacity-60" : ""}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${severityColors[alert.severity] || ""}`}>{alert.severity}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{typeLabels[alert.type] || alert.type}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-xs text-foreground mb-1">{alert.description}</p>
                  <p className="text-[10px] text-muted-foreground mb-2">User: {userName}</p>
                  {!alert.resolved ? (
                    <button onClick={() => handleResolve(alert.id)}
                      className="flex items-center gap-1.5 rounded-lg border border-border py-1.5 px-3 text-[10px] font-medium text-success hover:bg-success/10 transition-colors">
                      <CheckCircle2 size={12} /> Resolve
                    </button>
                  ) : (
                    <p className="text-[10px] text-success font-medium">✓ Resolved</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSecurity;
