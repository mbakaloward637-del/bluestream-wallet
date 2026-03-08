import { mockAdminTransactions } from "@/data/mockData";
import { Smartphone, AlertTriangle } from "lucide-react";

const AdminAirtime = () => {
  const airtimeTransactions = mockAdminTransactions.filter(tx => tx.type === "airtime");

  const networkStats = [
    { name: "Safaricom", count: 156, volume: "KES 45,200", color: "bg-success/10 text-success" },
    { name: "Airtel", count: 89, volume: "KES 23,100", color: "bg-destructive/10 text-destructive" },
    { name: "Telkom", count: 34, volume: "KES 8,900", color: "bg-primary/10 text-primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Network Stats */}
      <div className="grid grid-cols-3 gap-3">
        {networkStats.map((n) => (
          <div key={n.name} className="section-card text-center">
            <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${n.color.split(" ")[0]}`}>
              <Smartphone size={18} className={n.color.split(" ")[1]} />
            </div>
            <p className="text-sm font-bold text-foreground">{n.name}</p>
            <p className="text-xs text-muted-foreground">{n.count} purchases</p>
            <p className="text-xs font-semibold text-foreground mt-1">{n.volume}</p>
          </div>
        ))}
      </div>

      {/* Airtime Transactions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Airtime Purchases</h3>
        <div className="section-card p-0 divide-y divide-border">
          {airtimeTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{tx.sender}</p>
                <p className="text-[10px] text-muted-foreground">To: {tx.receiver} • {tx.provider} • {tx.date}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <p className="text-sm font-semibold text-foreground">{tx.currency} {tx.amount.toLocaleString()}</p>
                <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-md ${
                  tx.status === "completed" ? "bg-success/10 text-success" : tx.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                }`}>{tx.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Abuse Detection */}
      <div className="section-card border-warning/30">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-warning" />
          <h3 className="text-sm font-semibold text-foreground">Suspicious Activity</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Detected patterns that may indicate abuse:</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <p className="text-xs font-medium text-foreground">Multiple rapid purchases from same wallet</p>
              <p className="text-[10px] text-muted-foreground">WLT8880002006 • 8 purchases in 10 minutes</p>
            </div>
            <span className="text-[9px] font-semibold uppercase px-2 py-1 rounded-md bg-warning/10 text-warning">Monitor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAirtime;
