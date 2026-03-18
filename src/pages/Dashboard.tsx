import WalletCard from "@/components/WalletCard";
import QuickActions from "@/components/QuickActions";
import TransactionItem from "@/components/TransactionItem";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { Bell, Shield, LogOut, Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { api } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/components/TransactionItem";

const Dashboard = () => {
  const { user, isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [user, loading, navigate]);

  const { data: transactions = [] } = useQuery({
    queryKey: ["recent-transactions", user?.id],
    enabled: !!user,
    refetchInterval: 15000,
    queryFn: async () => {
      const res = await api.transactions.list({ limit: 4 });
      return (res.data || []).map((tx: any): Transaction => ({
        id: tx.id,
        type: tx.type as Transaction["type"],
        amount: Number(tx.amount),
        currency: tx.currency,
        description: tx.description || "",
        date: new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
        status: tx.status as Transaction["status"],
        reference: tx.reference,
      }));
    },
  });

  if (loading || !user) {
    return (
      <div className="page-container flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/profile")} className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {user.avatarInitials}
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Good morning</p>
            <h1 className="text-base font-bold text-foreground">{user.firstName} {user.lastName}</h1>
            {user.role !== "user" && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                <Shield size={10} /> {user.role}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <button onClick={() => navigate("/admin/login")} className="back-btn">
              <Shield size={18} className="text-primary" />
            </button>
          )}
          <button onClick={() => navigate("/notifications")} className="back-btn">
            <Bell size={18} className="text-muted-foreground" />
          </button>
          <button onClick={async () => { await logout(); navigate("/login"); }} className="back-btn">
            <LogOut size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="px-5 space-y-6">
        {user.kycStatus === "pending" && (
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">KYC Verification Pending</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Your documents are being reviewed. Some features may be limited until verification is complete.</p>
            </div>
          </div>
        )}
        {user.kycStatus === "rejected" && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
            <AlertTriangle size={18} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">KYC Verification Rejected</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Please update your documents in your profile to re-submit for verification.</p>
            </div>
          </div>
        )}

        <WalletCard
          balance={user.walletBalance}
          currency={user.currency}
          walletNumber={user.walletNumber}
          userName={`${user.firstName} ${user.lastName}`}
          kycStatus={user.kycStatus}
        />

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Quick Actions</h2>
          <QuickActions />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Recent Transactions</h2>
            <button onClick={() => navigate("/transactions")} className="text-xs font-semibold text-primary">See All</button>
          </div>
          <div className="section-card p-0 divide-y divide-border">
            {transactions.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <TransactionItem key={tx.id} tx={tx} onClick={() => navigate(`/transactions?ref=${tx.id}`)} />
              ))
            )}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
