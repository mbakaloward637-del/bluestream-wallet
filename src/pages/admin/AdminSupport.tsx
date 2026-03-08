import { MessageSquare, ArrowUpCircle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const priorityColors: Record<string, string> = {
  low: "bg-primary/10 text-primary",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

const statusColors: Record<string, string> = {
  open: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  escalated: "bg-destructive/10 text-destructive",
};

const categoryLabels: Record<string, string> = {
  failed_transaction: "Failed Transaction",
  login_issue: "Login Issue",
  payment_dispute: "Payment Dispute",
  general: "General",
  account_issue: "Account Issue",
};

const AdminSupport = () => {
  const queryClient = useQueryClient();

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_tickets")
        .select("*, profiles:user_id(first_name, last_name, email)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const handleStatusUpdate = async (id: string, status: "open" | "in_progress" | "resolved" | "escalated") => {
    await supabase.from("support_tickets").update({ status }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    toast.success(`Ticket status updated to ${status.replace("_", " ")}`);
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open", value: tickets.filter((t: any) => t.status === "open").length, icon: Clock, color: "text-warning" },
          { label: "In Progress", value: tickets.filter((t: any) => t.status === "in_progress").length, icon: MessageSquare, color: "text-primary" },
          { label: "Resolved", value: tickets.filter((t: any) => t.status === "resolved").length, icon: CheckCircle2, color: "text-success" },
          { label: "Escalated", value: tickets.filter((t: any) => t.status === "escalated").length, icon: ArrowUpCircle, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <stat.icon size={20} className={`mx-auto mb-1 ${stat.color}`} />
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Support Tickets</h3>
        {tickets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No support tickets yet</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket: any) => {
              const userName = ticket.profiles ? `${ticket.profiles.first_name} ${ticket.profiles.last_name}` : "Unknown";
              return (
                <div key={ticket.id} className="section-card">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${priorityColors[ticket.priority] || ""}`}>{ticket.priority}</span>
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusColors[ticket.status] || ""}`}>{ticket.status.replace("_", " ")}</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">{new Date(ticket.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{ticket.description}</p>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <div>
                      <span className="text-muted-foreground">User: </span>
                      <span className="font-medium text-foreground">{userName}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{categoryLabels[ticket.category] || ticket.category}</span>
                  </div>
                  {(ticket.status === "open" || ticket.status === "in_progress") && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusUpdate(ticket.id, "resolved")}
                        className="flex items-center gap-1.5 rounded-xl border border-border py-2 px-3 text-xs font-medium text-success hover:bg-success/10 transition-colors">
                        <CheckCircle2 size={12} /> Resolve
                      </button>
                      <button onClick={() => handleStatusUpdate(ticket.id, "in_progress")}
                        className="flex items-center gap-1.5 rounded-xl border border-border py-2 px-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors">
                        <MessageSquare size={12} /> In Progress
                      </button>
                      <button onClick={() => handleStatusUpdate(ticket.id, "escalated")}
                        className="flex items-center gap-1.5 rounded-xl border border-border py-2 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <ArrowUpCircle size={12} /> Escalate
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupport;
