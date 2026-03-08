import { Transaction } from "@/components/TransactionItem";

export const mockTransactions: Transaction[] = [
  { id: "1", type: "deposit", amount: 5000, currency: "KES", description: "M-Pesa Deposit", date: "Today, 2:30 PM", status: "completed", reference: "TXN00000001" },
  { id: "2", type: "send", amount: 1200, currency: "KES", description: "Sent to Sarah Ochieng", date: "Today, 11:15 AM", status: "completed", reference: "TXN00000002" },
  { id: "3", type: "receive", amount: 3000, currency: "KES", description: "From David Kimani", date: "Yesterday, 4:45 PM", status: "completed", reference: "TXN00000003" },
  { id: "4", type: "withdraw", amount: 2000, currency: "KES", description: "Bank Withdrawal - Equity", date: "Yesterday, 9:00 AM", status: "pending", reference: "TXN00000004" },
  { id: "5", type: "exchange", amount: 500, currency: "KES", description: "KES → USD Exchange", date: "Mar 5, 3:20 PM", status: "completed", reference: "TXN00000005" },
  { id: "6", type: "deposit", amount: 10000, currency: "KES", description: "Card Deposit - Visa", date: "Mar 4, 1:00 PM", status: "completed", reference: "TXN00000006" },
];

export const mockCard = {
  cardNumber: "4532891056781234",
  expiry: "09/28",
  cvv: "321",
  name: "JAMES MWANGI",
};

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletNumber: string;
  balance: number;
  status: "active" | "frozen" | "suspended";
  kycStatus: "pending" | "approved" | "rejected";
  country: string;
  joined: string;
  lastLogin: string;
  totalTransactions: number;
  idFront?: string;
  idBack?: string;
  selfie?: string;
}

export const mockPlatformUsers: PlatformUser[] = [
  { id: "p1", name: "Alice Wanjiku", email: "alice@mail.com", phone: "+254711222333", walletNumber: "WLT8880002001", balance: 8200, status: "active", kycStatus: "approved", country: "Kenya", joined: "2025-01-12", lastLogin: "Today, 1:00 PM", totalTransactions: 47 },
  { id: "p2", name: "Brian Otieno", email: "brian@mail.com", phone: "+254722333444", walletNumber: "WLT8880002002", balance: 1500, status: "active", kycStatus: "pending", country: "Kenya", joined: "2025-02-04", lastLogin: "Today, 10:15 AM", totalTransactions: 12 },
  { id: "p3", name: "Clara Adesanya", email: "clara@mail.com", phone: "+234801555666", walletNumber: "WLT8880002003", balance: 32000, status: "frozen", kycStatus: "rejected", country: "Nigeria", joined: "2025-01-28", lastLogin: "Mar 5, 9:00 AM", totalTransactions: 89 },
  { id: "p4", name: "Daniel Maina", email: "daniel@mail.com", phone: "+254733444555", walletNumber: "WLT8880002004", balance: 600, status: "active", kycStatus: "pending", country: "Kenya", joined: "2025-03-01", lastLogin: "Yesterday, 6:30 PM", totalTransactions: 3 },
  { id: "p5", name: "Esther Njeri", email: "esther@mail.com", phone: "+254744555666", walletNumber: "WLT8880002005", balance: 19400, status: "active", kycStatus: "approved", country: "Kenya", joined: "2024-12-05", lastLogin: "Today, 11:00 AM", totalTransactions: 156 },
  { id: "p6", name: "Felix Kamau", email: "felix@mail.com", phone: "+254755666777", walletNumber: "WLT8880002006", balance: 4300, status: "active", kycStatus: "approved", country: "Kenya", joined: "2024-11-20", lastLogin: "Today, 3:00 PM", totalTransactions: 78 },
  { id: "p7", name: "Grace Achieng", email: "grace@mail.com", phone: "+254766777888", walletNumber: "WLT8880002007", balance: 11200, status: "suspended", kycStatus: "approved", country: "Kenya", joined: "2024-10-15", lastLogin: "Mar 2, 8:00 AM", totalTransactions: 234 },
  { id: "p8", name: "Hassan Ahmed", email: "hassan@mail.com", phone: "+254777888999", walletNumber: "WLT8880002008", balance: 500, status: "active", kycStatus: "pending", country: "Kenya", joined: "2025-03-05", lastLogin: "Today, 9:45 AM", totalTransactions: 1 },
];

