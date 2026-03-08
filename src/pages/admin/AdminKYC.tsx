import { mockPlatformUsers } from "@/data/mockData";
import { CheckCircle2, XCircle, FileSearch, User, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

const AdminKYC = () => {
  const pendingUsers = mockPlatformUsers.filter(u => u.kycStatus === "pending");
  const allUsers = mockPlatformUsers;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Pending", value: pendingUsers.length, color: "bg-warning/10 text-warning" },
          { label: "Approved", value: allUsers.filter(u => u.kycStatus === "approved").length, color: "bg-success/10 text-success" },
          { label: "Rejected", value: allUsers.filter(u => u.kycStatus === "rejected").length, color: "bg-destructive/10 text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <p className={`text-2xl font-bold ${stat.color.split(" ")[1]}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending Reviews */}
      {pendingUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Pending Reviews</h3>
          <div className="space-y-3">
            {pendingUsers.map((u) => (
              <div key={u.id} className="section-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {u.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.walletNumber} • {u.email}</p>
                  </div>
                  <span className="text-[9px] font-semibold uppercase px-2 py-1 rounded-md bg-warning/10 text-warning">Pending</span>
                </div>

                {/* Mock ID Documents */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "ID Front", icon: FileSearch },
                    { label: "ID Back", icon: FileSearch },
                    { label: "Selfie", icon: User },
                  ].map((doc) => (
                    <div key={doc.label} className="flex flex-col items-center gap-1 rounded-xl border border-border p-3 bg-secondary/50">
                      <doc.icon size={24} className="text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">{doc.label}</p>
                      <p className="text-[10px] text-primary font-medium cursor-pointer">View</p>
                    </div>
                  ))}
                </div>

                {/* Registration Details */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Joined:</span>
                    <span className="font-medium text-foreground">{u.joined}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-muted-foreground" />
                    <span className="text-muted-foreground">Country:</span>
                    <span className="font-medium text-foreground">{u.country}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.success(`KYC approved for ${u.name}. SMS notification sent.`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success py-2.5 text-xs font-semibold text-success-foreground hover:bg-success/90 transition-colors"
                  >
                    <CheckCircle2 size={14} /> Approve
                  </button>
                  <button
                    onClick={() => toast.error(`KYC rejected for ${u.name}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  >
                    <XCircle size={14} /> Reject
                  </button>
                  <button
                    onClick={() => toast.info(`Additional verification requested from ${u.name}`)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium text-foreground hover:bg-secondary transition-colors"
                  >
                    Request More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All KYC Records */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">All KYC Records</h3>
        <div className="section-card p-0 divide-y divide-border">
          {allUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {u.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                <p className="text-[10px] text-muted-foreground">{u.walletNumber}</p>
              </div>
              <span className={`text-[9px] font-semibold uppercase px-2 py-1 rounded-md ${
                u.kycStatus === "approved" ? "bg-success/10 text-success" :
                u.kycStatus === "pending" ? "bg-warning/10 text-warning" :
                "bg-destructive/10 text-destructive"
              }`}>{u.kycStatus}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminKYC;
