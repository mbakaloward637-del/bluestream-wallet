import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INTASEND_API_URL = "https://payment.intasend.com/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const intasendToken = Deno.env.get("INTASEND_API_TOKEN");
    const intasendPublishable = Deno.env.get("INTASEND_PUBLISHABLE_KEY");

    // Auth: get user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceKey);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await serviceClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, amount, phone, pin } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user's wallet
    const { data: wallet } = await serviceClient
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── M-Pesa STK Push (Deposit) ───
    if (action === "mpesa_stk_push") {
      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone number required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ref = `MPD${Date.now()}${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;

      if (!intasendToken) {
        // IntaSend not configured — simulate for dev
        console.log(`[INTASEND-STK] Simulating STK Push: ${phone} paying ${amount}`);

        // Credit wallet for demo
        await serviceClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) + Number(amount) })
          .eq("id", wallet.id);

        await serviceClient.from("transactions").insert({
          reference: ref,
          type: "deposit",
          receiver_user_id: user.id,
          receiver_wallet_id: wallet.id,
          amount: Number(amount),
          currency: wallet.currency,
          description: `M-Pesa deposit (demo) from ${phone}`,
          status: "completed",
          method: "mpesa",
          provider: "IntaSend",
          metadata: { phone, simulated: true },
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: "Deposit credited (IntaSend not configured — demo mode)",
            reference: ref,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Real IntaSend STK Push
      const stkResponse = await fetch(`${INTASEND_API_URL}/payment/mpesa-stk-push/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${intasendToken}`,
        },
        body: JSON.stringify({
          amount: Math.round(Number(amount)),
          phone_number: phone.replace(/^\+/, ""),
          api_ref: ref,
          narrative: "AbanRemit Wallet Deposit",
        }),
      });

      const stkResult = await stkResponse.json();

      if (!stkResponse.ok) {
        console.error("[INTASEND-STK] Error:", stkResult);
        return new Response(
          JSON.stringify({ error: stkResult.message || stkResult.detail || "STK Push failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create pending transaction
      await serviceClient.from("transactions").insert({
        reference: ref,
        type: "deposit",
        receiver_user_id: user.id,
        receiver_wallet_id: wallet.id,
        amount: Number(amount),
        currency: wallet.currency,
        description: `M-Pesa STK Push from ${phone}`,
        status: "pending",
        method: "mpesa",
        provider: "IntaSend",
        metadata: { phone, intasend_invoice_id: stkResult.invoice?.invoice_id || stkResult.id },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "STK Push sent. Enter your M-Pesa PIN on your phone.",
          reference: ref,
          invoice_id: stkResult.invoice?.invoice_id || stkResult.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Card Payment (via IntaSend Checkout) ───
    if (action === "card_payment") {
      const ref = `CDP${Date.now()}${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;

      if (!intasendToken || !intasendPublishable) {
        // Demo mode
        await serviceClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) + Number(amount) })
          .eq("id", wallet.id);

        await serviceClient.from("transactions").insert({
          reference: ref,
          type: "deposit",
          receiver_user_id: user.id,
          receiver_wallet_id: wallet.id,
          amount: Number(amount),
          currency: wallet.currency,
          description: "Card deposit (demo)",
          status: "completed",
          method: "card",
          provider: "IntaSend",
          metadata: { simulated: true },
        });

        return new Response(
          JSON.stringify({ success: true, message: "Deposit credited (demo mode)", reference: ref }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Real IntaSend checkout
      const { data: profile } = await serviceClient.from("profiles").select("email, first_name, last_name, phone").eq("user_id", user.id).single();

      const checkoutResponse = await fetch(`${INTASEND_API_URL}/checkout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${intasendToken}`,
        },
        body: JSON.stringify({
          public_key: intasendPublishable,
          amount: Math.round(Number(amount)),
          currency: wallet.currency,
          email: profile?.email || user.email,
          first_name: profile?.first_name || "",
          last_name: profile?.last_name || "",
          phone_number: profile?.phone || "",
          api_ref: ref,
          redirect_url: `${Deno.env.get("SITE_URL") || supabaseUrl.replace(".supabase.co", "")}/dashboard`,
        }),
      });

      const checkoutResult = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        return new Response(
          JSON.stringify({ error: checkoutResult.message || "Checkout creation failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Pending transaction
      await serviceClient.from("transactions").insert({
        reference: ref,
        type: "deposit",
        receiver_user_id: user.id,
        receiver_wallet_id: wallet.id,
        amount: Number(amount),
        currency: wallet.currency,
        description: "Card deposit via IntaSend",
        status: "pending",
        method: "card",
        provider: "IntaSend",
        metadata: { intasend_checkout_id: checkoutResult.id },
      });

      return new Response(
        JSON.stringify({
          success: true,
          checkout_url: checkoutResult.url,
          reference: ref,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── M-Pesa B2C (Withdrawal via IntaSend) ───
    if (action === "mpesa_b2c") {
      if (!phone || !pin) {
        return new Response(JSON.stringify({ error: "Phone and PIN required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify PIN
      const { data: pinValid } = await serviceClient.rpc("verify_pin", {
        _wallet_id: wallet.id,
        _pin: pin,
      });
      if (!pinValid) {
        return new Response(JSON.stringify({ error: "Invalid PIN" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (Number(wallet.balance) < Number(amount)) {
        return new Response(JSON.stringify({ error: "Insufficient balance" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const ref = `MPW${Date.now()}${Math.floor(Math.random() * 999).toString().padStart(3, "0")}`;

      if (!intasendToken) {
        // Demo mode — deduct and complete
        await serviceClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) - Number(amount) })
          .eq("id", wallet.id);

        await serviceClient.from("transactions").insert({
          reference: ref,
          type: "withdraw",
          sender_user_id: user.id,
          sender_wallet_id: wallet.id,
          amount: Number(amount),
          currency: wallet.currency,
          description: `M-Pesa withdrawal to ${phone} (demo)`,
          status: "completed",
          method: "mpesa",
          provider: "IntaSend",
          metadata: { phone, simulated: true },
        });

        return new Response(
          JSON.stringify({ success: true, message: "Withdrawal processed (demo mode)", reference: ref }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deduct balance
      await serviceClient
        .from("wallets")
        .update({ balance: Number(wallet.balance) - Number(amount) })
        .eq("id", wallet.id);

      // IntaSend Send Money (M-Pesa)
      const sendResponse = await fetch(`${INTASEND_API_URL}/send-money/initiate/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${intasendToken}`,
        },
        body: JSON.stringify({
          currency: wallet.currency,
          provider: "MPESA-B2C",
          transactions: [
            {
              name: "Withdrawal",
              account: phone.replace(/^\+/, ""),
              amount: Math.round(Number(amount)),
              narrative: "AbanRemit Withdrawal",
            },
          ],
        }),
      });

      const sendResult = await sendResponse.json();

      await serviceClient.from("transactions").insert({
        reference: ref,
        type: "withdraw",
        sender_user_id: user.id,
        sender_wallet_id: wallet.id,
        amount: Number(amount),
        currency: wallet.currency,
        description: `M-Pesa withdrawal to ${phone}`,
        status: sendResponse.ok ? "pending" : "failed",
        method: "mpesa",
        provider: "IntaSend",
        metadata: { phone, intasend_tracking_id: sendResult.tracking_id || null },
      });

      if (!sendResponse.ok) {
        // Refund on failure
        await serviceClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) })
          .eq("id", wallet.id);

        return new Response(
          JSON.stringify({ error: sendResult.message || "Withdrawal failed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: "Withdrawal is being processed", reference: ref }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── IntaSend Webhook (callback) ───
    if (action === "webhook") {
      const body = await req.json();
      console.log("[INTASEND-WEBHOOK] Received:", JSON.stringify(body));

      const invoiceId = body.invoice_id || body.checkout_id;
      const state = body.state || body.status;

      if (invoiceId && state === "COMPLETE") {
        // Find pending transaction
        const { data: tx } = await serviceClient
          .from("transactions")
          .select("*")
          .eq("status", "pending")
          .contains("metadata", { intasend_invoice_id: invoiceId })
          .single();

        if (tx) {
          await serviceClient.from("transactions").update({ status: "completed" }).eq("id", tx.id);
          await serviceClient
            .from("wallets")
            .update({ balance: Number(wallet.balance) + Number(tx.amount) })
            .eq("id", tx.receiver_wallet_id);
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("IntaSend error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
