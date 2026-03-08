import { mockActivityLogs } from "@/data/mockData";
import { ClipboardList } from "lucide-react";

const AdminLogs = () => {
  return (
    <div className="space-y-4">
      <div className="section-card">
        <div className="flex items-center gap-2">
          <ClipboardList size={16} className="text-primary" />
          <p className="text-sm text-muted-foreground">Every admin action is recorded for accountability and audit compliance.</p>
        </div>
      </div>

      <div className="section-card p-0 divide-y divide-border">
        {mockActivityLogs.map((log) => (
          <div key={log.id} className="p-3">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-medium text-foreground">{log.action}</p>
              <p className="text-[10px] text-muted-foreground shrink-0">{log.timestamp}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Target: {log.target}</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Admin: <span className="font-medium text-foreground">{log.adminName}</span></span>
              <span>IP: <span className="font-mono text-foreground">{log.ipAddress}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminLogs;
