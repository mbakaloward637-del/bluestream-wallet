/**
 * AbanRemit API Service Layer — Supabase Backend
 * All data flows through Lovable Cloud (Supabase).
 */
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───
export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  walletId: string;
  walletNumber: string;
  walletBalance: number;
  currency: string;
  avatarInitials: string;
  role: "user" | "admin" | "superadmin";
  status: string;
  kycStatus: string;
  kycRejectionReason?: string | null;
  country: string;
  pinSet: boolean;
  createdAt: string;
}

export interface TransferResult {
  success: boolean;
  reference: string;
  amount: number;
  fee: number;
  currency: string;
  recipient_name: string;
  new_balance: number;
  error?: string;
}

export interface RecipientLookup {
  found: boolean;
  name?: string;
  wallet?: string;
  user_id?: string;
  avatar_url?: string;
}

// ─── Helpers ───
function mapProfile(profile: any, wallet: any, role: string): AppUser {
  return {
    id: profile.user_id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    email: profile.email,
    phone: profile.phone || "",
    walletId: wallet?.id || "",
    walletNumber: wallet?.wallet_number || "",
    walletBalance: wallet ? Number(wallet.balance) : 0,
    currency: wallet?.currency || "KES",
    avatarInitials: `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase(),
    role: role as AppUser["role"],
    status: profile.status,
    kycStatus: profile.kyc_status,
    kycRejectionReason: null,
    country: profile.country,
    pinSet: !!wallet?.pin_hash,
    createdAt: profile.created_at,
  };
}

async function getCurrentUser(): Promise<AppUser> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const [profileRes, walletRes, roleRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("wallets").select("*").eq("user_id", user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
  ]);

  if (profileRes.error) throw new Error("Profile not found");
  return mapProfile(profileRes.data, walletRes.data, roleRes.data?.role || "user");
}

// ─── API Object (same interface as before) ───
class SupabaseApiClient {
  // Auth
  auth = {
    register: async (data: {
      email: string; password: string; first_name: string; last_name: string;
      middle_name?: string; phone?: string; country?: string; country_code?: string;
      currency?: string; city?: string; address?: string; gender?: string;
      date_of_birth?: string; pin?: string;
    }) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.first_name,
            last_name: data.last_name,
            phone: data.phone || "",
            country: data.country || "Kenya",
            country_code: data.country_code || "KE",
            currency: data.currency || "KES",
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!authData.user) throw new Error("Registration failed");

      // Wait for trigger to create profile/wallet
      await new Promise((r) => setTimeout(r, 1500));

      // Update profile with additional fields
      const updates: Record<string, any> = {};
      if (data.middle_name) updates.middle_name = data.middle_name;
      if (data.phone) updates.phone = data.phone;
      if (data.gender) updates.gender = data.gender;
      if (data.date_of_birth) updates.date_of_birth = data.date_of_birth;
      if (data.city) updates.city = data.city;
      if (data.address) updates.address = data.address;

      if (Object.keys(updates).length > 0) {
        await supabase.from("profiles").update(updates).eq("user_id", authData.user.id);
      }

      // Set wallet PIN if provided
      if (data.pin) {
        const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", authData.user.id).single();
        if (wallet) {
          await supabase.rpc("set_pin", { _wallet_id: wallet.id, _pin: data.pin });
        }
      }

      const user = await getCurrentUser();
      return { success: true, token: "", user };
    },

    login: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      const user = await getCurrentUser();
      return { success: true, token: "", user };
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    me: () => getCurrentUser(),

    forgotPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw new Error(error.message);
      return { success: true, message: "Reset link sent" };
    },

    resetPassword: async (data: { password: string }) => {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw new Error(error.message);
      return { success: true };
    },

    changePassword: async (password: string) => {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      return { success: true };
    },
  };

  // Wallet
  wallet = {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
      if (error) throw new Error("Wallet not found");
      return data;
    },

    setPin: async (pin: string, current_pin?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: wallet } = await supabase.from("wallets").select("id, pin_hash").eq("user_id", user.id).single();
      if (!wallet) throw new Error("Wallet not found");

      // If PIN already set, verify current PIN
      if (wallet.pin_hash && current_pin) {
        const { data: valid } = await supabase.rpc("verify_pin", { _wallet_id: wallet.id, _pin: current_pin });
        if (!valid) throw new Error("Invalid current PIN");
      }

      await supabase.rpc("set_pin", { _wallet_id: wallet.id, _pin: pin });
      return { success: true };
    },

    verifyPin: async (pin: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", user.id).single();
      if (!wallet) throw new Error("Wallet not found");
      const { data: valid } = await supabase.rpc("verify_pin", { _wallet_id: wallet.id, _pin: pin });
      return { valid: !!valid };
    },
  };

  // Transactions
  transactions = {
    list: async (params?: { limit?: number; page?: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const limit = params?.limit || 50;
      const page = params?.page || 1;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return { data: data || [], total: count || 0 };
    },

    transfer: async (data: { recipient_wallet?: string; recipient_phone?: string; amount: number; pin: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase.rpc("transfer_funds", {
        p_sender_id: user.id,
        p_recipient_wallet: data.recipient_wallet || "",
        p_recipient_phone: data.recipient_phone || "",
        p_amount: data.amount,
        p_pin: data.pin,
      });

      if (error) throw new Error(error.message);
      const res = result as any;
      if (!res.success) throw new Error(res.error || "Transfer failed");
      return res as TransferResult;
    },

    deposit: async (data: { amount: number; method: string; phone?: string }) => {
      // For IntaSend payments, call the edge function
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: result, error } = await supabase.functions.invoke("process-intasend", {
        body: {
          action: data.method === "mpesa" ? "mpesa_stk_push" : "card_payment",
          amount: data.amount,
          phone: data.phone || "",
        },
      });

      if (error) throw new Error(error.message || "Payment failed");
      return result;
    },

    withdraw: async (data: { amount: number; method: string; destination: string; pin: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Verify PIN first
      const { data: wallet } = await supabase.from("wallets").select("id, balance").eq("user_id", user.id).single();
      if (!wallet) throw new Error("Wallet not found");
      if (Number(wallet.balance) < data.amount) throw new Error("Insufficient balance");

      const { data: valid } = await supabase.rpc("verify_pin", { _wallet_id: wallet.id, _pin: data.pin });
      if (!valid) throw new Error("Invalid PIN");

      // Create withdrawal request
      const { error } = await supabase.from("withdrawal_requests").insert({
        user_id: user.id,
        wallet_id: wallet.id,
        amount: data.amount,
        currency: (await supabase.from("wallets").select("currency").eq("user_id", user.id).single()).data?.currency || "KES",
        method: data.method,
        destination: data.destination,
      });

      if (error) throw new Error(error.message);
      return { success: true, message: "Withdrawal request submitted" };
    },

    exchange: async (data: { amount: number; from_currency: string; to_currency: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get rate
      const { data: rate } = await supabase.from("exchange_rates")
        .select("rate, margin_percent")
        .eq("from_currency", data.from_currency)
        .eq("to_currency", data.to_currency)
        .eq("is_active", true)
        .single();

      if (!rate) throw new Error("Exchange rate not available");

      const effectiveRate = Number(rate.rate) * (1 - Number(rate.margin_percent) / 100);
      const converted = data.amount * effectiveRate;

      // Get wallet
      const { data: wallet } = await supabase.from("wallets").select("id, balance, currency").eq("user_id", user.id).single();
      if (!wallet || Number(wallet.balance) < data.amount) throw new Error("Insufficient balance");

      // Deduct and create transaction
      const ref = `EXC${Date.now()}${Math.floor(Math.random() * 9999).toString().padStart(4, "0")}`;
      const newBalance = Number(wallet.balance) - data.amount + converted;

      const { error: updateErr } = await supabase.from("wallets").update({ balance: newBalance }).eq("id", wallet.id);
      if (updateErr) throw new Error("Exchange failed");

      await supabase.from("transactions").insert({
        reference: ref,
        type: "exchange" as any,
        sender_user_id: user.id,
        sender_wallet_id: wallet.id,
        amount: data.amount,
        currency: data.from_currency,
        description: `Exchange ${data.from_currency} ${data.amount} → ${data.to_currency} ${converted.toFixed(2)}`,
        status: "completed" as any,
        method: "exchange",
        metadata: { from: data.from_currency, to: data.to_currency, rate: effectiveRate, converted },
      });

      return { success: true, converted, rate: effectiveRate };
    },
  };

  // M-Pesa (via IntaSend edge function)
  mpesa = {
    stkPush: async (data: { phone: string; amount: number }) => {
      const { data: result, error } = await supabase.functions.invoke("process-intasend", {
        body: { action: "mpesa_stk_push", phone: data.phone, amount: data.amount },
      });
      if (error) throw new Error(error.message || "STK Push failed");
      return result;
    },
    b2c: async (data: { phone: string; amount: number; pin: string }) => {
      const { data: result, error } = await supabase.functions.invoke("process-intasend", {
        body: { action: "mpesa_b2c", phone: data.phone, amount: data.amount, pin: data.pin },
      });
      if (error) throw new Error(error.message || "B2C failed");
      return result;
    },
  };

  // Airtime
  airtime = {
    purchase: async (data: { amount: number; phone: string; network: string }) => {
      const { data: result, error } = await supabase.functions.invoke("process-airtime", {
        body: data,
      });
      if (error) throw new Error(error.message || "Airtime purchase failed");
      return result;
    },
    networks: async () => ["Safaricom", "Airtel", "Telkom"],
  };

  // Statements
  statements = {
    preview: async (from_date: string, to_date: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("transactions")
        .select("*")
        .or(`sender_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`)
        .gte("created_at", from_date)
        .lte("created_at", to_date)
        .order("created_at", { ascending: false });
      return data || [];
    },
    download: async (from_date: string, to_date: string, format: "csv" | "pdf" = "csv") => {
      const transactions = await api.statements.preview(from_date, to_date);
      // Generate CSV client-side
      const headers = "Date,Type,Description,Amount,Currency,Status,Reference\n";
      const rows = transactions.map((tx: any) =>
        `${tx.created_at},${tx.type},${(tx.description || "").replace(/,/g, ";")},${tx.amount},${tx.currency},${tx.status},${tx.reference}`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement_${from_date}_${to_date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { blob, filename: a.download };
    },
  };

  // Recipients
  recipients = {
    lookup: async (lookup_type: "wallet" | "phone", lookup_value: string) => {
      const { data, error } = await supabase.rpc("lookup_recipient", { lookup_type, lookup_value });
      if (error) throw new Error(error.message);
      return data as unknown as RecipientLookup;
    },
  };

  // Notifications
  notifications = {
    list: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    markRead: async (id: string) => {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
      return { success: true };
    },
  };

  // Profile
  profile = {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
      return data;
    },
    update: async (updates: Record<string, string>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user.id);
      if (error) throw new Error(error.message);
      return { success: true };
    },
    uploadKyc: async (formData: FormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const uploads: Record<string, string> = {};
      for (const [key, file] of formData.entries()) {
        if (file instanceof File) {
          const ext = file.name.split(".").pop();
          const path = `${user.id}/${key}_${Date.now()}.${ext}`;
          const { error } = await supabase.storage.from("kyc-documents").upload(path, file);
          if (error) throw new Error(`Upload failed: ${error.message}`);
          const { data: urlData } = supabase.storage.from("kyc-documents").getPublicUrl(path);
          
          if (key === "id_front") uploads.id_front_url = urlData.publicUrl;
          else if (key === "id_back") uploads.id_back_url = urlData.publicUrl;
          else if (key === "selfie") uploads.selfie_url = urlData.publicUrl;
        }
      }

      if (Object.keys(uploads).length > 0) {
        await supabase.from("profiles").update(uploads).eq("user_id", user.id);
      }

      return { success: true };
    },
  };

  // Support Tickets
  support = {
    list: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      return data || [];
    },
    create: async (ticketData: { subject: string; description: string; category?: string; priority?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("support_tickets").insert({
        user_id: user.id,
        subject: ticketData.subject,
        description: ticketData.description,
        category: (ticketData.category || "general") as any,
        priority: (ticketData.priority || "medium") as any,
      }).select().single();
      if (error) throw new Error(error.message);
      return data;
    },
    get: async (id: string) => {
      const { data } = await supabase.from("support_tickets").select("*").eq("id", id).single();
      return data;
    },
  };

  // Exchange Rates (public)
  exchangeRates = {
    list: async () => {
      const { data } = await supabase.from("exchange_rates").select("*").eq("is_active", true);
      return data || [];
    },
  };

  // Fees (public)
  fees = {
    list: async () => {
      const { data } = await supabase.from("fee_config").select("*").eq("is_active", true);
      return data || [];
    },
  };

  // Virtual Cards
  virtualCards = {
    get: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data } = await supabase.from("virtual_cards").select("*").eq("user_id", user.id).maybeSingle();
      return data;
    },
    freeze: async (id: string) => {
      await supabase.from("virtual_cards").update({ is_frozen: true }).eq("id", id);
      return { success: true };
    },
    unfreeze: async (id: string) => {
      await supabase.from("virtual_cards").update({ is_frozen: false }).eq("id", id);
      return { success: true };
    },
  };

  // Admin
  admin = {
    dashboard: async () => {
      const [users, transactions, wallets, withdrawals] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("*", { count: "exact", head: true }),
        supabase.from("wallets").select("balance"),
        supabase.from("withdrawal_requests").select("*", { count: "exact" }).eq("status", "pending"),
      ]);
      const totalBalance = (wallets.data || []).reduce((sum: number, w: any) => sum + Number(w.balance), 0);
      return {
        total_users: users.count || 0,
        total_transactions: transactions.count || 0,
        total_balance: totalBalance,
        pending_withdrawals: withdrawals.count || 0,
      };
    },
    users: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    userDetail: async (id: string) => {
      const [profile, wallet, roles] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", id).single(),
        supabase.from("wallets").select("*").eq("user_id", id).single(),
        supabase.from("user_roles").select("role").eq("user_id", id),
      ]);
      return { ...profile.data, wallet: wallet.data, roles: (roles.data || []).map((r: any) => r.role) };
    },
    updateUserStatus: async (id: string, status: string) => {
      await supabase.from("profiles").update({ status: status as any }).eq("user_id", id);
      return { success: true };
    },
    transactions: async (params?: { limit?: number }) => {
      const { data } = await supabase.from("transactions").select("*").order("created_at", { ascending: false }).limit(params?.limit || 100);
      return data || [];
    },
    reverseTransaction: async (id: string, reason?: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.rpc("reverse_transaction", {
        p_transaction_id: id,
        p_admin_id: user.id,
        p_reason: reason || "Admin reversal",
      });
      if (error) throw new Error(error.message);
      return data;
    },
    withdrawals: async () => {
      const { data } = await supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    updateWithdrawal: async (id: string, status: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("withdrawal_requests").update({
        status: status as any,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", id);
      return { success: true };
    },
    pendingKyc: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("kyc_status", "pending").order("created_at", { ascending: false });
      return data || [];
    },
    allKyc: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    updateKyc: async (userId: string, status: string, reason?: string) => {
      const updates: any = { kyc_status: status };
      await supabase.from("profiles").update(updates).eq("user_id", userId);
      if (status === "rejected" && reason) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "KYC Rejected",
          message: `Your verification was rejected: ${reason}`,
          type: "kyc",
        });
      } else if (status === "approved") {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "KYC Approved",
          message: "Your identity verification has been approved. Your wallet is now fully active!",
          type: "kyc",
        });
      }
      return { success: true };
    },
    sendNotification: async (data: { user_id: string; title: string; message: string; type?: string }) => {
      await supabase.from("notifications").insert({
        user_id: data.user_id,
        title: data.title,
        message: data.message,
        type: data.type || "info",
      });
      return { success: true };
    },
    sendBulkNotification: async (data: { title: string; message: string; type?: string }) => {
      const { data: users } = await supabase.from("profiles").select("user_id");
      if (users) {
        const notifications = users.map((u: any) => ({
          user_id: u.user_id,
          title: data.title,
          message: data.message,
          type: data.type || "info",
        }));
        await supabase.from("notifications").insert(notifications);
      }
      return { success: true };
    },
    activityLogs: async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      return data || [];
    },
    securityAlerts: async () => {
      const { data } = await supabase.from("security_alerts").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    resolveAlert: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("security_alerts").update({ resolved: true, resolved_by: user?.id }).eq("id", id);
      return { success: true };
    },
    supportTickets: async () => {
      const { data } = await supabase.from("support_tickets").select("*").order("created_at", { ascending: false });
      return data || [];
    },
    updateTicket: async (id: string, status: string) => {
      await supabase.from("support_tickets").update({ status: status as any }).eq("id", id);
      return { success: true };
    },
    exchangeRates: {
      list: async () => {
        const { data } = await supabase.from("exchange_rates").select("*").order("updated_at", { ascending: false });
        return data || [];
      },
      create: async (rateData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("exchange_rates").insert({ ...rateData, updated_by: user?.id }).select().single();
        if (error) throw new Error(error.message);
        return data;
      },
      update: async (id: string, rateData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("exchange_rates").update({ ...rateData, updated_by: user?.id }).eq("id", id);
        return { success: true };
      },
      delete: async (id: string) => {
        await supabase.from("exchange_rates").delete().eq("id", id);
        return { success: true };
      },
    },
    fees: {
      list: async () => {
        const { data } = await supabase.from("fee_config").select("*");
        return data || [];
      },
      create: async (feeData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase.from("fee_config").insert({ ...feeData, updated_by: user?.id }).select().single();
        if (error) throw new Error(error.message);
        return data;
      },
      update: async (id: string, feeData: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("fee_config").update({ ...feeData, updated_by: user?.id }).eq("id", id);
        return { success: true };
      },
    },
    paymentGateways: {
      list: async () => {
        const { data } = await supabase.from("payment_gateways").select("*");
        return data || [];
      },
      update: async (id: string, gwData: any) => {
        await supabase.from("payment_gateways").update(gwData).eq("id", id);
        return { success: true };
      },
    },
    platformConfig: {
      get: async (key: string) => {
        const { data } = await supabase.from("platform_config").select("*").eq("key", key).single();
        return data;
      },
      update: async (key: string, value: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        const { data: existing } = await supabase.from("platform_config").select("id").eq("key", key).single();
        if (existing) {
          await supabase.from("platform_config").update({ value, updated_by: user?.id }).eq("key", key);
        } else {
          await supabase.from("platform_config").insert({ key, value, updated_by: user?.id });
        }
        return { success: true };
      },
    },
    roles: {
      get: async (userId: string) => {
        const { data } = await supabase.from("user_roles").select("*").eq("user_id", userId);
        return data || [];
      },
      assign: async (userId: string, role: string) => {
        await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
        return { success: true };
      },
      remove: async (userId: string, role: string) => {
        await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
        return { success: true };
      },
    },
    adminList: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role").in("role", ["admin", "superadmin"]);
      if (!data || data.length === 0) return [];
      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      return (profiles || []).map((p: any) => ({
        ...p,
        role: data.find((r: any) => r.user_id === p.user_id)?.role,
      }));
    },
    flagTransaction: async (id: string) => {
      await supabase.from("transactions").update({ status: "flagged" as any }).eq("id", id);
      return { success: true };
    },
    resetUserPassword: async (_id: string) => ({ success: true, message: "User must reset via email" }),
    resetUserPin: async (id: string) => {
      const { data: wallet } = await supabase.from("wallets").select("id").eq("user_id", id).single();
      if (wallet) {
        await supabase.from("wallets").update({ pin_hash: null, failed_pin_attempts: 0, is_locked: false }).eq("id", wallet.id);
      }
      return { success: true };
    },
    sendBulkSms: async (_data: any) => ({ success: true, message: "SMS not configured" }),
    airtimeTransactions: async () => {
      const { data } = await supabase.from("transactions").select("*").eq("type", "airtime" as any).order("created_at", { ascending: false });
      return data || [];
    },
    virtualCards: async () => {
      const { data } = await supabase.from("virtual_cards").select("*");
      return data || [];
    },
  };
}

export const api = new SupabaseApiClient();
