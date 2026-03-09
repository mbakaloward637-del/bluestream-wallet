import { useState } from "react";
import { Search, KeyRound, Lock, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      return await api.admin.users();
    },
  });

  const filtered = users.filter((u: any) =>
    (u.first_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.last_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.wallet_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedUser = users.find((u: any) => u.user_id === selectedUserId || u.id === selectedUserId);

  if (selectedUser) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedUserId(null)} className="text-sm text-primary font-medium">← Back to Users</button>
        <div className="section-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {(selectedUser.first_name || "?")[0]}{(selectedUser.last_name || "?")[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{selectedUser.first_name} {selectedUser.last_name}</h2>
              <p className="text-sm text-muted-foreground">{selectedUser.wallet_number || ""}</p>
            </div>
            <span className={`ml-auto text-[10px] font-semibold uppercase px-2 py-1 rounded-md ${
              selectedUser.status === "active" ? "bg-success/10 text-success" : selectedUser.status === "frozen" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
            }`}>{selectedUser.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Email", value: selectedUser.email },
              { label: "Phone", value: selectedUser.phone || "—" },
              { label: "Balance", value: `${selectedUser.currency || "KES"} ${Number(selectedUser.balance || 0).toLocaleString()}` },
              { label: "Country", value: selectedUser.country },
              { label: "KYC Status", value: selectedUser.kyc_status },
              { label: "Registered", value: new Date(selectedUser.created_at).toLocaleDateString() },
            ].map((row) => (
              <div key={row.label} className="py-2">
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium text-foreground capitalize">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Admin Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={async () => {
              try { await api.admin.resetUserPassword(selectedUser.user_id || selectedUser.id); toast.success("Password reset link sent"); } catch { toast.error("Failed"); }
            }} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
              <KeyRound size={14} className="text-primary" /> Reset Password
            </button>
            <button onClick={async () => {
              try { await api.admin.resetUserPin(selectedUser.user_id || selectedUser.id); toast.success("PIN reset"); } catch { toast.error("Failed"); }
            }} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
              <Lock size={14} className="text-primary" /> Reset PIN
            </button>
            <button onClick={async () => {
              try { await api.admin.updateUserStatus(selectedUser.user_id || selectedUser.id, "suspended"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Account suspended"); } catch { toast.error("Failed"); }
            }} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-warning hover:bg-warning/10 transition-colors">
              <AlertTriangle size={14} /> Suspend
            </button>
            <button onClick={async () => {
              try { await api.admin.updateUserStatus(selectedUser.user_id || selectedUser.id, "frozen"); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Account frozen"); } catch { toast.error("Failed"); }
            }} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <AlertTriangle size={14} /> Freeze
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="section-card">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="input-field pl-10" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} users found</p>
      <div className="space-y-2">
        {filtered.map((u: any) => (
          <button key={u.user_id || u.id} onClick={() => setSelectedUserId(u.user_id || u.id)} className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {(u.first_name || "?")[0]}{(u.last_name || "?")[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{u.first_name} {u.last_name}</p>
              <p className="text-[10px] text-muted-foreground">{u.wallet_number || ""} • {u.email}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                u.status === "active" ? "bg-success/10 text-success" : u.status === "frozen" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
              }`}>{u.status}</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminUsers;
