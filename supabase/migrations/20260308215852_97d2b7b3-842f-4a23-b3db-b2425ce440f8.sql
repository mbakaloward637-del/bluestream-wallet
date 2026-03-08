-- Enable realtime on wallets and transactions tables for instant balance/tx updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;