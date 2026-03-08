import { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "user" | "admin" | "superadmin";

export interface DemoUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  walletNumber: string;
  walletBalance: number;
  currency: string;
  avatarInitials: string;
  role: UserRole;
  pin: string;
  status: "active" | "frozen";
  kycStatus: "pending" | "approved" | "rejected";
  country: string;
  createdAt: string;
}

export const demoUsers: DemoUser[] = [
  {
    id: "u1",
    firstName: "James",
    lastName: "Mwangi",
    email: "user@demo.com",
    phone: "+254712345678",
    walletNumber: "WLT8880001023",
    walletBalance: 12450.75,
    currency: "KES",
    avatarInitials: "JM",
    role: "user",
    pin: "1234",
    status: "active",
    kycStatus: "approved",
    country: "Kenya",
    createdAt: "2024-11-15",
  },
  {
    id: "u2",
    firstName: "Sarah",
    lastName: "Ochieng",
    email: "admin@demo.com",
    phone: "+254798765432",
    walletNumber: "WLT8880001045",
    walletBalance: 45200.0,
    currency: "KES",
    avatarInitials: "SO",
    role: "admin",
    pin: "5678",
    status: "active",
    kycStatus: "approved",
    country: "Kenya",
    createdAt: "2024-08-20",
  },
  {
    id: "u3",
    firstName: "David",
    lastName: "Kimani",
    email: "super@demo.com",
    phone: "+254700112233",
    walletNumber: "WLT8880001001",
    walletBalance: 150000.0,
    currency: "KES",
    avatarInitials: "DK",
    role: "superadmin",
    pin: "0000",
    status: "active",
    kycStatus: "approved",
    country: "Kenya",
    createdAt: "2024-01-10",
  },
];

interface AuthContextType {
  user: DemoUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<DemoUser | null>(null);

  const login = (email: string, _password: string): boolean => {
    const found = demoUsers.find((u) => u.email === email);
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.role === "admin" || user?.role === "superadmin",
        isSuperAdmin: user?.role === "superadmin",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
