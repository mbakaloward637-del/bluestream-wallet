import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await serviceClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, amount, phone, wallet_id } = await req.json();

    // ─── M-Pesa API PLACEHOLDER ───
    // Requires: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_URL
    //
    // C2B (Customer to Business) - STK Push for deposits
    // 1. Get OAuth token from Safaricom
    // 2. Send STK Push request to customer phone
    // 3. Customer enters PIN on phone
    // 4. Callback confirms payment → credit wallet
    //
    // B2C (Business to Customer) - Disbursements/withdrawals
    // 1. Get OAuth token
    // 2. Send B2C payment request
    // 3. Callback confirms disbursement → update withdrawal status

    const mpesaConfigured = false;

    if (action === "stk_push") {
      // C2B: Customer deposits to wallet
      if (mpesaConfigured) {
        // const oauthToken = await getMpesaToken();
        // const stkResponse = await fetch("https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest", { ... });
        // return stkResponse data
      }

      console.log(`[MPESA-STK] C2B Push: ${phone} paying ${amount}`);
      return new Response(JSON.stringify({
        success: true,
        provider_configured: false,
        message: "STK Push queued (M-Pesa API not configured yet)",
        checkout_request_id: `SIM_${Date.now()}`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "b2c") {
      // B2C: Send money to customer (withdrawals)
      if (mpesaConfigured) {
        // const oauthToken = await getMpesaToken();
        // const b2cResponse = await fetch("https://sandbox.safaricom.co.ke/mpesa/b2c/v3/paymentrequest", { ... });
      }

      console.log(`[MPESA-B2C] Disbursing ${amount} to ${phone}`);
      return new Response(JSON.stringify({
        success: true,
        provider_configured: false,
        message: "B2C disbursement queued (M-Pesa API not configured yet)",
        conversation_id: `SIM_B2C_${Date.now()}`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "callback") {
      // M-Pesa callback handler — called by Safaricom after STK/B2C completes
      // In production: verify callback, credit/debit wallet, update transaction status
      console.log("[MPESA-CALLBACK] Received callback:", await req.json());
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("M-Pesa error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