export interface AdminTransaction {
  id: string;
  type: "deposit" | "send" | "withdraw" | "exchange" | "airtime";
  sender: string;
  senderWallet: string;
  receiver: string;
  receiverWallet: string;
  amount: number;
  currency: string;
  status: "completed" | "pending" | "failed" | "flagged";
  method?: string;
  provider?: string;
  date: string;
  reference: string;
}

export const mockAdminTransactions: AdminTransaction[] = [
  { id: "at1", type: "deposit", sender: "M-Pesa", senderWallet: "-", receiver: "Alice Wanjiku", receiverWallet: "WLT8880002001", amount: 5000, currency: "KES", status: "completed", method: "mpesa", provider: "Safaricom", date: "Today, 2:30 PM", reference: "MPE20260308001" },
  { id: "at2", type: "send", sender: "James Mwangi", senderWallet: "WLT8880001023", receiver: "Sarah Ochieng", receiverWallet: "WLT8880001045", amount: 1200, currency: "KES", status: "completed", date: "Today, 11:15 AM", reference: "TRF20260308002" },
  { id: "at3", type: "deposit", sender: "Visa Card", senderWallet: "-", receiver: "Felix Kamau", receiverWallet: "WLT8880002006", amount: 10000, currency: "KES", status: "completed", method: "card", provider: "Paystack", date: "Today, 10:00 AM", reference: "CRD20260308003" },
  { id: "at4", type: "withdraw", sender: "Brian Otieno", senderWallet: "WLT8880002002", receiver: "Equity Bank", receiverWallet: "0123456789", amount: 2000, currency: "KES", status: "pending", method: "bank", date: "Today, 9:45 AM", reference: "WDR20260308004" },
  { id: "at5", type: "airtime", sender: "Alice Wanjiku", senderWallet: "WLT8880002001", receiver: "+254711222333", receiverWallet: "-", amount: 100, currency: "KES", status: "completed", provider: "Safaricom", date: "Today, 8:30 AM", reference: "AIR20260308005" },
  { id: "at6", type: "send", sender: "Esther Njeri", senderWallet: "WLT8880002005", receiver: "Daniel Maina", receiverWallet: "WLT8880002004", amount: 800, currency: "KES", status: "completed", date: "Yesterday, 3:45 PM", reference: "TRF20260307006" },
  { id: "at7", type: "withdraw", sender: "Grace Achieng", senderWallet: "WLT8880002007", receiver: "M-Pesa", receiverWallet: "+254766777888", amount: 15000, currency: "KES", status: "flagged", method: "mobile", date: "Yesterday, 2:00 PM", reference: "WDR20260307007" },
  { id: "at8", type: "deposit", sender: "Bank Transfer", senderWallet: "-", receiver: "Hassan Ahmed", receiverWallet: "WLT8880002008", amount: 500, currency: "KES", status: "pending", method: "bank", provider: "KCB", date: "Yesterday, 11:00 AM", reference: "BNK20260307008" },
  { id: "at9", type: "exchange", sender: "Felix Kamau", senderWallet: "WLT8880002006", receiver: "Felix Kamau", receiverWallet: "WLT8880002006", amount: 5000, currency: "KES", status: "completed", date: "Yesterday, 10:00 AM", reference: "EXC20260307009" },
  { id: "at10", type: "airtime", sender: "Esther Njeri", senderWallet: "WLT8880002005", receiver: "+254744555666", receiverWallet: "-", amount: 500, currency: "KES", status: "completed", provider: "Airtel", date: "Mar 6, 4:00 PM", reference: "AIR20260306010" },
  { id: "at11", type: "deposit", sender: "M-Pesa", senderWallet: "-", receiver: "Clara Adesanya", receiverWallet: "WLT8880002003", amount: 25000, currency: "KES", status: "failed", method: "mpesa", provider: "Safaricom", date: "Mar 6, 1:00 PM", reference: "MPE20260306011" },
  { id: "at12", type: "withdraw", sender: "Alice Wanjiku", senderWallet: "WLT8880002001", receiver: "KCB Bank", receiverWallet: "9876543210", amount: 3000, currency: "KES", status: "completed", method: "bank", date: "Mar 5, 5:00 PM", reference: "WDR20260305012" },
];

