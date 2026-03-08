import { useState } from "react";
import { Send, Smartphone, Bell, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const AdminNotifications = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<string[]>(["inapp"]);
  const [audience, setAudience] = useState<"all" | "specific">("all");

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSend = () => {
    if (!title || !message) {
      toast.error("Please fill in title and message");
      return;
    }
    toast.success(`Notification sent to ${audience === "all" ? "all users" : "selected users"} via ${channels.join(", ")}`);
    setTitle("");
    setMessage("");
  };

  const recentNotifications = [
    { title: "Scheduled Maintenance", message: "System maintenance on March 10, 2AM-4AM EAT", channels: ["inapp", "sms"], date: "Mar 7, 10:00 AM", audience: "All Users" },
    { title: "New Feature: Currency Exchange", message: "You can now exchange currencies directly in your wallet!", channels: ["inapp", "push"], date: "Mar 5, 9:00 AM", audience: "All Users" },
    { title: "Security Alert", message: "Update your PIN for enhanced security", channels: ["sms"], date: "Mar 3, 2:00 PM", audience: "Flagged Users" },
  ];

  return (
    <div className="space-y-6">
      {/* Compose */}
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Send Notification</h3>

        <div className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input className="input-field" placeholder="Notification title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="label-text">Message</label>
            <textarea
              className="input-field min-h-[100px] resize-none"
              placeholder="Enter your notification message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div>
            <label className="label-text">Delivery Channels</label>
            <div className="flex gap-2">
              {[
                { id: "inapp", label: "In-App", icon: Bell },
                { id: "sms", label: "SMS", icon: Smartphone },
                { id: "push", label: "Push", icon: MessageSquare },
              ].map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-2 rounded-xl border py-2.5 px-4 text-xs font-medium transition-all ${
                    channels.includes(ch.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <ch.icon size={14} />
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label-text">Audience</label>
            <div className="flex gap-2">
              {[
                { id: "all" as const, label: "All Users" },
                { id: "specific" as const, label: "Specific Users" },
              ].map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAudience(a.id)}
                  className={`rounded-xl border py-2.5 px-4 text-xs font-medium transition-all ${
                    audience === a.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSend} className="btn-primary flex items-center justify-center gap-2">
            <Send size={16} /> Send Notification
          </button>
        </div>
      </div>

      {/* Recent */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Notifications</h3>
        <div className="space-y-2">
          {recentNotifications.map((n, i) => (
            <div key={i} className="section-card">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold text-foreground">{n.title}</p>
                <p className="text-[10px] text-muted-foreground shrink-0">{n.date}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{n.message}</p>
              <div className="flex items-center gap-2">
                {n.channels.map((ch) => (
                  <span key={ch} className="text-[9px] font-medium uppercase px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">{ch}</span>
                ))}
                <span className="text-[10px] text-muted-foreground ml-auto">{n.audience}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
