import { CheckCircle2, XCircle, FileSearch, User, Calendar, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminKYC = () => {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-kyc-users"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
  });

  const pendingUsers = users.filter(u => u.kyc_status === "pending");

  const handleKycAction = async (userId: string, status: "approved" | "rejected", name: string) => {
    await supabase.from("profiles").update({ kyc_status: status }).eq("user_id", userId);
    queryClient.invalidateQueries({ queryKey: ["admin-kyc-users"] });
    if (status === "approved") toast.success(`KYC approved for ${name}`);
    else toast.error(`KYC rejected for ${name}`);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: users.filter(u => u.kyc_status === "pending").length, color: "text-warning" },
          { label: "Approved", value: users.filter(u => u.kyc_status === "approved").length, color: "text-success" },
          { label: "Rejected", value: users.filter(u => u.kyc_status === "rejected").length, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {pendingUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Pending Reviews</h3>
          <div className="space-y-3">
            {pendingUsers.map((u) => (
              <div key={u.id} className="section-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {u.first_name[0]}{u.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{u.first_name} {u.last_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-[9px] font-semibold uppercase px-2 py-1 rounded-md bg-warning/10 text-warning">Pending</span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="flex items-center gap-1.5"><Calendar size={12} className="text-muted-foreground" /><span className="text-muted-foreground">Joined:</span><span className="font-medium text-foreground">{new Date(u.created_at).toLocaleDateString()}</span></div>
                  <div className="flex items-center gap-1.5"><MapPin size={12} className="text-muted-foreground" /><span className="text-muted-foreground">Country:</span><span className="font-medium text-foreground">{u.country}</span></div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => handleKycAction(u.user_id, "approved", `${u.first_name} ${u.last_name}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-xs font-semibold text-success-foreground hover:bg-success/90 transition-colors">
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button onClick={() => handleKycAction(u.user_id, "rejected", `${u.first_name} ${u.last_name}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors">
                    <XCircle size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">All KYC Records</h3>
        <div className="section-card p-0 divide-y divide-border">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{u.first_name[0]}{u.last_name[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.first_name} {u.last_name}</p>
                <p className="text-[10px] text-muted-foreground">{u.email}</p>
              </div>
              <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-md ${
                u.kyc_status === "approved" ? "bg-success/10 text-success" : u.kyc_status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
              }`}>{u.kyc_status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminKYC;