export interface WithdrawalRequest {
  id: string;
  userName: string;
  walletNumber: string;
  amount: number;
  currency: string;
  method: "bank" | "mobile";
  destination: string;
  requestDate: string;
  status: "pending" | "approved" | "rejected" | "processing";
}

export const mockWithdrawals: WithdrawalRequest[] = [
  { id: "w1", userName: "Brian Otieno", walletNumber: "WLT8880002002", amount: 2000, currency: "KES", method: "bank", destination: "Equity Bank - 0123456789", requestDate: "Today, 9:45 AM", status: "pending" },
  { id: "w2", userName: "Grace Achieng", walletNumber: "WLT8880002007", amount: 15000, currency: "KES", method: "mobile", destination: "+254766777888", requestDate: "Yesterday, 2:00 PM", status: "pending" },
  { id: "w3", userName: "Alice Wanjiku", walletNumber: "WLT8880002001", amount: 3000, currency: "KES", method: "bank", destination: "KCB Bank - 9876543210", requestDate: "Mar 5, 5:00 PM", status: "approved" },
  { id: "w4", userName: "Esther Njeri", walletNumber: "WLT8880002005", amount: 5000, currency: "KES", method: "mobile", destination: "+254744555666", requestDate: "Mar 4, 11:00 AM", status: "approved" },
  { id: "w5", userName: "Felix Kamau", walletNumber: "WLT8880002006", amount: 1000, currency: "KES", method: "bank", destination: "Co-op Bank - 5554443321", requestDate: "Mar 3, 3:00 PM", status: "rejected" },
];

export interface SupportTicket {
  id: string;
  userName: string;
  userWallet: string;
  subject: string;
  description: string;
  category: "failed_transaction" | "login_issue" | "payment_dispute" | "general" | "account_issue";
  priority: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "escalated";
  createdAt: string;
  updatedAt: string;
}

export const mockSupportTickets: SupportTicket[] = [
  { id: "s1", userName: "Brian Otieno", userWallet: "WLT8880002002", subject: "M-Pesa deposit not reflected", description: "I deposited KES 3,000 via M-Pesa but my wallet balance did not update.", category: "failed_transaction", priority: "high", status: "open", createdAt: "Today, 8:00 AM", updatedAt: "Today, 8:00 AM" },
  { id: "s2", userName: "Clara Adesanya", userWallet: "WLT8880002003", subject: "Cannot login to my account", description: "I'm getting an error when trying to login. Says account is frozen.", category: "login_issue", priority: "medium", status: "open", createdAt: "Yesterday, 4:00 PM", updatedAt: "Yesterday, 4:00 PM" },
  { id: "s3", userName: "Alice Wanjiku", userWallet: "WLT8880002001", subject: "Charged twice for airtime", description: "I was charged twice for a KES 100 airtime purchase but only received one.", category: "payment_dispute", priority: "high", status: "in_progress", createdAt: "Mar 6, 2:00 PM", updatedAt: "Mar 7, 10:00 AM" },
  { id: "s4", userName: "Daniel Maina", userWallet: "WLT8880002004", subject: "How to change wallet PIN", description: "I forgot my wallet PIN and need to reset it.", category: "general", priority: "low", status: "resolved", createdAt: "Mar 5, 11:00 AM", updatedAt: "Mar 5, 2:00 PM" },
  { id: "s5", userName: "Grace Achieng", userWallet: "WLT8880002007", subject: "Unauthorized transaction", description: "There is a KES 15,000 withdrawal I did not make. Please investigate immediately.", category: "payment_dispute", priority: "critical", status: "escalated", createdAt: "Mar 4, 9:00 AM", updatedAt: "Mar 4, 9:30 AM" },
];

export interface ActivityLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  ipAddress: string;
}

