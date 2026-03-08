
-- Function to lookup recipient by wallet number or phone (bypasses RLS)
CREATE OR REPLACE FUNCTION public.lookup_recipient(lookup_type text, lookup_value text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
  found_user_id uuid;
  found_name text;
  found_wallet text;
BEGIN
  IF lookup_type = 'wallet' THEN
    SELECT w.user_id, w.wallet_number INTO found_user_id, found_wallet
    FROM wallets w WHERE w.wallet_number = lookup_value;
    
    IF found_user_id IS NULL THEN
      RETURN jsonb_build_object('found', false);
    END IF;
    
    SELECT p.first_name || ' ' || p.last_name INTO found_name
    FROM profiles p WHERE p.user_id = found_user_id;
    
    RETURN jsonb_build_object('found', true, 'name', found_name, 'wallet', found_wallet, 'user_id', found_user_id);
    
  ELSIF lookup_type = 'phone' THEN
    SELECT p.user_id, p.first_name || ' ' || p.last_name INTO found_user_id, found_name
    FROM profiles p WHERE p.phone = lookup_value;
    
    IF found_user_id IS NULL THEN
      RETURN jsonb_build_object('found', false);
    END IF;
    
    SELECT w.wallet_number INTO found_wallet
    FROM wallets w WHERE w.user_id = found_user_id;
    
    RETURN jsonb_build_object('found', true, 'name', found_name, 'wallet', found_wallet, 'user_id', found_user_id);
  ELSE
    RETURN jsonb_build_object('found', false, 'error', 'Invalid lookup type');
  END IF;
END;
$$;

-- Atomic transfer function (bypasses RLS, runs as single transaction)
CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_sender_id uuid,
  p_recipient_wallet text,
  p_recipient_phone text,
  p_amount numeric,
  p_pin text DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_sender_wallet wallets%ROWTYPE;
  v_receiver_wallet wallets%ROWTYPE;
  v_fee numeric := 0;
  v_fee_config fee_config%ROWTYPE;
  v_total_debit numeric;
  v_ref text;
  v_receiver_name text;
BEGIN
  -- Verify sender matches authenticated user
  IF p_sender_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get sender wallet (lock row for update)
  SELECT * INTO v_sender_wallet FROM wallets WHERE user_id = p_sender_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  IF v_sender_wallet.is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your wallet is locked');
  END IF;

  -- Get receiver wallet (lock row for update)
  IF p_recipient_wallet IS NOT NULL AND p_recipient_wallet != '' THEN
    SELECT * INTO v_receiver_wallet FROM wallets WHERE wallet_number = p_recipient_wallet FOR UPDATE;
  ELSIF p_recipient_phone IS NOT NULL AND p_recipient_phone != '' THEN
    SELECT w.* INTO v_receiver_wallet FROM wallets w
    JOIN profiles p ON p.user_id = w.user_id
    WHERE p.phone = p_recipient_phone FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Recipient not found');
  END IF;

  -- Prevent sending to self
  IF v_sender_wallet.id = v_receiver_wallet.id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send to yourself');
  END IF;

  -- Get fee config
  SELECT * INTO v_fee_config FROM fee_config WHERE transaction_type = 'send' AND is_active = true LIMIT 1;
  IF FOUND THEN
    IF v_fee_config.fee_type = 'flat' THEN
      v_fee := COALESCE(v_fee_config.flat_amount, 0);
    ELSIF v_fee_config.fee_type = 'percentage' THEN
      v_fee := p_amount * COALESCE(v_fee_config.percentage, 0) / 100;
    END IF;
  END IF;

  v_total_debit := p_amount + v_fee;

  -- Check balance
  IF v_sender_wallet.balance < v_total_debit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance. Need ' || v_total_debit || ' but have ' || v_sender_wallet.balance);
  END IF;

  -- Debit sender
  UPDATE wallets SET balance = balance - v_total_debit, updated_at = now() WHERE id = v_sender_wallet.id;

  -- Credit receiver
  UPDATE wallets SET balance = balance + p_amount, updated_at = now() WHERE id = v_receiver_wallet.id;

  -- Get receiver name
  SELECT first_name || ' ' || last_name INTO v_receiver_name FROM profiles WHERE user_id = v_receiver_wallet.user_id;

  -- Generate reference
  v_ref := 'TRF' || extract(epoch from now())::bigint::text || lpad(floor(random() * 9999)::text, 4, '0');

  -- Create sender transaction (send)
  INSERT INTO transactions (reference, type, sender_user_id, sender_wallet_id, receiver_user_id, receiver_wallet_id, amount, fee, currency, description, status)
  VALUES (v_ref, 'send', p_sender_id, v_sender_wallet.id, v_receiver_wallet.user_id, v_receiver_wallet.id, p_amount, v_fee, v_sender_wallet.currency, 'Sent to ' || COALESCE(v_receiver_name, 'Unknown'), 'completed');

  -- Create receiver transaction (receive)
  INSERT INTO transactions (reference, type, sender_user_id, sender_wallet_id, receiver_user_id, receiver_wallet_id, amount, fee, currency, description, status)
  VALUES (v_ref || '-R', 'receive', p_sender_id, v_sender_wallet.id, v_receiver_wallet.user_id, v_receiver_wallet.id, p_amount, 0, v_sender_wallet.currency, 'Received from ' || (SELECT first_name || ' ' || last_name FROM profiles WHERE user_id = p_sender_id), 'completed');

  -- Create notifications
  INSERT INTO notifications (user_id, title, message, type)
  VALUES (v_receiver_wallet.user_id, 'Money Received', 'You received ' || v_sender_wallet.currency || ' ' || p_amount || ' from ' || (SELECT first_name FROM profiles WHERE user_id = p_sender_id), 'transaction');

  RETURN jsonb_build_object(
    'success', true,
    'reference', v_ref,
    'amount', p_amount,
    'fee', v_fee,
    'currency', v_sender_wallet.currency,
    'recipient_name', v_receiver_name,
    'new_balance', v_sender_wallet.balance - v_total_debit
  );
END;
$$;
