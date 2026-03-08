
-- Enum types
CREATE TYPE public.app_role AS ENUM ('user', 'admin', 'superadmin');
CREATE TYPE public.transaction_type AS ENUM ('deposit', 'send', 'receive', 'withdraw', 'exchange', 'airtime');
CREATE TYPE public.transaction_status AS ENUM ('completed', 'pending', 'failed', 'flagged', 'reversed');
CREATE TYPE public.account_status AS ENUM ('active', 'frozen', 'suspended', 'banned');
CREATE TYPE public.kyc_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'processing');
CREATE TYPE public.ticket_category AS ENUM ('failed_transaction', 'login_issue', 'payment_dispute', 'general', 'account_issue');
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'escalated');
CREATE TYPE public.alert_type AS ENUM ('failed_login', 'failed_pin', 'suspicious_transaction', 'unusual_pattern');
CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.fee_type AS ENUM ('flat', 'percentage', 'tiered');

-- User roles table (must be created before has_role function)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Superadmins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

-- Profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  middle_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  country TEXT NOT NULL DEFAULT 'Kenya',
  country_code TEXT NOT NULL DEFAULT 'KE',
  city TEXT,
  address TEXT,
  avatar_url TEXT,
  status public.account_status NOT NULL DEFAULT 'active',
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  id_front_url TEXT,
  id_back_url TEXT,
  selfie_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Wallets
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_number TEXT NOT NULL UNIQUE,
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  pin_hash TEXT,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  failed_pin_attempts INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Superadmins can update wallets" ON public.wallets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

-- Transactions (Ledger)
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  type public.transaction_type NOT NULL,
  sender_user_id UUID REFERENCES auth.users(id),
  sender_wallet_id UUID REFERENCES public.wallets(id),
  receiver_user_id UUID REFERENCES auth.users(id),
  receiver_wallet_id UUID REFERENCES public.wallets(id),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  fee NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL,
  description TEXT,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  method TEXT,
  provider TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = sender_user_id OR auth.uid() = receiver_user_id);
CREATE POLICY "Users can insert transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = sender_user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Admins can update transactions" ON public.transactions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Virtual Cards
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  expiry TEXT NOT NULL,
  cvv TEXT NOT NULL,
  cardholder_name TEXT NOT NULL,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own card" ON public.virtual_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own card" ON public.virtual_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own card" ON public.virtual_cards FOR UPDATE USING (auth.uid() = user_id);

-- Withdrawal Requests
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  method TEXT NOT NULL,
  destination TEXT NOT NULL,
  status public.withdrawal_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert withdrawals" ON public.withdrawal_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Support Tickets
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category public.ticket_category NOT NULL DEFAULT 'general',
  priority public.ticket_priority NOT NULL DEFAULT 'medium',
  status public.ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Admins can update tickets" ON public.support_tickets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

-- Activity Logs
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target TEXT,
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all logs" ON public.activity_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "System can insert logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Security Alerts
CREATE TABLE public.security_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type public.alert_type NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  severity public.alert_severity NOT NULL DEFAULT 'medium',
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view alerts" ON public.security_alerts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Admins can update alerts" ON public.security_alerts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "System can insert alerts" ON public.security_alerts FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Platform Config
CREATE TABLE public.platform_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read config" ON public.platform_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage config" ON public.platform_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

-- Exchange Rates
CREATE TABLE public.exchange_rates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate NUMERIC(15, 6) NOT NULL,
  margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_currency, to_currency)
);
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read rates" ON public.exchange_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage rates" ON public.exchange_rates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

-- Fee Config
CREATE TABLE public.fee_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  transaction_type public.transaction_type NOT NULL,
  fee_type public.fee_type NOT NULL DEFAULT 'flat',
  flat_amount NUMERIC(15, 2) DEFAULT 0.00,
  percentage NUMERIC(5, 2) DEFAULT 0.00,
  min_amount NUMERIC(15, 2) DEFAULT 0.00,
  max_amount NUMERIC(15, 2),
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fees" ON public.fee_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Superadmins can manage fees" ON public.fee_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

