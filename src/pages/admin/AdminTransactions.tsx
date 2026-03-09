import { useState } from "react";
import { Search, Flag, ChevronRight, Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Filter = "all" | "deposit" | "send" | "withdraw" | "exchange" | "airtime";
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All" }, { id: "deposit", label: "Deposits" }, { id: "send", label: "Transfers" },
  { id: "withdraw", label: "Withdrawals" }, { id: "airtime", label: "Airtime" }, { id: "exchange", label: "Exchange" },
];

const AdminTransactions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState("");
  const [reversing, setReversing] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["admin-transactions"],
    queryFn: async () => {
      return await api.admin.transactions({ limit: 100 });
    },
  });

  const filtered = transactions.filter((tx: any) => {
    const matchesFilter = filter === "all" || tx.type === filter;
    const matchesSearch = !search || (tx.reference || "").toLowerCase().includes(search.toLowerCase()) || (tx.description || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const selected = transactions.find((t: any) => t.id === selectedId);

  const handleReverseTransaction = async () => {
    if (!selected || !user) return;
    setReversing(true);
    try {
      const result = await api.admin.reverseTransaction(selected.id, reverseReason.trim() || "Admin reversal");
      if (!result?.success) { toast.error(result?.error || "Reversal failed"); return; }
      toast.success(`Transaction reversed! Ref: ${result.reversal_reference}`);
      setReverseDialogOpen(false);
      setReverseReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
    } catch (err: any) {
      toast.error(err.message || "Reversal failed");
    } finally {
      setReversing(false);
    }
  };

  const canReverse = selected?.type === "send" && selected?.status === "completed";

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedId(null)} className="text-sm text-primary font-medium">← Back</button>
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Transaction Details</h3>
          <div className="space-y-3">
            {[
              { label: "Reference", value: selected.reference },
              { label: "Type", value: selected.type },
              { label: "Amount", value: `${selected.currency} ${Number(selected.amount).toLocaleString()}` },
              { label: "Fee", value: `${selected.currency} ${Number(selected.fee).toFixed(2)}` },
              { label: "Status", value: selected.status },
              { label: "Method", value: selected.method || "—" },
              { label: "Date", value: new Date(selected.created_at).toLocaleString() },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">{row.label}</span>
                <span className={`font-medium capitalize ${row.label === "Status" && selected.status === "reversed" ? "text-warning" : "text-foreground"}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="section-card space-y-3">
          <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={async () => {
              try { await api.admin.flagTransaction(selected.id); queryClient.invalidateQueries({ queryKey: ["admin-transactions"] }); toast.info("Transaction flagged"); } catch { toast.error("Failed"); }
            }} className="flex items-center gap-2 rounded-xl border border-border py-2.5 px-4 text-xs font-medium text-warning hover:bg-warning/10 transition-colors">
              <Flag size={14} /> Flag for Review
            </button>
            {canReverse && (
              <button onClick={() => setReverseDialogOpen(true)} className="flex items-center gap-2 rounded-xl border border-destructive/30 py-2.5 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <RotateCcw size={14} /> Reverse Transaction
              </button>
            )}
          </div>
          {selected.status === "reversed" && (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg p-3">
              <AlertTriangle size={14} /><span>This transaction has been reversed.</span>
            </div>
          )}
        </div>
        <AlertDialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><RotateCcw size={18} className="text-destructive" />Reverse Transaction</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p>This will reverse <strong>{selected.currency} {Number(selected.amount).toLocaleString()}</strong> (Ref: {selected.reference}).</p>
                  <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                    <li>Debit receiver's wallet</li><li>Credit sender's wallet (including fee refund)</li>
                    <li>Mark original transaction as reversed</li><li>Notify both parties</li>
                  </ul>
                  <div>
                    <label className="label-text">Reason (optional)</label>
                    <input type="text" placeholder="e.g. Fraud reported, duplicate, customer request" value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} className="input-field" />
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={reversing}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReverseTransaction} disabled={reversing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {reversing ? <Loader2 size={14} className="animate-spin mr-2" /> : null}Confirm Reversal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input className="input-field pl-10" placeholder="Search by reference..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all ${filter === f.id ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} transactions</p>
      <div className="section-card p-0 divide-y divide-border">
        {filtered.map((tx: any) => (
          <button key={tx.id} onClick={() => setSelectedId(tx.id)} className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                  tx.type === "deposit" ? "bg-success/10 text-success" : tx.type === "withdraw" ? "bg-warning/10 text-warning" : "bg-secondary text-secondary-foreground"
                }`}>{tx.type}</span>
                <p className="text-xs font-medium text-foreground truncate">{tx.description || tx.reference}</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{tx.reference} • {new Date(tx.created_at).toLocaleString()}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-foreground">{tx.currency} {Number(tx.amount).toLocaleString()}</p>
              <p className={`text-[10px] font-medium capitalize ${tx.status === "completed" ? "text-success" : tx.status === "pending" ? "text-warning" : tx.status === "reversed" ? "text-warning" : "text-destructive"}`}>{tx.status}</p>
            </div>
            <ChevronRight size={14} className="text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminTransactions;
