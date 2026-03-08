import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type UserRole = "user" | "admin" | "superadmin";

export interface AppUser {
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
  status: string;
  kycStatus: string;
  country: string;
  createdAt: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, metadata: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);

  const fetchUserData = async (authUser: User) => {
    try {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      // Fetch wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", authUser.id)
        .single();

      // Fetch roles
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      const roleList = (userRoles || []).map((r) => r.role as UserRole);
      setRoles(roleList);

      const highestRole: UserRole = roleList.includes("superadmin")
        ? "superadmin"
        : roleList.includes("admin")
        ? "admin"
        : "user";

      if (profile && wallet) {
        const initials = `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase();
        setUser({
          id: authUser.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          email: profile.email,
          phone: profile.phone || "",
          walletNumber: wallet.wallet_number,
          walletBalance: Number(wallet.balance),
          currency: wallet.currency,
          avatarInitials: initials || "??",
          role: highestRole,
          status: profile.status,
          kycStatus: profile.kyc_status,
          country: profile.country,
          createdAt: profile.created_at,
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(() => fetchUserData(newSession.user), 0);
        } else {
          setUser(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        fetchUserData(existingSession.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return !error;
  };

  const register = async (
    email: string,
    password: string,
    metadata: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  };

  const refreshUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) await fetchUserData(authUser);
  };

  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  const isSuperAdmin = roles.includes("superadmin");

  return (
    <AuthContext.Provider
      value={{ user, session, loading, login, register, logout, refreshUser, isAdmin, isSuperAdmin }}
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
