import { useState } from "react";
import { Search, Eye, Flag, ChevronRight } from "lucide-react";
import { mockAdminTransactions, AdminTransaction } from "@/data/mockData";
import { toast } from "sonner";

type Filter = "all" | "deposit" | "send" | "withdraw" | "exchange" | "airtime";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "deposit", label: "Deposits" },
  { id: "send", label: "Transfers" },
  { id: "withdraw", label: "Withdrawals" },
  { id: "airtime", label: "Airtime" },
  { id: "exchange", label: "Exchange" },
];

const AdminTransactions = () => {
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminTransaction | null>(null);

  const filtered = mockAdminTransactions.filter((tx) => {
    const matchesFilter = filter === "all" || tx.type === filter;
    const matchesSearch = search === "" ||
      tx.sender.toLowerCase().includes(search.toLowerCase()) ||
      tx.receiver.toLowerCase().includes(search.toLowerCase()) ||
      tx.reference.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-primary font-medium">← Back to Transactions</button>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Transaction Details</h3>
          <div className="space-y-3">
            {[
              { label: "Transaction ID", value: selected.reference },
              { label: "Type", value: selected.type },
              { label: "Sender", value: `${selected.sender} (${selected.senderWallet})` },
              { label: "Receiver", value: `${selected.receiver} (${selected.receiverWallet})` },
              { label: "Amount", value: `${selected.currency} ${selected.amount.toLocaleString()}` },
              { label: "Method", value: selected.method || "-" },
              { label: "Provider", value: selected.provider || "-" },
              { label: "Status", value: selected.status },
              { label: "Date", value: selected.date },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium text-foreground capitalize">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
          <div className="flex gap-2">
            <button
              onClick={() => toast.info("Transaction flagged for investigation")}
              className="flex items-center gap-2 rounded-xl border border-border py-2.5 px-4 text-xs font-medium text-warning hover:bg-warning/10 transition-colors"
            >
              <Flag size={14} /> Flag for Review
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Admins cannot modify completed financial transactions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          className="input-field pl-10"
          placeholder="Search by sender, receiver, or reference..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
              filter === f.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} transactions</p>

      {/* Transaction List */}
      <div className="section-card p-0 divide-y divide-border">
        {filtered.map((tx) => (
          <button
            key={tx.id}
            onClick={() => setSelected(tx)}
            className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  tx.type === "deposit" ? "bg-success/10 text-success" :
                  tx.type === "withdraw" ? "bg-warning/10 text-warning" :
                  tx.type === "airtime" ? "bg-primary/10 text-primary" :
                  "bg-secondary text-secondary-foreground"
                }`}>{tx.type}</span>
                <p className="text-xs font-medium text-foreground truncate">{tx.sender} → {tx.receiver}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{tx.reference} • {tx.date}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-foreground">{tx.currency} {tx.amount.toLocaleString()}</p>
              <p className={`text-[10px] font-medium capitalize ${
                tx.status === "completed" ? "text-success" : tx.status === "pending" ? "text-warning" : "text-destructive"
              }`}>{tx.status}</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminTransactions;