export const mockActivityLogs: ActivityLog[] = [
  { id: "l1", adminId: "u2", adminName: "Sarah Ochieng", action: "Approved KYC", target: "Alice Wanjiku (WLT8880002001)", timestamp: "Today, 1:30 PM", ipAddress: "192.168.1.45" },
  { id: "l2", adminId: "u2", adminName: "Sarah Ochieng", action: "Rejected KYC", target: "Clara Adesanya (WLT8880002003)", timestamp: "Today, 11:00 AM", ipAddress: "192.168.1.45" },
  { id: "l3", adminId: "u2", adminName: "Sarah Ochieng", action: "Approved Withdrawal", target: "Alice Wanjiku - KES 3,000 (WDR20260305012)", timestamp: "Mar 5, 5:30 PM", ipAddress: "192.168.1.45" },
  { id: "l4", adminId: "u3", adminName: "David Kimani", action: "Froze Account", target: "Clara Adesanya (WLT8880002003)", timestamp: "Mar 5, 2:00 PM", ipAddress: "10.0.0.12" },
  { id: "l5", adminId: "u2", adminName: "Sarah Ochieng", action: "Reset User PIN", target: "Daniel Maina (WLT8880002004)", timestamp: "Mar 5, 1:00 PM", ipAddress: "192.168.1.45" },
  { id: "l6", adminId: "u3", adminName: "David Kimani", action: "Suspended Account", target: "Grace Achieng (WLT8880002007)", timestamp: "Mar 4, 10:00 AM", ipAddress: "10.0.0.12" },
  { id: "l7", adminId: "u2", adminName: "Sarah Ochieng", action: "Escalated Support Ticket", target: "Ticket #s5 - Grace Achieng", timestamp: "Mar 4, 9:30 AM", ipAddress: "192.168.1.45" },
  { id: "l8", adminId: "u2", adminName: "Sarah Ochieng", action: "Flagged Transaction", target: "WDR20260307007 - KES 15,000", timestamp: "Mar 4, 9:15 AM", ipAddress: "192.168.1.45" },
];

export interface SecurityAlert {
  id: string;
  type: "failed_login" | "failed_pin" | "suspicious_transaction" | "unusual_pattern";
  description: string;
  user: string;
  walletNumber: string;
  severity: "low" | "medium" | "high" | "critical";
  timestamp: string;
  resolved: boolean;
}

export const mockSecurityAlerts: SecurityAlert[] = [
  { id: "sec1", type: "failed_login", description: "5 failed login attempts from IP 41.89.100.23", user: "Clara Adesanya", walletNumber: "WLT8880002003", severity: "high", timestamp: "Today, 3:00 PM", resolved: false },
  { id: "sec2", type: "suspicious_transaction", description: "Withdrawal of KES 15,000 flagged - unusual pattern", user: "Grace Achieng", walletNumber: "WLT8880002007", severity: "critical", timestamp: "Yesterday, 2:00 PM", resolved: false },
  { id: "sec3", type: "failed_pin", description: "3 consecutive failed PIN attempts", user: "Hassan Ahmed", walletNumber: "WLT8880002008", severity: "medium", timestamp: "Today, 10:00 AM", resolved: false },
  { id: "sec4", type: "unusual_pattern", description: "Multiple rapid transactions within 5 minutes", user: "Felix Kamau", walletNumber: "WLT8880002006", severity: "medium", timestamp: "Yesterday, 11:00 AM", resolved: true },
  { id: "sec5", type: "failed_login", description: "Login from new device/location detected", user: "Esther Njeri", walletNumber: "WLT8880002005", severity: "low", timestamp: "Mar 6, 8:00 AM", resolved: true },
];

// Chart data
export const dailyTransactionData = [
  { day: "Mon", deposits: 45000, withdrawals: 23000, transfers: 34000, airtime: 5000 },
  { day: "Tue", deposits: 52000, withdrawals: 31000, transfers: 28000, airtime: 7000 },
  { day: "Wed", deposits: 38000, withdrawals: 18000, transfers: 42000, airtime: 4500 },
  { day: "Thu", deposits: 61000, withdrawals: 35000, transfers: 31000, airtime: 8200 },
  { day: "Fri", deposits: 72000, withdrawals: 42000, transfers: 55000, airtime: 9100 },
  { day: "Sat", deposits: 43000, withdrawals: 28000, transfers: 22000, airtime: 6300 },
  { day: "Sun", deposits: 31000, withdrawals: 15000, transfers: 18000, airtime: 3800 },
];

export const walletActivityData = [
  { month: "Oct", active: 890, new: 45 },
  { month: "Nov", active: 920, new: 62 },
  { month: "Dec", active: 980, new: 78 },
  { month: "Jan", active: 1050, new: 95 },
  { month: "Feb", active: 1120, new: 82 },
  { month: "Mar", active: 1189, new: 58 },
];
