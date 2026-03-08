import { useState } from "react";
import { ArrowLeft, Filter, X, Download, Share2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TransactionItem from "@/components/TransactionItem";
import type { Transaction } from "@/components/TransactionItem";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Transactions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["all-transactions", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .or(`sender_user_id.eq.${user!.id},receiver_user_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map((tx): Transaction => ({
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

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="back-btn">
              <ArrowLeft size={18} className="text-foreground" />
            </button>
            <h1 className="text-lg font-bold text-foreground">Transactions</h1>
          </div>
          <button className="back-btn">
            <Filter size={18} className="text-muted-foreground" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No transactions yet</p>
        ) : (
          <div className="section-card p-0 divide-y divide-border">
            {transactions.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} onClick={() => setSelectedTx(tx)} />
            ))}
          </div>
        )}
      </div>

      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-foreground/20 flex items-end justify-center">
          <div className="w-full max-w-md bg-card rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Transaction Receipt</h2>
              <button onClick={() => setSelectedTx(null)} className="back-btn h-8 w-8">
                <X size={16} className="text-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Reference", value: selectedTx.reference || selectedTx.id },
                { label: "Type", value: selectedTx.type },
                { label: "Description", value: selectedTx.description },
                { label: "Amount", value: `${selectedTx.currency} ${selectedTx.amount.toFixed(2)}` },
                { label: "Date", value: selectedTx.date },
                { label: "Status", value: selectedTx.status },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-foreground capitalize">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                <Download size={16} /> Download
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default Transactions;
