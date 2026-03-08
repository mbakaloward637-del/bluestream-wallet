import { Users, Wallet, TrendingUp, TrendingDown, Clock, UserCheck, ArrowLeftRight, DollarSign, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { dailyTransactionData, walletActivityData, mockAdminTransactions, mockActivityLogs } from "@/data/mockData";

const stats = [
  { label: "Total Users", value: "1,247", icon: Users, bg: "bg-primary/10", color: "text-primary", change: "+12%" },
  { label: "Active Wallets", value: "1,189", icon: Wallet, bg: "bg-success/10", color: "text-success", change: "+8%" },
  { label: "Total Wallet Balance", value: "KES 14.2M", icon: DollarSign, bg: "bg-primary/10", color: "text-primary", change: "+18%" },
  { label: "Total Deposits", value: "KES 2.1M", icon: TrendingUp, bg: "bg-success/10", color: "text-success", change: "+23%" },
  { label: "Total Withdrawals", value: "KES 890K", icon: TrendingDown, bg: "bg-warning/10", color: "text-warning", change: "-5%" },
  { label: "Platform Revenue", value: "KES 127K", icon: DollarSign, bg: "bg-success/10", color: "text-success", change: "+34%" },
  { label: "Pending Transactions", value: "14", icon: Clock, bg: "bg-warning/10", color: "text-warning", change: "" },
  { label: "Pending KYC", value: "23", icon: UserCheck, bg: "bg-primary/10", color: "text-primary", change: "" },
];

const monthlyRevenue = [
  { month: "Oct", revenue: 78000 },
  { month: "Nov", revenue: 92000 },
  { month: "Dec", revenue: 105000 },
  { month: "Jan", revenue: 112000 },
  { month: "Feb", revenue: 118000 },
  { month: "Mar", revenue: 127000 },
];

const userGrowth = [
  { month: "Oct", users: 820, newUsers: 45 },
  { month: "Nov", users: 890, newUsers: 70 },
  { month: "Dec", users: 980, newUsers: 90 },
  { month: "Jan", users: 1080, newUsers: 100 },
  { month: "Feb", users: 1170, newUsers: 90 },
  { month: "Mar", users: 1247, newUsers: 77 },
];

const recentActivity = [
  { text: "Alice Wanjiku deposited KES 5,000 via M-Pesa", time: "2 min ago", type: "transaction" },
  { text: "James Mwangi sent KES 1,200 to Sarah Ochieng", time: "15 min ago", type: "transaction" },
  { text: "New user registered: Hassan Ahmed", time: "30 min ago", type: "user" },
  { text: "Admin Sarah Ochieng approved KYC for Alice Wanjiku", time: "45 min ago", type: "admin" },
  { text: "Brian Otieno requested withdrawal of KES 2,000", time: "1 hr ago", type: "transaction" },
  { text: "System alert: High transaction volume detected", time: "1.5 hrs ago", type: "system" },
  { text: "Grace Achieng flagged for suspicious withdrawal", time: "2 hrs ago", type: "alert" },
  { text: "Exchange rate updated: USD/KES 129.50", time: "3 hrs ago", type: "system" },
];

const getTypeColor = (type: string) => {
  switch (type) {
    case "transaction": return "bg-primary";
    case "user": return "bg-success";
    case "admin": return "bg-primary";
    case "system": return "bg-warning";
    case "alert": return "bg-destructive";
    default: return "bg-muted-foreground";
  }
};

const SuperAdminDashboard = () => {
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

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Daily Transaction Volume (KES)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyTransactionData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]} />
              <Bar dataKey="deposits" fill="hsl(217 91% 50%)" radius={[4, 4, 0, 0]} name="Deposits" />
              <Bar dataKey="withdrawals" fill="hsl(38 92% 50%)" radius={[4, 4, 0, 0]} name="Withdrawals" />
              <Bar dataKey="transfers" fill="hsl(142 71% 40%)" radius={[4, 4, 0, 0]} name="Transfers" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Revenue Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyRevenue}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(142 71% 40%)" fill="hsl(142 71% 40% / 0.15)" name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Deposits vs Withdrawals</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={dailyTransactionData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]} />
              <Area type="monotone" dataKey="deposits" stroke="hsl(142 71% 40%)" fill="hsl(142 71% 40% / 0.15)" name="Deposits" />
              <Area type="monotone" dataKey="withdrawals" stroke="hsl(0 72% 51%)" fill="hsl(0 72% 51% / 0.1)" name="Withdrawals" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={userGrowth}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="users" stroke="hsl(217 91% 50%)" strokeWidth={2} dot={{ r: 3 }} name="Total Users" />
              <Line type="monotone" dataKey="newUsers" stroke="hsl(142 71% 40%)" strokeWidth={2} dot={{ r: 3 }} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Wallet Activity (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={walletActivityData}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }} />
              <Line type="monotone" dataKey="active" stroke="hsl(217 91% 50%)" strokeWidth={2} dot={{ r: 3 }} name="Active Wallets" />
              <Line type="monotone" dataKey="new" stroke="hsl(142 71% 40%)" strokeWidth={2} dot={{ r: 3 }} name="New Registrations" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Airtime Purchases (Daily)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyTransactionData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220 10% 50%)" tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 100%)", border: "1px solid hsl(220 13% 91%)", borderRadius: 12, fontSize: 12 }} formatter={(value: number) => [`KES ${value.toLocaleString()}`, undefined]} />
              <Bar dataKey="airtime" fill="hsl(142 71% 40%)" radius={[4, 4, 0, 0]} name="Airtime" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activity Feed & Latest Transactions */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Activity Feed</h3>
          <div className="space-y-0">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${getTypeColor(a.type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground">{a.text}</p>
                  <p className="text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-card">
          <h3 className="text-sm font-semibold text-foreground mb-3">Admin Actions Log</h3>
          <div className="space-y-0">
            {mockActivityLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-border last:border-0">
                <div className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 bg-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground"><span className="font-medium">{log.adminName}</span>: {log.action}</p>
                  <p className="text-[10px] text-muted-foreground">{log.timestamp} • IP: {log.ipAddress}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
