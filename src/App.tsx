import { Toaster } from "@/components/ui/toaster";
import InstallPWA from "@/components/InstallPWA";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import SendMoney from "./pages/SendMoney";
import LoadWallet from "./pages/LoadWallet";
import Transactions from "./pages/Transactions";
import CardPage from "./pages/CardPage";
import Exchange from "./pages/Exchange";
import Withdraw from "./pages/Withdraw";
import BuyAirtime from "./pages/BuyAirtime";
import StatementDownload from "./pages/StatementDownload";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminKYC from "./pages/admin/AdminKYC";
import AdminTransactions from "./pages/admin/AdminTransactions";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminAirtime from "./pages/admin/AdminAirtime";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminSecurity from "./pages/admin/AdminSecurity";
import AdminLogs from "./pages/admin/AdminLogs";

// Super Admin pages
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import SuperAdminManagement from "./pages/admin/SuperAdminManagement";
import SuperAdminWalletConfig from "./pages/admin/SuperAdminWalletConfig";
import SuperAdminPaymentGateway from "./pages/admin/SuperAdminPaymentGateway";
import SuperAdminExchangeRates from "./pages/admin/SuperAdminExchangeRates";
import SuperAdminFees from "./pages/admin/SuperAdminFees";
import SuperAdminSettings from "./pages/admin/SuperAdminSettings";
import SuperAdminAuditLogs from "./pages/admin/SuperAdminAuditLogs";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPWA />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected user routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/send" element={<ProtectedRoute><SendMoney /></ProtectedRoute>} />
            <Route path="/load" element={<ProtectedRoute><LoadWallet /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/card" element={<ProtectedRoute><CardPage /></ProtectedRoute>} />
            <Route path="/exchange" element={<ProtectedRoute><Exchange /></ProtectedRoute>} />
            <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
            <Route path="/buy-airtime" element={<ProtectedRoute><BuyAirtime /></ProtectedRoute>} />
            <Route path="/statement" element={<ProtectedRoute><StatementDownload /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="kyc" element={<AdminKYC />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="withdrawals" element={<AdminWithdrawals />} />
              <Route path="airtime" element={<AdminAirtime />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="security" element={<AdminSecurity />} />
              <Route path="logs" element={<AdminLogs />} />

              {/* Super Admin exclusive routes */}
              <Route path="super-dashboard" element={<SuperAdminDashboard />} />
              <Route path="admin-management" element={<SuperAdminManagement />} />
              <Route path="wallet-config" element={<SuperAdminWalletConfig />} />
              <Route path="payment-gateways" element={<SuperAdminPaymentGateway />} />
              <Route path="exchange-rates" element={<SuperAdminExchangeRates />} />
              <Route path="fees" element={<SuperAdminFees />} />
              <Route path="settings" element={<SuperAdminSettings />} />
              <Route path="audit-logs" element={<SuperAdminAuditLogs />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
