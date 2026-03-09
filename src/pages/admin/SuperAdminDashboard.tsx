import { Users, Wallet, TrendingUp, TrendingDown, Clock, UserCheck, DollarSign, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";

const SuperAdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["superadmin-stats"],
    queryFn: async () => {
      return await api.admin.dashboard();
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, bg: "bg-primary/10", color: "text-primary" },
    { label: "Active Wallets", value: stats?.activeWallets || 0, icon: Wallet, bg: "bg-success/10", color: "text-success" },
    { label: "Total Balance", value: `KES ${(stats?.totalBalance || 0).toLocaleString()}`, icon: DollarSign, bg: "bg-primary/10", color: "text-primary" },
    { label: "Total Deposits", value: `KES ${(stats?.totalDeposits || 0).toLocaleString()}`, icon: TrendingUp, bg: "bg-success/10", color: "text-success" },
    { label: "Total Withdrawals", value: `KES ${(stats?.totalWithdrawals || 0).toLocaleString()}`, icon: TrendingDown, bg: "bg-warning/10", color: "text-warning" },
    { label: "Platform Revenue", value: `KES ${(stats?.totalFees || 0).toLocaleString()}`, icon: DollarSign, bg: "bg-success/10", color: "text-success" },
    { label: "Pending Transactions", value: stats?.pendingTxs || 0, icon: Clock, bg: "bg-warning/10", color: "text-warning" },
    { label: "Pending KYC", value: stats?.pendingKyc || 0, icon: UserCheck, bg: "bg-primary/10", color: "text-primary" },
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
          <h3 className="text-sm font-semibold text-foreground mb-4">Transaction Volume by Day</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats?.dailyData || []}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]} />
              <Bar dataKey="deposits" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} name="Deposits" />
              <Bar dataKey="withdrawals" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} name="Withdrawals" />
              <Bar dataKey="transfers" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Transfers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Deposits vs Withdrawals</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={stats?.dailyData || []}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]} />
              <Area type="monotone" dataKey="deposits" stroke="hsl(var(--success))" fill="hsl(var(--success) / 0.15)" name="Deposits" />
              <Area type="monotone" dataKey="withdrawals" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.1)" name="Withdrawals" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Latest Transactions</h3>
          {(stats?.recentTxs || stats?.recentTransactions || []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
          ) : (
            <div className="space-y-0">
              {(stats?.recentTxs || stats?.recentTransactions || []).map((tx: any) => (
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
          {(stats?.recentLogs || []).length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No activity logs yet</p>
          ) : (
            <div className="space-y-0">
              {(stats?.recentLogs || []).map((log: any) => (
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
