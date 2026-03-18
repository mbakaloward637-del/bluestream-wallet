/**
 * AbanRemit API Service Layer
 * 
 * Drop-in replacement for Supabase client calls.
 * Import: import { api } from '@/services/api';
 * 
 * For production, set VITE_API_BASE_URL=https://abanremit.com/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ─── Types ───
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
  role: 'user' | 'admin' | 'superadmin';
  status: string;
  kycStatus: string;
  kycRejectionReason?: string | null;
  country: string;
  pinSet?: boolean;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: AppUser;
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

class ApiClient {
  private token: string | null = null;
  private _onAuthChange: ((user: AppUser | null) => void) | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  onAuthStateChange(cb: (user: AppUser | null) => void) {
    this._onAuthChange = cb;
  }

  private async request<T>(method: string, path: string, body?: any, isFormData = false): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    // Handle file downloads (CSV)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv') || contentType.includes('application/octet-stream')) {
      const blob = await res.blob();
      return { blob, filename: this.extractFilename(res) } as any;
    }

    const data = await res.json();

    // Handle 401 - token expired
    if (res.status === 401) {
      this.setToken(null);
      this._onAuthChange?.(null);
      throw new Error(data.error || 'Session expired. Please login again.');
    }

    if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
    return data;
  }

  private extractFilename(res: Response): string {
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    return match ? match[1].replace(/['"]/g, '') : 'statement.csv';
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }

  getToken() { return this.token; }
  isAuthenticated() { return !!this.token; }

  // ─── AUTH ───
  auth = {
    register: async (data: {
      email: string; password: string; first_name: string; last_name: string;
      middle_name?: string; phone?: string; country?: string; country_code?: string;
      currency?: string; city?: string; address?: string; gender?: string;
      date_of_birth?: string; pin?: string;
    }) => {
      const res = await this.request<AuthResponse>('POST', '/auth/register', data);
      this.setToken(res.token);
      return res;
    },

    login: async (email: string, password: string) => {
      const res = await this.request<AuthResponse>('POST', '/auth/login', { email, password });
      this.setToken(res.token);
      return res;
    },

    logout: async () => {
      try { await this.request('POST', '/auth/logout'); } catch {}
      this.setToken(null);
    },

    me: () => this.request<AppUser>('GET', '/auth/me'),
    forgotPassword: (email: string) => this.request<{ success: boolean; message: string }>('POST', '/auth/forgot-password', { email }),
    resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
      this.request<{ success: boolean }>('POST', '/auth/reset-password', data),
    changePassword: (password: string) => this.request<{ success: boolean }>('PUT', '/auth/change-password', { password }),
  };

  // ─── WALLET ───
  wallet = {
    get: () => this.request<any>('GET', '/wallet'),
    setPin: (pin: string, current_pin?: string) => this.request<{ success: boolean }>('POST', '/wallet/set-pin', { pin, current_pin }),
    verifyPin: (pin: string) => this.request<{ valid: boolean }>('POST', '/wallet/verify-pin', { pin }),
  };

  // ─── TRANSACTIONS ───
  transactions = {
    list: (params?: { limit?: number; page?: number }) =>
      this.request<{ data: any[]; total?: number }>('GET', `/transactions?limit=${params?.limit || 50}&page=${params?.page || 1}`),

    transfer: (data: { recipient_wallet?: string; recipient_phone?: string; amount: number; pin: string }) =>
      this.request<TransferResult>('POST', '/transactions/transfer', data),

    deposit: (data: { amount: number; method: 'card' | 'mpesa' | 'bank'; phone?: string }) =>
      this.request<any>('POST', '/transactions/deposit', data),

    withdraw: (data: { amount: number; method: string; destination: string; pin: string }) =>
      this.request<any>('POST', '/transactions/withdraw', data),

    exchange: (data: { amount: number; from_currency: string; to_currency: string }) =>
      this.request<any>('POST', '/transactions/exchange', data),
  };

  // ─── AIRTIME ───
  airtime = {
    purchase: (data: { amount: number; phone: string; network: string }) =>
      this.request<any>('POST', '/airtime/purchase', data),
    networks: () => this.request<any[]>('GET', '/airtime/networks'),
  };

  // ─── M-PESA ───
  mpesa = {
    stkPush: (data: { phone: string; amount: number }) =>
      this.request<any>('POST', '/mpesa/stk-push', data),
    b2c: (data: { phone: string; amount: number; pin: string }) =>
      this.request<any>('POST', '/mpesa/b2c', data),
  };

  // ─── STATEMENTS ───
  statements = {
    preview: (from_date: string, to_date: string) =>
      this.request<any>('GET', `/statements/preview?from_date=${from_date}&to_date=${to_date}`),
    download: async (from_date: string, to_date: string, format: 'csv' | 'pdf' = 'csv') => {
      const result = await this.request<{ blob: Blob; filename: string }>('POST', '/statements/download', { from_date, to_date, format });
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return result;
    },
  };

  // ─── RECIPIENTS ───
  recipients = {
    lookup: (lookup_type: 'wallet' | 'phone', lookup_value: string) =>
      this.request<RecipientLookup>('POST', '/recipients/lookup', { lookup_type, lookup_value }),
  };

  // ─── NOTIFICATIONS ───
  notifications = {
    list: () => this.request<any[]>('GET', '/notifications'),
    markRead: (id: string) => this.request<{ success: boolean }>('PUT', `/notifications/${id}/read`),
  };

  // ─── PROFILE ───
  profile = {
    get: () => this.request<any>('GET', '/profile'),
    update: (data: Record<string, string>) => this.request<any>('PUT', '/profile', data),
    uploadKyc: (formData: FormData) => this.request<{ success: boolean }>('POST', '/profile/kyc', formData, true),
  };

  // ─── SUPPORT TICKETS ───
  support = {
    list: () => this.request<any[]>('GET', '/support-tickets'),
    create: (data: { subject: string; description: string; category?: string; priority?: string }) =>
      this.request<any>('POST', '/support-tickets', data),
    get: (id: string) => this.request<any>('GET', `/support-tickets/${id}`),
  };

  // ─── PUBLIC DATA ───
  exchangeRates = {
    list: () => this.request<any[]>('GET', '/exchange-rates'),
  };

  fees = {
    list: () => this.request<any[]>('GET', '/fees'),
  };

  // ─── ADMIN ───
  admin = {
    dashboard: () => this.request<any>('GET', '/admin/dashboard'),
    users: () => this.request<any[]>('GET', '/admin/users'),
    userDetail: (id: string) => this.request<any>('GET', `/admin/users/${id}`),
    updateUserStatus: (id: string, status: string) => this.request<any>('PUT', `/admin/users/${id}/status`, { status }),
    resetUserPassword: (id: string) => this.request<any>('POST', `/admin/users/${id}/reset-password`),
    resetUserPin: (id: string) => this.request<any>('POST', `/admin/users/${id}/reset-pin`),
    transactions: (params?: { limit?: number }) => this.request<any[]>('GET', `/admin/transactions?limit=${params?.limit || 100}`),
    flagTransaction: (id: string) => this.request<any>('POST', `/admin/transactions/${id}/flag`),
    reverseTransaction: (id: string, reason?: string) =>
      this.request<any>('POST', `/admin/transactions/${id}/reverse`, { reason }),
    withdrawals: () => this.request<any[]>('GET', '/admin/withdrawals'),
    updateWithdrawal: (id: string, status: string) => this.request<any>('PUT', `/admin/withdrawals/${id}`, { status }),
    pendingKyc: () => this.request<any[]>('GET', '/admin/kyc'),
    allKyc: () => this.request<any[]>('GET', '/admin/kyc/all'),
    updateKyc: (id: string, status: string) => this.request<any>('PUT', `/admin/kyc/${id}`, { status }),
    sendNotification: (data: { user_id: string; title: string; message: string; type?: string }) =>
      this.request<any>('POST', '/admin/notifications', data),
    sendBulkNotification: (data: { title: string; message: string; type?: string; channels?: string[] }) =>
      this.request<any>('POST', '/admin/notifications/bulk', data),
    sendBulkSms: (data: { message: string; filter?: string; country?: string; phone_numbers?: string[] }) =>
      this.request<any>('POST', '/admin/sms/bulk', data),
    activityLogs: () => this.request<any[]>('GET', '/admin/logs'),
    securityAlerts: () => this.request<any[]>('GET', '/admin/security-alerts'),
    resolveAlert: (id: string) => this.request<any>('PUT', `/admin/security-alerts/${id}`),
    supportTickets: () => this.request<any[]>('GET', '/admin/support-tickets'),
    updateTicket: (id: string, status: string) => this.request<any>('PUT', `/admin/support-tickets/${id}`, { status }),
    airtimeTransactions: () => this.request<any[]>('GET', '/admin/airtime'),

    // Super Admin
    exchangeRates: {
      list: () => this.request<any[]>('GET', '/admin/exchange-rates'),
      create: (data: any) => this.request<any>('POST', '/admin/exchange-rates', data),
      update: (id: string, data: any) => this.request<any>('PUT', `/admin/exchange-rates/${id}`, data),
      delete: (id: string) => this.request<any>('DELETE', `/admin/exchange-rates/${id}`),
    },
    fees: {
      list: () => this.request<any[]>('GET', '/admin/fees'),
      create: (data: any) => this.request<any>('POST', '/admin/fees', data),
      update: (id: string, data: any) => this.request<any>('PUT', `/admin/fees/${id}`, data),
    },
    paymentGateways: {
      list: () => this.request<any[]>('GET', '/admin/payment-gateways'),
      update: (id: string, data: any) => this.request<any>('PUT', `/admin/payment-gateways/${id}`, data),
    },
    platformConfig: {
      get: (key: string) => this.request<any>('GET', `/admin/platform-config/${key}`),
      update: (key: string, value: any) => this.request<any>('PUT', '/admin/platform-config', { key, value }),
    },
    roles: {
      get: (userId: string) => this.request<any[]>('GET', `/admin/roles/${userId}`),
      assign: (userId: string, role: string) => this.request<any>('POST', '/admin/roles', { user_id: userId, role }),
      remove: (userId: string, role: string) => this.request<any>('DELETE', `/admin/roles/${userId}/${role}`),
    },
    adminList: () => this.request<any[]>('GET', '/admin/admins'),
    virtualCards: () => this.request<any[]>('GET', '/admin/virtual-cards'),
  };

  // ─── VIRTUAL CARDS ───
  virtualCards = {
    get: () => this.request<any>('GET', '/virtual-cards/my'),
    freeze: (id: string) => this.request<any>('POST', `/virtual-cards/${id}/freeze`),
    unfreeze: (id: string) => this.request<any>('POST', `/virtual-cards/${id}/unfreeze`),
  };
}

export const api = new ApiClient();
