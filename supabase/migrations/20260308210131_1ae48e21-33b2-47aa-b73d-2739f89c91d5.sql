
-- Fix function search path
ALTER FUNCTION public.generate_wallet_number() SET search_path = public;

-- Fix permissive RLS policies - restrict INSERT on activity_logs, security_alerts, notifications to admins or self
DROP POLICY "System can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated can insert own logs" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

DROP POLICY "System can insert alerts" ON public.security_alerts;
CREATE POLICY "Admins can insert alerts" ON public.security_alerts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));

DROP POLICY "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin') OR auth.uid() = user_id);
