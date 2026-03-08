import { Users, Wallet, TrendingUp, TrendingDown, Clock, UserCheck, ArrowLeftRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { dailyTransactionData, walletActivityData, mockAdminTransactions } from "@/data/mockData";

const stats = [
  { label: "Total Users", value: "1,247", icon: Users, bg: "bg-primary/10", color: "text-primary", change: "+12%" },
  { label: "Active Wallets", value: "1,189", icon: Wallet, bg: "bg-success/10", color: "text-success", change: "+8%" },
  { label: "Deposits Today", value: "KES 127K", icon: TrendingUp, bg: "bg-success/10", color: "text-success", change: "+23%" },
  { label: "Withdrawals Today", value: "KES 45K", icon: TrendingDown, bg: "bg-warning/10", color: "text-warning", change: "-5%" },
  { label: "Pending Withdrawals", value: "7", icon: Clock, bg: "bg-warning/10", color: "text-warning", change: "" },
  { label: "Pending KYC", value: "23", icon: UserCheck, bg: "bg-primary/10", color: "text-primary", change: "" },
  { label: "Transactions Today", value: "342", icon: ArrowLeftRight, bg: "bg-primary/10", color: "text-primary", change: "+15%" },
];

const recentActivity = [
  { text: "Alice Wanjiku deposited KES 5,000 via M-Pesa", time: "2 min ago", color: "text-success" },
  { text: "James Mwangi sent KES 1,200 to Sarah Ochieng", time: "15 min ago", color: "text-primary" },
  { text: "New user registered: Hassan Ahmed", time: "30 min ago", color: "text-primary" },
  { text: "Brian Otieno requested withdrawal of KES 2,000", time: "45 min ago", color: "text-warning" },
  { text: "Clara Adesanya M-Pesa deposit failed", time: "1 hr ago", color: "text-destructive" },
  { text: "Grace Achieng flagged for suspicious withdrawal", time: "2 hrs ago", color: "text-destructive" },
  { text: "Felix Kamau deposited KES 10,000 via card", time: "3 hrs ago", color: "text-success" },
];

const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="section-card">
            <div className="flex items-center justify-between mb-2">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
              {stat.change && (
                <span className={`text-[10px] font-semibold ${stat.change.startsWith("+") ? "text-success" : "text-destructive"}`}>
                  {stat.change}
                </span>
              )}
            </div>
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Daily Transaction Volume */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Transaction Volume (KES)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyTransactionData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }}
                formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="deposits" fill="hsl(217 91% 50%)" radius={[4, 4, 0, 0]} name="Deposits" />
              <Bar dataKey="withdrawals" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} name="Withdrawals" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deposits vs Withdrawals */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Deposits vs Withdrawals</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyTransactionData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }}
                formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]}
              />
              <Area type="monotone" dataKey="deposits" stroke="hsl(142 71% 40%)" fill="hsl(142 71% 40% / 0.15)" name="Deposits" />
              <Area type="monotone" dataKey="withdrawals" stroke="hsl(0 72% 51%)" fill="hsl(0 72% 51% / 0.1)" name="Withdrawals" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Wallet Activity */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Wallet Activity (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={walletActivityData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="active" stroke="hsl(217 91% 50%)" strokeWidth={2} dot={{ r: 3 }} name="Active Wallets" />
              <Line type="monotone" dataKey="new" stroke="hsl(142 71% 40%)" strokeWidth={2} dot={{ r: 3 }} name="New Registrations" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Airtime Purchases */}
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Airtime Purchases (Daily)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyTransactionData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip
                contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }}
                formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]}
              />
              <Bar dataKey="airtime" fill="hsl(142 71% 40%)" radius={[4, 4, 0, 0]} name="Airtime" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity & Latest Transactions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity</h3>
          <div className="space-y-0">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${a.color === "text-success" ? "bg-success" : a.color === "text-destructive" ? "bg-destructive" : a.color === "text-warning" ? "bg-warning" : "bg-primary"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Latest Transactions</h3>
          <div className="space-y-0">
            {mockAdminTransactions.slice(0, 6).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{tx.sender} → {tx.receiver}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.date} • {tx.reference}</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-xs font-semibold text-foreground">{tx.currency} {tx.amount.toLocaleString()}</p>
                  <p className={`text-[10px] font-medium capitalize ${
                    tx.status === "completed" ? "text-success" : tx.status === "pending" ? "text-warning" : tx.status === "flagged" ? "text-destructive" : "text-destructive"
                  }`}>{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
