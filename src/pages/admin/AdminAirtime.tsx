import { Smartphone, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AdminAirtime = () => {
  const { data: airtimeTxs = [], isLoading } = useQuery({
    queryKey: ["admin-airtime"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*, profiles:sender_user_id(first_name, last_name)")
        .eq("type", "airtime")
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  // Build network stats from provider field
  const networkMap: Record<string, { count: number; volume: number }> = {};
  airtimeTxs.forEach((tx: any) => {
    const provider = tx.provider || "Unknown";
    if (!networkMap[provider]) networkMap[provider] = { count: 0, volume: 0 };
    networkMap[provider].count++;
    networkMap[provider].volume += Number(tx.amount);
  });

  const networkColors: Record<string, string> = {
    safaricom: "bg-success/10 text-success",
    airtel: "bg-destructive/10 text-destructive",
    telkom: "bg-primary/10 text-primary",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(networkMap).map(([name, stats]) => (
          <div key={name} className="section-card text-center">
            <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${networkColors[name] || "bg-secondary text-foreground"}`}>
              <Smartphone size={18} />
            </div>
            <p className="text-sm font-bold text-foreground capitalize">{name}</p>
            <p className="text-xs text-muted-foreground">{stats.count} purchases</p>
            <p className="text-xs font-semibold text-foreground mt-1">KES {stats.volume.toLocaleString()}</p>
          </div>
        ))}
        {Object.keys(networkMap).length === 0 && (
          <div className="col-span-3 section-card text-center py-8">
            <p className="text-xs text-muted-foreground">No airtime purchases yet</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Airtime Purchases</h3>
        <div className="section-card p-0 divide-y divide-border">
          {airtimeTxs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No airtime transactions yet</p>
          ) : airtimeTxs.map((tx: any) => {
            const senderName = tx.profiles ? `${tx.profiles.first_name} ${tx.profiles.last_name}` : "Unknown";
            return (
              <div key={tx.id} className="flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{senderName}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.description} • {new Date(tx.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-sm font-semibold text-foreground">{tx.currency} {Number(tx.amount).toLocaleString()}</p>
                  <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-md ${
                    tx.status === "completed" ? "bg-success/10 text-success" : tx.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                  }`}>{tx.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminAirtime;
