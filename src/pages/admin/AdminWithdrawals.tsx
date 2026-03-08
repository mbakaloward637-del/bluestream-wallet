import { mockWithdrawals } from "@/data/mockData";
import { CheckCircle2, XCircle, Clock, FileSearch } from "lucide-react";
import { toast } from "sonner";

const AdminWithdrawals = () => {
  const pending = mockWithdrawals.filter(w => w.status === "pending");

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: pending.length, color: "bg-warning/10 text-warning" },
          { label: "Approved", value: mockWithdrawals.filter(w => w.status === "approved").length, color: "bg-success/10 text-success" },
          { label: "Rejected", value: mockWithdrawals.filter(w => w.status === "rejected").length, color: "bg-destructive/10 text-destructive" },
          { label: "Total Volume", value: `KES ${mockWithdrawals.reduce((s, w) => s + w.amount, 0).toLocaleString()}`, color: "bg-primary/10 text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <p className={`text-xl font-bold ${stat.color.split(" ")[1]}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock size={14} className="text-warning" /> Pending Requests
          </h3>
          <div className="space-y-3">
            {pending.map((w) => (
              <div key={w.id} className="section-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{w.userName}</p>
                    <p className="text-xs text-muted-foreground">{w.walletNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{w.currency} {w.amount.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">{w.requestDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Method: </span>
                    <span className="font-medium text-foreground capitalize">{w.method}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">To: </span>
                    <span className="font-medium text-foreground">{w.destination}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toast.success(`Withdrawal approved for ${w.userName}. Payout processing. SMS sent.`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-xs font-semibold text-success-foreground hover:bg-success/90 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => toast.error(`Withdrawal rejected for ${w.userName}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    onClick={() => toast.info("Verification requested")}
                    className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    <FileSearch size={14} /> Verify
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Withdrawals */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">All Withdrawal Requests</h3>
        <div className="section-card p-0 divide-y divide-border">
          {mockWithdrawals.map((w) => (
            <div key={w.id} className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{w.userName}</p>
                <p className="text-[10px] text-muted-foreground">{w.walletNumber} • {w.method} • {w.requestDate}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-semibold text-foreground">{w.currency} {w.amount.toLocaleString()}</p>
                <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-md ${
                  w.status === "pending" ? "bg-warning/10 text-warning" :
                  w.status === "approved" ? "bg-success/10 text-success" :
                  w.status === "rejected" ? "bg-destructive/10 text-destructive" :
                  "bg-primary/10 text-primary"
                }`}>{w.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminWithdrawals;