-- Payment Gateways
CREATE TABLE public.payment_gateways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  mode TEXT NOT NULL DEFAULT 'sandbox' CHECK (mode IN ('sandbox', 'production')),
  config JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Superadmins can manage gateways" ON public.payment_gateways FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

-- Generate wallet number function
CREATE OR REPLACE FUNCTION public.generate_wallet_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE wallet_num TEXT;
BEGIN
  wallet_num := 'WLT' || lpad(floor(random() * 9999999999)::text, 10, '0');
  WHILE EXISTS (SELECT 1 FROM public.wallets WHERE wallet_number = wallet_num) LOOP
    wallet_num := 'WLT' || lpad(floor(random() * 9999999999)::text, 10, '0');
  END LOOP;
  RETURN wallet_num;
END; $$;

-- Auto-create profile, wallet, role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE raw_meta JSONB;
BEGIN
  raw_meta := NEW.raw_user_meta_data;
  INSERT INTO public.profiles (user_id, first_name, last_name, email, phone, country, country_code)
  VALUES (NEW.id, COALESCE(raw_meta->>'first_name', ''), COALESCE(raw_meta->>'last_name', ''), NEW.email, COALESCE(raw_meta->>'phone', ''), COALESCE(raw_meta->>'country', 'Kenya'), COALESCE(raw_meta->>'country_code', 'KE'));
  INSERT INTO public.wallets (user_id, wallet_number, currency)
  VALUES (NEW.id, public.generate_wallet_number(), COALESCE(raw_meta->>'currency', 'KES'));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_platform_config_updated_at BEFORE UPDATE ON public.platform_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exchange_rates_updated_at BEFORE UPDATE ON public.exchange_rates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fee_config_updated_at BEFORE UPDATE ON public.fee_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payment_gateways_updated_at BEFORE UPDATE ON public.payment_gateways FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_transactions_sender ON public.transactions(sender_user_id);
CREATE INDEX idx_transactions_receiver ON public.transactions(receiver_user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_wallets_wallet_number ON public.wallets(wallet_number);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_activity_logs_actor ON public.activity_logs(actor_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Seed default config
INSERT INTO public.platform_config (key, value) VALUES
  ('platform_name', '"AbanRemit"'),
  ('default_currency', '"KES"'),
  ('maintenance_mode', 'false'),
  ('wallet_limits', '{"min_balance": 0, "max_balance": 1000000, "daily_transfer_limit": 100000, "daily_withdrawal_limit": 50000}'),
  ('pin_config', '{"length": 4, "max_attempts": 5, "auto_lock": true}');

INSERT INTO public.exchange_rates (from_currency, to_currency, rate, margin_percent) VALUES
  ('KES', 'USD', 0.0077, 1.5), ('KES', 'GBP', 0.0061, 1.5), ('KES', 'EUR', 0.0071, 1.5),
  ('KES', 'NGN', 11.76, 2.0), ('KES', 'UGX', 28.50, 1.0), ('KES', 'TZS', 19.25, 1.0),
  ('USD', 'KES', 129.87, 1.5), ('GBP', 'KES', 164.50, 1.5), ('EUR', 'KES', 140.85, 1.5);

INSERT INTO public.fee_config (name, transaction_type, fee_type, flat_amount, percentage) VALUES
  ('Wallet Transfer Fee', 'send', 'flat', 0, 0),
  ('Withdrawal Fee', 'withdraw', 'percentage', 0, 1.5),
  ('Deposit Fee', 'deposit', 'flat', 0, 0),
  ('Airtime Commission', 'airtime', 'percentage', 0, 2.0),
  ('Exchange Margin', 'exchange', 'percentage', 0, 1.5);

INSERT INTO public.payment_gateways (name, provider, is_enabled, mode) VALUES
  ('Paystack', 'paystack', true, 'sandbox'),
  ('M-Pesa (Daraja)', 'mpesa', true, 'sandbox'),
  ('Bank Transfer', 'bank', false, 'sandbox');

-- KYC storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);
CREATE POLICY "Users can upload own KYC docs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view own KYC docs" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all KYC docs" ON storage.objects FOR SELECT USING (bucket_id = 'kyc-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')));
