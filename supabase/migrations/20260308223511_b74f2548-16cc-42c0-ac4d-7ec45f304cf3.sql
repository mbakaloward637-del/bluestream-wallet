
-- Helper function to set PIN (bcrypt hash)
CREATE OR REPLACE FUNCTION public.set_pin(_wallet_id uuid, _pin text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  UPDATE wallets SET pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf')), failed_pin_attempts = 0 WHERE id = _wallet_id;
END;
$$;

-- Helper function to verify PIN
CREATE OR REPLACE FUNCTION public.verify_pin(_wallet_id uuid, _pin text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM wallets WHERE id = _wallet_id AND pin_hash = extensions.crypt(_pin, pin_hash)
  );
$$;

-- Update transfer_funds to validate PIN via bcrypt
CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_sender_id uuid, p_recipient_wallet text, p_recipient_phone text, p_amount numeric, p_pin text DEFAULT ''::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_sender_wallet wallets%ROWTYPE;
  v_receiver_wallet wallets%ROWTYPE;
  v_fee numeric := 0;
  v_fee_config fee_config%ROWTYPE;
  v_total_debit numeric;
  v_ref text;
  v_receiver_name text;
BEGIN
  IF p_sender_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT * INTO v_sender_wallet FROM wallets WHERE user_id = p_sender_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  IF v_sender_wallet.is_locked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your wallet is locked. Contact support.');
  END IF;

  IF v_sender_wallet.pin_hash IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Wallet PIN not set. Please set your PIN in Profile.');
  END IF;

  IF NOT (v_sender_wallet.pin_hash = extensions.crypt(p_pin, v_sender_wallet.pin_hash)) THEN
    UPDATE wallets SET failed_pin_attempts = failed_pin_attempts + 1,
      is_locked = CASE WHEN failed_pin_attempts + 1 >= 5 THEN true ELSE false END
    WHERE id = v_sender_wallet.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid PIN');
  END IF;

  IF v_sender_wallet.failed_pin_attempts > 0 THEN
    UPDATE wallets SET failed_pin_attempts = 0 WHERE id = v_sender_wallet.id;
  END IF;

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

  IF v_sender_wallet.id = v_receiver_wallet.id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot send to yourself');
  END IF;

  SELECT * INTO v_fee_config FROM fee_config WHERE transaction_type = 'send' AND is_active = true LIMIT 1;
  IF FOUND THEN
    IF v_fee_config.fee_type = 'flat' THEN
      v_fee := COALESCE(v_fee_config.flat_amount, 0);
    ELSIF v_fee_config.fee_type = 'percentage' THEN
      v_fee := p_amount * COALESCE(v_fee_config.percentage, 0) / 100;
    END IF;
  END IF;

  v_total_debit := p_amount + v_fee;

  IF v_sender_wallet.balance < v_total_debit THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  UPDATE wallets SET balance = balance - v_total_debit, updated_at = now() WHERE id = v_sender_wallet.id;
  UPDATE wallets SET balance = balance + p_amount, updated_at = now() WHERE id = v_receiver_wallet.id;

  SELECT first_name || ' ' || last_name INTO v_receiver_name FROM profiles WHERE user_id = v_receiver_wallet.user_id;

  v_ref := 'TRF' || extract(epoch from now())::bigint::text || lpad(floor(random() * 9999)::text, 4, '0');

  INSERT INTO transactions (reference, type, sender_user_id, sender_wallet_id, receiver_user_id, receiver_wallet_id, amount, fee, currency, description, status)
  VALUES (v_ref, 'send', p_sender_id, v_sender_wallet.id, v_receiver_wallet.user_id, v_receiver_wallet.id, p_amount, v_fee, v_sender_wallet.currency, 'Sent to ' || COALESCE(v_receiver_name, 'Unknown'), 'completed');

  INSERT INTO transactions (reference, type, sender_user_id, sender_wallet_id, receiver_user_id, receiver_wallet_id, amount, fee, currency, description, status)
  VALUES (v_ref || '-R', 'receive', p_sender_id, v_sender_wallet.id, v_receiver_wallet.user_id, v_receiver_wallet.id, p_amount, 0, v_sender_wallet.currency, 'Received from ' || (SELECT first_name || ' ' || last_name FROM profiles WHERE user_id = p_sender_id), 'completed');

  INSERT INTO notifications (user_id, title, message, type)
  VALUES (v_receiver_wallet.user_id, 'Money Received', 'You received ' || v_sender_wallet.currency || ' ' || p_amount || ' from ' || (SELECT first_name FROM profiles WHERE user_id = p_sender_id), 'transaction');

  RETURN jsonb_build_object('success', true, 'reference', v_ref, 'amount', p_amount, 'fee', v_fee,
    'currency', v_sender_wallet.currency, 'recipient_name', v_receiver_name,
    'new_balance', v_sender_wallet.balance - v_total_debit);
END;
$function$;
