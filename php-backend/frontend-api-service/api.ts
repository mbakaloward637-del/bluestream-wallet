/**
 * AbanRemit API Service Layer
 * 
 * Drop-in replacement for Supabase client calls.
 * Configure API_BASE_URL to point to your PHP backend.
 * 
 * Usage:
 *   import { api } from '@/services/api';
 *   const user = await api.auth.login(email, password);
 *   const transactions = await api.transactions.list();
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://abanremit.com/api/v1';

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(method: string, path: string, body?: any, isFormData = false): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    // Handle file downloads (CSV)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/csv')) {
      const blob = await res.blob();
      return { blob, filename: this.extractFilename(res) } as any;
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
    return data;
  }

  private extractFilename(res: Response): string {
    const disposition = res.headers.get('content-disposition') || '';
    const match = disposition.match(/filename=(.+)/);
    return match ? match[1] : 'statement.csv';
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
      const res = await this.request<{ success: boolean; token: string; user: any }>('POST', '/auth/register', data);
      this.setToken(res.token);
      return res;
    },

    login: async (email: string, password: string) => {
      const res = await this.request<{ success: boolean; token: string; user: any }>('POST', '/auth/login', { email, password });
      this.setToken(res.token);
      return res;
    },

    logout: async () => {
      try { await this.request('POST', '/auth/logout'); } catch {}
      this.setToken(null);
    },

    me: () => this.request<any>('GET', '/auth/me'),
    forgotPassword: (email: string) => this.request('POST', '/auth/forgot-password', { email }),
    resetPassword: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
      this.request('POST', '/auth/reset-password', data),
    changePassword: (password: string) => this.request('PUT', '/auth/change-password', { password }),
  };

  // ─── WALLET ───
  wallet = {
    get: () => this.request<any>('GET', '/wallet'),
    setPin: (pin: string, current_pin?: string) => this.request('POST', '/wallet/set-pin', { pin, current_pin }),
    verifyPin: (pin: string) => this.request<{ valid: boolean }>('POST', '/wallet/verify-pin', { pin }),
  };

  // ─── TRANSACTIONS ───
  transactions = {
    list: (params?: { limit?: number; page?: number }) =>
      this.request<any>('GET', `/transactions?limit=${params?.limit || 50}&page=${params?.page || 1}`),

    transfer: (data: { recipient_wallet?: string; recipient_phone?: string; amount: number; pin: string }) =>
      this.request<any>('POST', '/transactions/transfer', data),

    deposit: (data: { amount: number; method: 'card' | 'mpesa' | 'bank' }) =>
      this.request<any>('POST', '/transactions/deposit', data),

    withdraw: (data: { amount: number; method: string; destination: string; pin: string }) =>
      this.request<any>('POST', '/transactions/withdraw', data),

    exchange: (data: { amount: number; from_currency: string; to_currency: string }) =>
      this.request<any>('POST', '/transactions/exchange', data),
  };

  // ─── AIRTIME ───
  airtime = {
    purchase: (data: { amount: number; phone: string; network: 'Safaricom' | 'Airtel' | 'Telkom' }) =>
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
      // Auto-download the file
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
      this.request<any>('POST', '/recipients/lookup', { lookup_type, lookup_value }),
  };

  // ─── NOTIFICATIONS ───
  notifications = {
    list: () => this.request<any[]>('GET', '/notifications'),
    markRead: (id: string) => this.request('PUT', `/notifications/${id}/read`),
  };

  // ─── PROFILE ───
  profile = {
    get: () => this.request<any>('GET', '/profile'),
    update: (data: Record<string, string>) => this.request('PUT', '/profile', data),
    uploadKyc: (formData: FormData) => this.request('POST', '/profile/kyc', formData, true),
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
    updateUserStatus: (id: string, status: string) => this.request('PUT', `/admin/users/${id}/status`, { status }),
    resetUserPassword: (id: string) => this.request('POST', `/admin/users/${id}/reset-password`),
    resetUserPin: (id: string) => this.request('POST', `/admin/users/${id}/reset-pin`),
    transactions: () => this.request<any[]>('GET', '/admin/transactions'),
    flagTransaction: (id: string) => this.request('POST', `/admin/transactions/${id}/flag`),
    reverseTransaction: (id: string, reason?: string) =>
      this.request('POST', `/admin/transactions/${id}/reverse`, { reason }),
    withdrawals: () => this.request<any[]>('GET', '/admin/withdrawals'),
    updateWithdrawal: (id: string, status: string) => this.request('PUT', `/admin/withdrawals/${id}`, { status }),
    pendingKyc: () => this.request<any[]>('GET', '/admin/kyc'),
    updateKyc: (id: string, status: string) => this.request('PUT', `/admin/kyc/${id}`, { status }),
    sendNotification: (data: { user_id: string; title: string; message: string; type?: string }) =>
      this.request('POST', '/admin/notifications', data),
    sendBulkNotification: (data: { title: string; message: string; type?: string; filter?: string; country?: string }) =>
      this.request('POST', '/admin/notifications/bulk', data),
    sendBulkSms: (data: { message: string; filter?: string; country?: string; phone_numbers?: string[] }) =>
      this.request('POST', '/admin/sms/bulk', data),
    activityLogs: () => this.request<any[]>('GET', '/admin/logs'),
    securityAlerts: () => this.request<any[]>('GET', '/admin/security-alerts'),
    resolveAlert: (id: string) => this.request('PUT', `/admin/security-alerts/${id}`),
    supportTickets: () => this.request<any[]>('GET', '/admin/support-tickets'),
    updateTicket: (id: string, status: string) => this.request('PUT', `/admin/support-tickets/${id}`, { status }),

    // Super Admin
    exchangeRates: {
      list: () => this.request<any[]>('GET', '/admin/exchange-rates'),
      create: (data: any) => this.request('POST', '/admin/exchange-rates', data),
      update: (id: string, data: any) => this.request('PUT', `/admin/exchange-rates/${id}`, data),
      delete: (id: string) => this.request('DELETE', `/admin/exchange-rates/${id}`),
    },
    fees: {
      list: () => this.request<any[]>('GET', '/admin/fees'),
      create: (data: any) => this.request('POST', '/admin/fees', data),
      update: (id: string, data: any) => this.request('PUT', `/admin/fees/${id}`, data),
    },
    paymentGateways: {
      list: () => this.request<any[]>('GET', '/admin/payment-gateways'),
      update: (id: string, data: any) => this.request('PUT', `/admin/payment-gateways/${id}`, data),
    },
    platformConfig: {
      list: () => this.request<any[]>('GET', '/admin/platform-config'),
      update: (key: string, value: any) => this.request('PUT', '/admin/platform-config', { key, value }),
    },
    roles: {
      get: (userId: string) => this.request<any[]>('GET', `/admin/roles/${userId}`),
      assign: (userId: string, role: string) => this.request('POST', '/admin/roles', { user_id: userId, role }),
      remove: (id: string) => this.request('DELETE', `/admin/roles/${id}`),
    },
  };
}

export const api = new ApiClient();
