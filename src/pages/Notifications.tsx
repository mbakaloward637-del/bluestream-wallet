import { ArrowLeft, Wallet, Send, Download, Smartphone, UserPlus, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const notifications = [
  { id: 1, icon: UserPlus, title: "Account Created", desc: "Welcome to AbanRemit! Your wallet WLT8880001023 is ready.", time: "Mar 7, 9:00 AM", color: "bg-primary/10", iconColor: "text-primary" },
  { id: 2, icon: Wallet, title: "Wallet Deposit", desc: "KES 5,000 deposited via M-Pesa. New balance: KES 12,450.75", time: "Today, 2:30 PM", color: "bg-success/10", iconColor: "text-success" },
  { id: 3, icon: Send, title: "Money Sent", desc: "KES 1,200 sent to Sarah Ochieng (WLT8880001045)", time: "Today, 11:15 AM", color: "bg-primary/10", iconColor: "text-primary" },
  { id: 4, icon: Download, title: "Money Received", desc: "KES 3,000 received from David Kimani", time: "Yesterday, 4:45 PM", color: "bg-success/10", iconColor: "text-success" },
  { id: 5, icon: Download, title: "Withdrawal", desc: "KES 2,000 withdrawn to Equity Bank. Processing.", time: "Yesterday, 9:00 AM", color: "bg-warning/10", iconColor: "text-warning" },
  { id: 6, icon: Smartphone, title: "Airtime Purchase", desc: "KES 100 airtime sent to +254712345678 (Safaricom)", time: "Mar 5, 1:00 PM", color: "bg-success/10", iconColor: "text-success" },
];

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="page-container">
      <div className="px-5 pt-6">
        <div className="page-header px-0 pt-0 mb-6">
          <button onClick={() => navigate(-1)} className="back-btn">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground">Notifications</h1>
        </div>

        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className="section-card flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${n.color} shrink-0 mt-0.5`}>
                <n.icon size={18} className={n.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.desc}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Notifications;
