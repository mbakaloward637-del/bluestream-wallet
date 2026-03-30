import { Users, Wallet, TrendingUp, TrendingDown, Clock, UserCheck, DollarSign, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

const SuperAdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: () => api.admin.dashboard(),
  });

  const { data: recentTxs = [] } = useQuery({
    queryKey: ["superadmin-recent-txs"],
    queryFn: () => api.admin.transactions({ limit: 10 }),
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["superadmin-recent-logs"],
    queryFn: () => api.admin.activityLogs(),
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  const statCards = [
    { label: "Total Users", value: stats?.total_users || 0, icon: Users, bg: "bg-primary/10", color: "text-primary" },
    { label: "Total Transactions", value: stats?.total_transactions || 0, icon: Wallet, bg: "bg-success/10", color: "text-success" },
    { label: "Total Balance", value: `KES ${(stats?.total_balance || 0).toLocaleString()}`, icon: DollarSign, bg: "bg-primary/10", color: "text-primary" },
    { label: "Pending Withdrawals", value: stats?.pending_withdrawals || 0, icon: Clock, bg: "bg-warning/10", color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="section-card">
            <div className="flex items-center justify-between mb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Latest Transactions</h3>
          {recentTxs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-0">
              {recentTxs.slice(0, 10).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground capitalize">{tx.type}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs font-semibold text-foreground">{tx.currency} {Number(tx.amount).toLocaleString()}</p>
                    <p className={`text-[10px] font-medium capitalize ${tx.status === "completed" ? "text-success" : tx.status === "pending" ? "text-warning" : "text-destructive"}`}>{tx.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Admin Activity Log</h3>
          {recentLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No activity logs yet</p>
          ) : (
            <div className="space-y-0">
              {recentLogs.slice(0, 10).map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                  <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 bg-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground">{log.action}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}{log.ip_address ? ` • IP: ${log.ip_address}` : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
