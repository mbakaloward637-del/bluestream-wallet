import { useState } from "react";
import { UserPlus, Shield, Trash2, Ban, ChevronRight, Edit, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const roleColors: Record<string, string> = {
  admin: "bg-primary/10 text-primary",
  superadmin: "bg-destructive/10 text-destructive",
  user: "bg-secondary text-secondary-foreground",
};

const SuperAdminManagement = () => {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admin-management"],
    queryFn: async () => {
      // Get all admin/superadmin roles
      const { data: roles } = await supabase.from("user_roles").select("*").in("role", ["admin", "superadmin"]);
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);

      return roles.map(r => {
        const profile = (profiles || []).find(p => p.user_id === r.user_id);
        return {
          id: r.id,
          user_id: r.user_id,
          role: r.role,
          name: profile ? `${profile.first_name} ${profile.last_name}` : "Unknown",
          email: profile?.email || "",
          status: profile?.status || "active",
          createdAt: profile?.created_at || "",
        };
      });
    },
  });

  const handleRemoveAdmin = async (userId: string, name: string) => {
    // Downgrade to user role
    await supabase.from("user_roles").delete().eq("user_id", userId).in("role", ["admin"]);
    queryClient.invalidateQueries({ queryKey: ["admin-management"] });
    toast.success(`${name} removed from admin`);
    setSelected(null);
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    await supabase.from("profiles").update({ status: newStatus }).eq("user_id", userId);
    queryClient.invalidateQueries({ queryKey: ["admin-management"] });
    toast.success(`Account ${newStatus}`);
  };

  if (!isSuperAdmin) {
    return (
      <div className="section-card text-center py-12">
        <Shield size={48} className="mx-auto text-destructive mb-4" />
        <h2 className="text-lg font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-1">Only Super Admins can manage administrator accounts.</p>
      </div>
    );
  }

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  if (selected) {
    return (
      <div className="space-y-4">
        <button onClick={() => setSelected(null)} className="text-sm text-primary font-medium">← Back to Admins</button>
        <div className="section-card">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
              {selected.name.split(" ").map((n: string) => n[0]).join("")}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">{selected.name}</h2>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
            </div>
            <span className={`text-[10px] font-semibold uppercase px-2 py-1 rounded-md ${selected.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{selected.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="py-2"><p className="text-[10px] text-muted-foreground">Role</p><p className="text-sm font-medium text-foreground capitalize">{selected.role}</p></div>
            <div className="py-2"><p className="text-[10px] text-muted-foreground">Created</p><p className="text-sm font-medium text-foreground">{new Date(selected.createdAt).toLocaleDateString()}</p></div>
          </div>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handleToggleStatus(selected.user_id, selected.status)}
              className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-warning hover:bg-warning/10 transition-colors">
              <Ban size={14} /> {selected.status === "active" ? "Suspend" : "Reactivate"}
            </button>
            {selected.role !== "superadmin" && (
              <button onClick={() => handleRemoveAdmin(selected.user_id, selected.name)}
                className="flex items-center gap-2 rounded-xl border border-border py-3 px-4 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} /> Remove Admin
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{admins.length} administrator accounts</p>
      </div>

      {admins.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-8">No admin accounts found. Promote users from the Users page.</p>
      ) : (
        <div className="space-y-2">
          {admins.map((admin: any) => (
            <button key={admin.id} onClick={() => setSelected(admin)} className="section-card w-full flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {admin.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{admin.name}</p>
                <p className="text-[10px] text-muted-foreground">{admin.email}</p>
              </div>
              <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${roleColors[admin.role] || ""}`}>{admin.role}</span>
              <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${admin.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>{admin.status}</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SuperAdminManagement;
