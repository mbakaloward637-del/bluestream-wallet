
-- Admin view all KYC docs (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all KYC docs' AND tablename = 'objects') THEN
    CREATE POLICY "Admins can view all KYC docs" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'kyc-documents' AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin')));
  END IF;
END $$;

-- Admin update profiles (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update profiles' AND tablename = 'profiles') THEN
    CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'));
  END IF;
END $$;
