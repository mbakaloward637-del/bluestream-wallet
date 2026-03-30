import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/services/api";
import type { AppUser } from "@/services/api";

export type UserRole = "user" | "admin" | "superadmin";
export type { AppUser };

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, metadata: Record<string, string>) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        setLoading(false);
        return;
      }
      const userData = await api.auth.me();
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Set up auth listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // Defer to avoid deadlocks with Supabase auth
        setTimeout(() => fetchUser(), 100);
      }
      if (event === "PASSWORD_RECOVERY") {
        // User clicked reset link — they'll be on /reset-password
      }
    });

    fetchUser();
    return () => subscription.unsubscribe();
  }, [fetchUser]);

  // Poll for balance updates every 30s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await api.auth.me();
        setUser(fresh);
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.auth.login(email, password);
      setUser(res.user);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    metadata: Record<string, string>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await api.auth.register({
        email,
        password,
        first_name: metadata.first_name || "",
        last_name: metadata.last_name || "",
        middle_name: metadata.middle_name,
        phone: metadata.phone,
        country: metadata.country,
        country_code: metadata.country_code,
        currency: metadata.currency,
        city: metadata.city,
        address: metadata.address,
        gender: metadata.gender,
        date_of_birth: metadata.date_of_birth,
        pin: metadata.pin,
      });
      setUser(res.user);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.auth.me();
      setUser(userData);
    } catch {}
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const isSuperAdmin = user?.role === "superadmin";

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAdmin, isSuperAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
