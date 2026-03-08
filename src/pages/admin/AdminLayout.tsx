import { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import {
  LayoutDashboard, Users, UserCheck, ArrowLeftRight, Download, Smartphone,
  HeadphonesIcon, BellRing, FileBarChart, ShieldAlert, ClipboardList, LogOut,
  Menu, X, ChevronRight, Wallet
} from "lucide-react";

const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", path: "/admin/users", icon: Users },
  { label: "KYC Verification", path: "/admin/kyc", icon: UserCheck },
  { label: "Transactions", path: "/admin/transactions", icon: ArrowLeftRight },
  { label: "Withdrawals", path: "/admin/withdrawals", icon: Download },
  { label: "Airtime", path: "/admin/airtime", icon: Smartphone },
  { label: "Support", path: "/admin/support", icon: HeadphonesIcon },
  { label: "Notifications", path: "/admin/notifications", icon: BellRing },
  { label: "Reports", path: "/admin/reports", icon: FileBarChart },
  { label: "Security", path: "/admin/security", icon: ShieldAlert },
  { label: "Activity Logs", path: "/admin/logs", icon: ClipboardList },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user || !isAdmin) navigate("/admin/login");
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Wallet size={18} className="text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">AbanRemit</p>
              <p className="text-[10px] text-muted-foreground font-medium">Admin Panel</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden back-btn h-8 w-8">
            <X size={16} />
          </button>
        </div>

        {/* Admin info */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {user.avatarInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.firstName} {user.lastName}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${user.role === "superadmin" ? "text-destructive" : "text-primary"}`}>
                {user.role === "superadmin" ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} className="ml-auto" />}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={() => { logout(); navigate("/admin/login"); }}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="back-btn lg:hidden">
              <Menu size={18} />
            </button>
            <h1 className="text-lg font-bold text-foreground">
              {navItems.find(i => i.path === location.pathname)?.label || "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-success" />
            Online
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
