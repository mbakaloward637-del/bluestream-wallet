import { useState } from "react";
import { Send, Smartphone, Bell, MessageSquare, Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const AdminNotifications = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<string[]>(["inapp"]);
  const [sending, setSending] = useState(false);

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSend = async () => {
    if (!title || !message) { toast.error("Please fill in title and message"); return; }
    setSending(true);
    try {
      const results: string[] = [];

      if (channels.includes("inapp")) {
        await api.admin.sendBulkNotification({ title, message, type: "announcement" });
        results.push("In-App: sent");
      }

      if (channels.includes("sms")) {
        try {
          await api.admin.sendBulkSms({ message: `${title}: ${message}` });
          results.push("SMS: sent");
        } catch {
          results.push("SMS: failed");
        }
      }

      if (channels.includes("push")) {
        results.push("Push: queued (provider pending)");
      }

      toast.success(results.join(" · ") || "Notifications sent");
      setTitle("");
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="section-card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Send Notification</h3>
        <div className="space-y-4">
          <div>
            <label className="label-text">Title</label>
            <input className="input-field" placeholder="Notification title..." value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label-text">Message</label>
            <textarea className="input-field min-h-[100px] resize-none" placeholder="Enter your notification message..." value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <div>
            <label className="label-text">Delivery Channels</label>
            <div className="flex gap-2">
              {[
                { id: "inapp", label: "In-App", icon: Bell },
                { id: "sms", label: "SMS", icon: Smartphone },
                { id: "push", label: "Push", icon: MessageSquare },
              ].map((ch) => (
                <button key={ch.id} onClick={() => toggleChannel(ch.id)}
                  className={`flex items-center gap-2 rounded-xl border py-2.5 px-4 text-xs font-medium transition-all ${
                    channels.includes(ch.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                  }`}>
                  <ch.icon size={14} />{ch.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSend} disabled={sending} className="btn-primary flex items-center justify-center gap-2">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send Notification
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
