import { useState } from "react";
import { Send, Smartphone, Bell, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const AdminNotifications = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [channels, setChannels] = useState<string[]>(["inapp"]);
  const [audience, setAudience] = useState<"all" | "specific">("all");
  const [sending, setSending] = useState(false);

  const { data: recentNotifs = [] } = useQuery({
    queryKey: ["admin-sent-notifications"],
    queryFn: async () => {
      // Get notifications sent by admin (system-wide broadcasts)
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("type", "announcement")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const handleSend = async () => {
    if (!title || !message) { toast.error("Please fill in title and message"); return; }
    setSending(true);

    try {
      // Get all user IDs
      const { data: profiles } = await supabase.from("profiles").select("user_id");
      if (!profiles || profiles.length === 0) { toast.error("No users found"); return; }

      // Insert notification for each user
      const notifications = profiles.map(p => ({
        user_id: p.user_id,
        title,
        message,
        type: "announcement",
      }));

      // Batch insert in chunks of 100
      for (let i = 0; i < notifications.length; i += 100) {
        const chunk = notifications.slice(i, i + 100);
        await supabase.from("notifications").insert(chunk);
      }

      toast.success(`Notification sent to ${profiles.length} users`);
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

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Announcements</h3>
        {recentNotifs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">No announcements sent yet</p>
        ) : (
          <div className="space-y-2">
            {recentNotifs.map((n: any) => (
              <div key={n.id} className="section-card">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="text-[10px] text-muted-foreground shrink-0">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-xs text-muted-foreground">{n.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotifications;
