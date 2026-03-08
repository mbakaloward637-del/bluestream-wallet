import { useState } from "react";
import { ClipboardList, Shield, Search, Download } from "lucide-react";
import { mockActivityLogs } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AuditLog {
  id: string;
  actorType: "admin" | "user" | "system";
  actorName: string;
  actorId: string;
  category: "admin" | "user" | "financial" | "security";
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
  device: string;
}

const auditLogs: AuditLog[] = [
  { id: "al1", actorType: "admin", actorName: "Sarah Ochieng", actorId: "u2", category: "admin", action: "Approved KYC verification", target: "Alice Wanjiku (WLT8880002001)", timestamp: "Today, 1:30 PM", ipAddress: "192.168.1.45", device: "Chrome / Windows" },
  { id: "al2", actorType: "admin", actorName: "Sarah Ochieng", actorId: "u2", category: "admin", action: "Rejected KYC verification", target: "Clara Adesanya (WLT8880002003)", timestamp: "Today, 11:00 AM", ipAddress: "192.168.1.45", device: "Chrome / Windows" },
  { id: "al3", actorType: "user", actorName: "Alice Wanjiku", actorId: "p1", category: "financial", action: "Deposited KES 5,000 via M-Pesa", target: "WLT8880002001", timestamp: "Today, 2:30 PM", ipAddress: "41.89.100.23", device: "Safari / iPhone" },
  { id: "al4", actorType: "admin", actorName: "David Kimani", actorId: "u3", category: "security", action: "Froze user account", target: "Clara Adesanya (WLT8880002003)", timestamp: "Mar 5, 2:00 PM", ipAddress: "10.0.0.12", device: "Firefox / macOS" },
  { id: "al5", actorType: "system", actorName: "System", actorId: "sys", category: "security", action: "Blocked login after 5 failed attempts", target: "Clara Adesanya (WLT8880002003)", timestamp: "Mar 5, 1:55 PM", ipAddress: "41.89.100.23", device: "Chrome / Android" },
  { id: "al6", actorType: "user", actorName: "James Mwangi", actorId: "u1", category: "financial", action: "Sent KES 1,200 to wallet", target: "Sarah Ochieng (WLT8880001045)", timestamp: "Today, 11:15 AM", ipAddress: "197.232.10.50", device: "Chrome / Android" },
  { id: "al7", actorType: "admin", actorName: "Sarah Ochieng", actorId: "u2", category: "admin", action: "Approved withdrawal request", target: "Alice Wanjiku - KES 3,000", timestamp: "Mar 5, 5:30 PM", ipAddress: "192.168.1.45", device: "Chrome / Windows" },
  { id: "al8", actorType: "system", actorName: "System", actorId: "sys", category: "financial", action: "Exchange rate auto-updated", target: "USD/KES: 128.90 → 129.50", timestamp: "Today, 9:00 AM", ipAddress: "-", device: "System" },
  { id: "al9", actorType: "admin", actorName: "David Kimani", actorId: "u3", category: "security", action: "Suspended user account", target: "Grace Achieng (WLT8880002007)", timestamp: "Mar 4, 10:00 AM", ipAddress: "10.0.0.12", device: "Firefox / macOS" },
  { id: "al10", actorType: "user", actorName: "Grace Achieng", actorId: "p7", category: "financial", action: "Requested withdrawal of KES 15,000", target: "WLT8880002007 → M-Pesa", timestamp: "Yesterday, 2:00 PM", ipAddress: "41.89.55.10", device: "Safari / iPhone" },
];

const categoryColors = {
  admin: "bg-primary/10 text-primary",
  user: "bg-success/10 text-success",
  financial: "bg-warning/10 text-warning",
  security: "bg-destructive/10 text-destructive",
};

const SuperAdminAuditLogs = () => {
  const { isSuperAdmin } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | AuditLog["category"]>("all");

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can access full audit logs.</p>
      </div>
    );
  }

  const filtered = auditLogs.filter(log => {
    const matchesSearch = search === "" || log.action.toLowerCase().includes(search.toLowerCase()) || log.actorName.toLowerCase().includes(search.toLowerCase()) || log.target.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || log.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      <div className="section-card flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <ClipboardList size={18} className="text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Full Audit Trail</p>
          <p className="text-xs text-muted-foreground">Every action by admins, users, and the system is logged permanently and cannot be deleted.</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-field pl-10" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button onClick={() => toast.success("Audit log exported as CSV")} className="flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
          <Download size={14} /> Export CSV
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {(["all", "admin", "user", "financial", "security"] as const).map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all ${categoryFilter === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>
            {c === "all" ? "All" : c}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} log entries</p>

      {/* Log Entries */}
      <div className="section-card p-0 divide-y divide-border">
        {filtered.map((log) => (
          <div key={log.id} className="p-3">
            <div className="flex items-start justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${categoryColors[log.category]}`}>{log.category}</span>
                <p className="text-sm font-medium text-foreground">{log.action}</p>
              </div>
              <p className="text-[10px] text-muted-foreground shrink-0 ml-2">{log.timestamp}</p>
            </div>
            <p className="text-xs text-muted-foreground mb-1">Target: {log.target}</p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
              <span>Actor: <span className="font-medium text-foreground">{log.actorName}</span> <span className={`text-[8px] uppercase px-1 py-0.5 rounded ${log.actorType === "admin" ? "bg-primary/10 text-primary" : log.actorType === "system" ? "bg-secondary text-secondary-foreground" : "bg-success/10 text-success"}`}>{log.actorType}</span></span>
              <span>IP: <span className="font-mono text-foreground">{log.ipAddress}</span></span>
              <span>Device: <span className="text-foreground">{log.device}</span></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminAuditLogs;
