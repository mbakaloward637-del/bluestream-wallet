import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SendMoney from "./pages/SendMoney";
import LoadWallet from "./pages/LoadWallet";
import Transactions from "./pages/Transactions";
import CardPage from "./pages/CardPage";
import Exchange from "./pages/Exchange";
import Withdraw from "./pages/Withdraw";
import AdminPanel from "./pages/AdminPanel";
import BuyAirtime from "./pages/BuyAirtime";
import StatementDownload from "./pages/StatementDownload";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/send" element={<SendMoney />} />
            <Route path="/load" element={<LoadWallet />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/card" element={<CardPage />} />
            <Route path="/exchange" element={<Exchange />} />
            <Route path="/withdraw" element={<Withdraw />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
