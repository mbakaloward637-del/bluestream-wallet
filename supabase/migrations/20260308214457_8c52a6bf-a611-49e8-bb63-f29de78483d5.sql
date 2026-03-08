
-- Update wallet number generator to use WLT888000XXXX format
CREATE OR REPLACE FUNCTION public.generate_wallet_number()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE wallet_num TEXT;
  seq_num INTEGER;
BEGIN
  -- Get the next sequential number based on existing wallets
  SELECT COALESCE(MAX(
    CASE WHEN wallet_number ~ '^WLT888[0-9]+$' 
    THEN CAST(SUBSTRING(wallet_number FROM 4) AS BIGINT)
    ELSE 0 END
  ), 8880000000) + 1 INTO seq_num
  FROM public.wallets;
  
  -- If somehow below our starting range, start at 8880000001
  IF seq_num < 8880000001 THEN
    seq_num := 8880000001;
  END IF;
  
  wallet_num := 'WLT' || seq_num::text;
  
  -- Safety: ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.wallets WHERE wallet_number = wallet_num) LOOP
    seq_num := seq_num + 1;
    wallet_num := 'WLT' || seq_num::text;
  END LOOP;
  
  RETURN wallet_num;
END;
$function$;
