import { useState } from "react";
import { Search, Eye, KeyRound, Lock, AlertTriangle, ChevronRight } from "lucide-react";
import { mockPlatformUsers, PlatformUser } from "@/data/mockData";
import { toast } from "sonner";

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<PlatformUser | null>(null);

  const filtered = mockPlatformUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.walletNumber.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  if (selectedUser) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedUser(null)} className="text-sm text-primary font-medium">← Back to Users</button>

        <div className="section-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {selectedUser.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{selectedUser.name}</h2>
              <p className="text-sm text-muted-foreground">{selectedUser.walletNumber}</p>
            </div>
            <span className={`ml-auto text-[10px] font-semibold uppercase px-2 py-1 rounded-md ${
              selectedUser.status === "active" ? "bg-success/10 text-success" :
              selectedUser.status === "frozen" ? "bg-warning/10 text-warning" :
              "bg-destructive/10 text-destructive"
            }`}>{selectedUser.status}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Full Name", value: selectedUser.name },
              { label: "Wallet Number", value: selectedUser.walletNumber },
              { label: "Phone Number", value: selectedUser.phone },
              { label: "Email", value: selectedUser.email },
              { label: "Balance", value: `KES ${selectedUser.balance.toLocaleString()}` },
              { label: "Country", value: selectedUser.country },
              { label: "Registered", value: selectedUser.joined },
              { label: "Last Login", value: selectedUser.lastLogin },
              { label: "KYC Status", value: selectedUser.kycStatus },
              { label: "Total Transactions", value: String(selectedUser.totalTransactions) },
            ].map((row) => (
              <div key={row.label} className="py-2">
                <p className="text-[10px] text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium text-foreground capitalize">{row.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Admin Actions */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Admin Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => toast.success("Password reset link sent")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
              <KeyRound size={14} className="text-primary" /> Reset Password
            </button>
            <button onClick={() => toast.success("PIN reset successfully")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-foreground hover:bg-secondary transition-colors">
              <Lock size={14} className="text-primary" /> Reset Wallet PIN
            </button>
            <button onClick={() => toast.success("Account suspended")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-warning hover:bg-warning/10 transition-colors">
              <AlertTriangle size={14} /> Suspend Account
            </button>
            <button onClick={() => toast.success("Account flagged for review")} className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
              <AlertTriangle size={14} /> Flag Account
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">Note: Admins cannot permanently delete user accounts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="section-card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            className="input-field pl-10"
            placeholder="Search by name, email, wallet, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">{filtered.length} users found</p>

      {/* User List */}
      <div className="space-y-2">
        {filtered.map((u) => (
          <button
            key={u.id}
            onClick={() => setSelectedUser(u)}
            className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {u.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
              <p className="text-[10px] text-muted-foreground">{u.walletNumber} • {u.phone}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-foreground">KES {u.balance.toLocaleString()}</p>
                <p className={`text-[10px] font-medium capitalize ${
                  u.kycStatus === "approved" ? "text-success" : u.kycStatus === "pending" ? "text-warning" : "text-destructive"
                }`}>KYC: {u.kycStatus}</p>
              </div>
              <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                u.status === "active" ? "bg-success/10 text-success" :
                u.status === "frozen" ? "bg-warning/10 text-warning" :
                "bg-destructive/10 text-destructive"
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
