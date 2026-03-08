import { Transaction } from "@/components/TransactionItem";
import { DemoUser } from "@/context/AuthContext";

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: 5000,
    currency: "KES",
    description: "M-Pesa Deposit",
    date: "Today, 2:30 PM",
    status: "completed",
  },
  {
    id: "2",
    type: "send",
    amount: 1200,
    currency: "KES",
    description: "Sent to Sarah Ochieng",
    date: "Today, 11:15 AM",
    status: "completed",
  },
  {
    id: "3",
    type: "receive",
    amount: 3000,
    currency: "KES",
    description: "From David Kimani",
    date: "Yesterday, 4:45 PM",
    status: "completed",
  },
  {
    id: "4",
    type: "withdraw",
    amount: 2000,
    currency: "KES",
    description: "Bank Withdrawal - Equity",
    date: "Yesterday, 9:00 AM",
    status: "pending",
  },
  {
    id: "5",
    type: "exchange",
    amount: 500,
    currency: "KES",
    description: "KES → USD Exchange",
    date: "Mar 5, 3:20 PM",
    status: "completed",
  },
  {
    id: "6",
    type: "deposit",
    amount: 10000,
    currency: "KES",
    description: "Card Deposit - Visa",
    date: "Mar 4, 1:00 PM",
    status: "completed",
  },
];

export const mockCard = {
  cardNumber: "4532891056781234",
  expiry: "09/28",
  cvv: "321",
  name: "JAMES MWANGI",
};

// Additional mock users for admin panel display (non-demo, simulated platform users)
export const mockPlatformUsers: Array<{
  id: string;
  name: string;
  email: string;
  walletNumber: string;
  balance: number;
  status: "active" | "frozen";
  kycStatus: "pending" | "approved" | "rejected";
  country: string;
  joined: string;
}> = [
  { id: "p1", name: "Alice Wanjiku", email: "alice@mail.com", walletNumber: "WLT8880002001", balance: 8200, status: "active", kycStatus: "approved", country: "Kenya", joined: "2025-01-12" },
  { id: "p2", name: "Brian Otieno", email: "brian@mail.com", walletNumber: "WLT8880002002", balance: 1500, status: "active", kycStatus: "pending", country: "Kenya", joined: "2025-02-04" },
  { id: "p3", name: "Clara Adesanya", email: "clara@mail.com", walletNumber: "WLT8880002003", balance: 32000, status: "frozen", kycStatus: "rejected", country: "Nigeria", joined: "2025-01-28" },
  { id: "p4", name: "Daniel Maina", email: "daniel@mail.com", walletNumber: "WLT8880002004", balance: 600, status: "active", kycStatus: "pending", country: "Kenya", joined: "2025-03-01" },
  { id: "p5", name: "Esther Njeri", email: "esther@mail.com", walletNumber: "WLT8880002005", balance: 19400, status: "active", kycStatus: "approved", country: "Kenya", joined: "2024-12-05" },
];
