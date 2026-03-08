import { ClipboardList, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AdminLogs = () => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="section-card">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-primary" />
          <p className="text-sm text-muted-foreground">Every admin action is recorded for accountability and audit compliance.</p>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">No activity logs yet</p>
      ) : (
        <div className="section-card p-0 divide-y divide-border">
          {logs.map((log) => (
            <div key={log.id} className="p-3">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-medium text-foreground">{log.action}</p>
                <p className="text-[10px] text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleString()}</p>
              </div>
              {log.target && <p className="text-xs text-muted-foreground mb-1">Target: {log.target}</p>}
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                {log.ip_address && <span>IP: <span className="font-mono text-foreground">{log.ip_address}</span></span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
