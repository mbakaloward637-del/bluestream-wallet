import { Users, Wallet, TrendingUp, TrendingDown, Clock, UserCheck, ArrowLeftRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, wallets, transactions, pendingKyc, pendingWithdrawals] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("wallets").select("balance"),
        supabase.from("transactions").select("id, type, amount, status, created_at").order("created_at", { ascending: false }).limit(10),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("kyc_status", "pending"),
        supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);

      const totalBalance = (wallets.data || []).reduce((s, w) => s + Number(w.balance), 0);

      return {
        totalUsers: profiles.count || 0,
        activeWallets: wallets.data?.length || 0,
        totalBalance,
        pendingKyc: pendingKyc.count || 0,
        pendingWithdrawals: pendingWithdrawals.count || 0,
        recentTransactions: transactions.data || [],
      };
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, bg: "bg-primary/10", color: "text-primary" },
    { label: "Active Wallets", value: stats?.activeWallets || 0, icon: Wallet, bg: "bg-success/10", color: "text-success" },
    { label: "Total Balance", value: `KES ${(stats?.totalBalance || 0).toLocaleString()}`, icon: TrendingUp, bg: "bg-success/10", color: "text-success" },
    { label: "Pending KYC", value: stats?.pendingKyc || 0, icon: UserCheck, bg: "bg-warning/10", color: "text-warning" },
    { label: "Pending Withdrawals", value: stats?.pendingWithdrawals || 0, icon: Clock, bg: "bg-warning/10", color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {statCards.map((stat) => (
          <div key={stat.label} className="section-card">
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-3">Latest Transactions</h3>
        {(stats?.recentTransactions || []).length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No transactions yet</p>
        ) : (
          <div className="space-y-0">
            {(stats?.recentTransactions || []).map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate capitalize">{tx.type}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs font-semibold text-foreground">KES {Number(tx.amount).toLocaleString()}</p>
                  <p className={`text-[10px] font-medium capitalize ${tx.status === "completed" ? "text-success" : tx.status === "pending" ? "text-warning" : "text-destructive"}`}>{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
