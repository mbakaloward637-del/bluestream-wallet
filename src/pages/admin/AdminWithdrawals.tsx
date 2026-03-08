import { CheckCircle2, XCircle, Clock, FileSearch, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminWithdrawals = () => {
  const queryClient = useQueryClient();

  const { data: withdrawals = [], isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*, profiles:user_id(first_name, last_name, email), wallets:wallet_id(wallet_number, currency)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const pending = withdrawals.filter((w: any) => w.status === "pending");

  const handleAction = async (id: string, status: "approved" | "rejected", userName: string, walletId: string, amount: number) => {
    const { error } = await supabase.from("withdrawal_requests").update({
      status,
      reviewed_at: new Date().toISOString(),
    }).eq("id", id);

    if (error) { toast.error(error.message); return; }

    // If rejected, refund balance
    if (status === "rejected") {
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("id", walletId).single();
      if (wallet) {
        await supabase.from("wallets").update({ balance: Number(wallet.balance) + amount }).eq("id", walletId);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
    if (status === "approved") toast.success(`Withdrawal approved for ${userName}`);
    else toast.error(`Withdrawal rejected for ${userName}. Funds refunded.`);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: withdrawals.filter((w: any) => w.status === "pending").length, color: "text-warning" },
          { label: "Approved", value: withdrawals.filter((w: any) => w.status === "approved").length, color: "text-success" },
          { label: "Rejected", value: withdrawals.filter((w: any) => w.status === "rejected").length, color: "text-destructive" },
          { label: "Total Volume", value: `KES ${withdrawals.reduce((s: number, w: any) => s + Number(w.amount), 0).toLocaleString()}`, color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={14} className="text-warning" /> Pending Requests
          </h3>
          <div className="space-y-3">
            {pending.map((w: any) => {
              const name = w.profiles ? `${w.profiles.first_name} ${w.profiles.last_name}` : "Unknown";
              const walletNum = w.wallets?.wallet_number || "";
              return (
                <div key={w.id} className="section-card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{name}</p>
                      <p className="text-xs text-muted-foreground">{walletNum}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{w.currency} {Number(w.amount).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div><span className="text-muted-foreground">Method: </span><span className="font-medium text-foreground capitalize">{w.method}</span></div>
                    <div><span className="text-muted-foreground">To: </span><span className="font-medium text-foreground">{w.destination}</span></div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(w.id, "approved", name, w.wallet_id, Number(w.amount))}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-xs font-semibold text-success-foreground hover:bg-success/90 transition-colors">
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button onClick={() => handleAction(w.id, "rejected", name, w.wallet_id, Number(w.amount))}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">All Withdrawal Requests</h3>
        <div className="section-card p-0 divide-y divide-border">
          {withdrawals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No withdrawal requests yet</p>
          ) : withdrawals.map((w: any) => {
            const name = w.profiles ? `${w.profiles.first_name} ${w.profiles.last_name}` : "Unknown";
            return (
              <div key={w.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{name}</p>
                  <p className="text-[10px] text-muted-foreground">{w.method} • {w.destination} • {new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-foreground">{w.currency} {Number(w.amount).toLocaleString()}</p>
                  <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-md ${
                    w.status === "pending" ? "bg-warning/10 text-warning" :
                    w.status === "approved" ? "bg-success/10 text-success" :
                    w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                    "bg-primary/10 text-primary"
                  }`}>{w.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
