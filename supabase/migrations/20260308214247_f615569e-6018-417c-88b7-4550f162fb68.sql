
-- Allow superadmins to delete exchange rates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmins can delete rates' AND tablename = 'exchange_rates') THEN
    CREATE POLICY "Superadmins can delete rates" ON public.exchange_rates
    FOR DELETE TO authenticated
    USING (public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;

-- Allow superadmins to insert exchange rates
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmins can insert rates' AND tablename = 'exchange_rates') THEN
    CREATE POLICY "Superadmins can insert rates" ON public.exchange_rates
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;

-- Allow superadmins to insert fee config
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmins can insert fees' AND tablename = 'fee_config') THEN
    CREATE POLICY "Superadmins can insert fees" ON public.fee_config
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;

-- Allow superadmins to insert platform config
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Superadmins can insert config' AND tablename = 'platform_config') THEN
    CREATE POLICY "Superadmins can insert config" ON public.platform_config
    FOR INSERT TO authenticated
    WITH CHECK (public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;

-- Ensure notifications can be inserted by system (via SECURITY DEFINER functions)
-- The transfer_funds function already handles this
