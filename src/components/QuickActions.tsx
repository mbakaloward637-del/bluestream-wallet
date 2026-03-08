import { Send, Download, ArrowUpDown, CreditCard, Wallet, FileText, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const actions = [
  { icon: Wallet, label: "Load", path: "/load", bg: "bg-primary/10", color: "text-primary" },
  { icon: Send, label: "Send", path: "/send", bg: "bg-primary/10", color: "text-primary" },
  { icon: Download, label: "Withdraw", path: "/withdraw", bg: "bg-success/10", color: "text-success" },
  { icon: ArrowUpDown, label: "Exchange", path: "/exchange", bg: "bg-warning/10", color: "text-warning" },
  { icon: Smartphone, label: "Airtime", path: "/buy-airtime", bg: "bg-success/10", color: "text-success" },
  { icon: CreditCard, label: "My Card", path: "/card", bg: "bg-primary/10", color: "text-primary" },
  { icon: FileText, label: "Statement", path: "/statement", bg: "bg-muted", color: "text-muted-foreground" },
];

const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path)}
          className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 transition-all hover:shadow-sm active:scale-95"
        >
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${action.bg}`}>
            <action.icon size={20} className={action.color} />
          </div>
          <span className="text-[10px] font-medium text-foreground">{action.label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
