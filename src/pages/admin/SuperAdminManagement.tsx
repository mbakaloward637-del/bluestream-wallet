import { useState } from "react";
import { UserPlus, Shield, Trash2, Ban, Eye, ChevronRight, Edit, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: "operations" | "compliance" | "support" | "finance";
  status: "active" | "suspended";
  lastLogin: string;
  createdAt: string;
  permissions: string[];
}

const mockAdmins: AdminAccount[] = [
  { id: "a1", name: "Sarah Ochieng", email: "admin@demo.com", role: "operations", status: "active", lastLogin: "Today, 1:00 PM", createdAt: "2024-08-20", permissions: ["users", "kyc", "transactions", "withdrawals", "support", "notifications"] },
  { id: "a2", name: "Peter Njoroge", email: "peter@abanremit.com", role: "compliance", status: "active", lastLogin: "Today, 10:00 AM", createdAt: "2024-09-15", permissions: ["users", "kyc", "security", "logs"] },
  { id: "a3", name: "Mary Wambui", email: "mary@abanremit.com", role: "support", status: "active", lastLogin: "Yesterday, 5:00 PM", createdAt: "2024-11-01", permissions: ["users", "support", "notifications"] },
  { id: "a4", name: "John Omondi", email: "john@abanremit.com", role: "finance", status: "suspended", lastLogin: "Mar 1, 9:00 AM", createdAt: "2024-10-10", permissions: ["transactions", "withdrawals", "reports"] },
];

const allPermissions = [
  { id: "users", label: "User Management" },
  { id: "kyc", label: "KYC Verification" },
  { id: "transactions", label: "Transactions" },
  { id: "withdrawals", label: "Withdrawals" },
  { id: "airtime", label: "Airtime" },
  { id: "support", label: "Support" },
  { id: "notifications", label: "Notifications" },
  { id: "reports", label: "Reports" },
  { id: "security", label: "Security" },
  { id: "logs", label: "Activity Logs" },
];

const roleColors = {
  operations: "bg-primary/10 text-primary",
  compliance: "bg-warning/10 text-warning",
  support: "bg-success/10 text-success",
  finance: "bg-destructive/10 text-destructive",
};

const SuperAdminManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [admins] = useState(mockAdmins);
  const [selected, setSelected] = useState<AdminAccount | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", role: "operations" as AdminAccount["role"], permissions: [] as string[] });

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can manage administrator accounts.</p>
      </div>
    );
  }

  if (showCreate) {
    return (
      <div className="space-y-4">
        <button onClick={() => setShowCreate(false)} className="text-sm text-primary font-medium">← Back to Admins</button>
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Create New Admin</h3>
          <div className="space-y-4">
            <div>
              <label className="label-text">Full Name</label>
              <input className="input-field" placeholder="Admin name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Email</label>
              <input className="input-field" type="email" placeholder="admin@abanremit.com" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
            </div>
            <div>
              <label className="label-text">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(["operations", "compliance", "support", "finance"] as const).map((r) => (
                  <button key={r} onClick={() => setNewAdmin({ ...newAdmin, role: r })} className={`rounded-xl border py-2.5 px-4 text-xs font-medium capitalize transition-all ${newAdmin.role === r ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    {r} Admin
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-text">Module Permissions</label>
              <div className="grid grid-cols-2 gap-2">
                {allPermissions.map((p) => (
                  <button key={p.id} onClick={() => setNewAdmin({ ...newAdmin, permissions: newAdmin.permissions.includes(p.id) ? newAdmin.permissions.filter(x => x !== p.id) : [...newAdmin.permissions, p.id] })} className={`rounded-xl border py-2.5 px-3 text-xs font-medium transition-all text-left ${newAdmin.permissions.includes(p.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>
                    {newAdmin.permissions.includes(p.id) ? "✓ " : ""}{p.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { toast.success("Admin created and invitation sent"); setShowCreate(false); }} className="btn-primary flex items-center justify-center gap-2" disabled={!newAdmin.name || !newAdmin.email}>
              <UserPlus size={16} /> Create Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-primary font-medium">← Back to Admins</button>
        <div className="section-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {selected.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
            </div>
            <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md ${selected.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{selected.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Role", value: selected.role },
              { label: "Status", value: selected.status },
              { label: "Last Login", value: selected.lastLogin },
              { label: "Created", value: selected.createdAt },
            ].map((row) => (
              <div key={row.label} className="py-2">
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium text-foreground capitalize">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Assigned Permissions</h3>
          <div className="flex flex-wrap gap-2">
            {selected.permissions.map((p) => (
              <span key={p} className="text-[10px] font-medium px-2 py-1 rounded-lg bg-primary/10 text-primary capitalize">{p}</span>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => toast.success("Permissions updated")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
              <Edit size={14} className="text-primary" /> Edit Permissions
            </button>
            <button onClick={() => toast.success(selected.status === "active" ? "Admin suspended" : "Admin reactivated")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-warning hover:bg-warning/10 transition-colors">
              <Ban size={14} /> {selected.status === "active" ? "Suspend" : "Reactivate"}
            </button>
            <button onClick={() => toast.success("Activity log exported")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
              <Eye size={14} className="text-primary" /> View Activity Log
            </button>
            <button onClick={() => toast.success("Admin account deleted")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 size={14} /> Delete Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{admins.length} administrator accounts</p>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 px-4 text-xs font-medium">
          <UserPlus size={14} /> New Admin
        </button>
      </div>

      <div className="space-y-2">
        {admins.map((admin) => (
          <button key={admin.id} onClick={() => setSelected(admin)} className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {admin.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{admin.name}</p>
              <p className="text-[10px] text-muted-foreground">{admin.email}</p>
            </div>
            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${roleColors[admin.role]}`}>{admin.role}</span>
            <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${admin.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{admin.status}</span>
            <ChevronRight size={14} className="text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuperAdminManagement;
