import { mockSupportTickets } from "@/data/mockData";
import { MessageSquare, ArrowUpCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

const priorityColors = {
  low: "bg-primary/10 text-primary",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
  critical: "bg-destructive text-destructive-foreground",
};

const statusColors = {
  open: "bg-warning/10 text-warning",
  in_progress: "bg-primary/10 text-primary",
  resolved: "bg-success/10 text-success",
  escalated: "bg-destructive/10 text-destructive",
};

const categoryLabels = {
  failed_transaction: "Failed Transaction",
  login_issue: "Login Issue",
  payment_dispute: "Payment Dispute",
  general: "General",
  account_issue: "Account Issue",
};

const AdminSupport = () => {
  const openTickets = mockSupportTickets.filter(t => t.status === "open" || t.status === "in_progress");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Open", value: mockSupportTickets.filter(t => t.status === "open").length, icon: Clock, color: "text-warning" },
          { label: "In Progress", value: mockSupportTickets.filter(t => t.status === "in_progress").length, icon: MessageSquare, color: "text-primary" },
          { label: "Resolved", value: mockSupportTickets.filter(t => t.status === "resolved").length, icon: CheckCircle2, color: "text-success" },
          { label: "Escalated", value: mockSupportTickets.filter(t => t.status === "escalated").length, icon: ArrowUpCircle, color: "text-destructive" },
        ].map((stat) => (
          <div key={stat.label} className="section-card text-center">
            <stat.icon size={20} className={`mx-auto mb-1 ${stat.color}`} />
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* All Tickets */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Support Tickets</h3>
        <div className="space-y-3">
          {mockSupportTickets.map((ticket) => (
            <div key={ticket.id} className="section-card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                    <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusColors[ticket.status]}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{ticket.subject}</p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0">{ticket.createdAt}</p>
              </div>

              <p className="text-xs text-muted-foreground mb-2">{ticket.description}</p>

              <div className="flex items-center justify-between text-xs mb-3">
                <div>
                  <span className="text-muted-foreground">User: </span>
                  <span className="font-medium text-foreground">{ticket.userName}</span>
                  <span className="text-muted-foreground"> ({ticket.userWallet})</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{categoryLabels[ticket.category]}</span>
              </div>

              {(ticket.status === "open" || ticket.status === "in_progress") && (
                <div className="flex gap-2">
                  <button
                    onClick={() => toast.success(`Ticket #${ticket.id} marked as resolved`)}
                    className="flex items-center gap-1.5 rounded-xl border border-border py-2 px-3 text-xs font-medium text-success hover:bg-success/10 transition-colors"
                  >
                    <CheckCircle2 size={12} /> Resolve
                  </button>
                  <button
                    onClick={() => toast.info("Response sent to user")}
                    className="flex items-center gap-1.5 rounded-xl border border-border py-2 px-3 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    <MessageSquare size={12} /> Respond
                  </button>
                  <button
                    onClick={() => toast.warning("Ticket escalated to Super Admin")}
                    className="flex items-center gap-1.5 rounded-xl border border-border py-2 px-3 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <ArrowUpCircle size={12} /> Escalate
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSupport;
