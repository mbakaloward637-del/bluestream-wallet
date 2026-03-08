import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Shield, BarChart3, Settings, Search, ChevronRight, Eye, Snowflake, CheckCircle2, XCircle, DollarSign, TrendingUp, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { mockPlatformUsers } from "@/data/mockData";
import { useEffect } from "react";

type Tab = "overview" | "users" | "kyc" | "transactions" | "settings";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || !isAdmin) navigate("/dashboard");
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  const filteredUsers = mockPlatformUsers.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { id: Tab; icon: React.ElementType; label: string; superOnly?: boolean }[] = [
    { id: "overview", icon: BarChart3, label: "Overview" },
    { id: "users", icon: Users, label: "Users" },
    { id: "kyc", icon: UserCheck, label: "KYC" },
    { id: "transactions", icon: DollarSign, label: "Txns" },
    { id: "settings", icon: Settings, label: "Settings", superOnly: true },
  ];

  return (
    <div className="min-h-screen gradient-hero pb-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-5 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/dashboard")} className="glass-card flex h-10 w-10 items-center justify-center rounded-xl">
            <ArrowLeft size={18} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isSuperAdmin ? "text-destructive" : "text-warning"}`}>
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="glass-card flex rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((t) => {
            if (t.superOnly && !isSuperAdmin) return null;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[10px] font-semibold transition-all whitespace-nowrap px-2 ${
                  tab === t.id ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Users", value: "1,247", icon: Users, color: "bg-primary/10 text-primary" },
                { label: "Active Wallets", value: "1,189", icon: Shield, color: "bg-success/10 text-success" },
                { label: "Total Volume", value: "KES 24.5M", icon: TrendingUp, color: "bg-accent/10 text-accent" },
                { label: "Pending KYC", value: "23", icon: UserCheck, color: "bg-warning/10 text-warning" },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.color} mb-2`}>
                    <stat.icon size={16} />
                  </div>
                  <p className="text-lg font-bold text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent activity */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
              {[
                { text: "Alice Wanjiku completed KYC", time: "2 min ago", color: "text-success" },
                { text: "Brian Otieno loaded KES 5,000", time: "15 min ago", color: "text-primary" },
                { text: "Clara Adesanya wallet frozen", time: "1 hr ago", color: "text-destructive" },
                { text: "New user registered: Daniel Maina", time: "3 hrs ago", color: "text-accent" },
              ].map((a, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <p className={`text-xs font-medium ${a.color}`}>{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Users */}
        {tab === "users" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input-glass w-full pl-11"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <div key={u.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground">
                    {u.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                    <p className="text-[10px] text-muted-foreground">{u.walletNumber} • KES {u.balance.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                      u.status === "active" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}>
                      {u.status}
                    </span>
                    {isSuperAdmin && (
                      <div className="flex gap-1">
                        <button className="glass-card h-7 w-7 flex items-center justify-center rounded-lg" title="View">
                          <Eye size={12} className="text-primary" />
                        </button>
                        <button className="glass-card h-7 w-7 flex items-center justify-center rounded-lg" title="Freeze">
                          <Snowflake size={12} className="text-warning" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* KYC */}
        {tab === "kyc" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {mockPlatformUsers.filter(u => u.kycStatus === "pending").length === 0 && (
              <div className="glass-card rounded-2xl p-8 text-center">
                <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">No pending KYC reviews</p>
              </div>
            )}
            {mockPlatformUsers.map((u) => (
              <div key={u.id} className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-[10px] font-bold text-primary-foreground">
                      {u.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground">{u.country} • Joined {u.joined}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-md ${
                    u.kycStatus === "approved" ? "bg-success/10 text-success" :
                    u.kycStatus === "pending" ? "bg-warning/10 text-warning" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {u.kycStatus}
                  </span>
                </div>
                {u.kycStatus === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 flex items-center justify-center gap-1 glass-card rounded-lg py-2 text-xs font-semibold text-success hover:bg-success/10 transition-colors">
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1 glass-card rounded-lg py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors">
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Transactions */}
        {tab === "transactions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="glass-card rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Platform Transactions</h3>
              {[
                { from: "James Mwangi", to: "Sarah Ochieng", amount: "KES 1,200", type: "Send", time: "Today 11:15 AM" },
                { from: "Alice Wanjiku", to: "Wallet", amount: "KES 5,000", type: "Deposit", time: "Today 10:30 AM" },
                { from: "Brian Otieno", to: "Bank", amount: "KES 2,000", type: "Withdraw", time: "Yesterday 9:00 AM" },
                { from: "Esther Njeri", to: "Daniel Maina", amount: "KES 800", type: "Send", time: "Yesterday 3:45 PM" },
                { from: "David Kimani", to: "Exchange", amount: "KES 10,000", type: "Exchange", time: "Mar 5, 3:20 PM" },
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/20 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{tx.from} → {tx.to}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.time}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{tx.amount}</p>
                    <p className="text-[10px] text-muted-foreground">{tx.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Settings (SuperAdmin only) */}
        {tab === "settings" && isSuperAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {[
              { label: "Fee Configuration", desc: "Set transaction and withdrawal fees", icon: DollarSign },
              { label: "Exchange Rates", desc: "Manage currency exchange rates", icon: TrendingUp },
              { label: "Manage Admins", desc: "Add or remove admin users", icon: Shield },
              { label: "Platform Settings", desc: "General platform configuration", icon: Settings },
            ].map((item) => (
              <button key={item.label} className="glass-card-hover w-full flex items-center gap-3 rounded-2xl p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon size={18} className="text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPanel;
