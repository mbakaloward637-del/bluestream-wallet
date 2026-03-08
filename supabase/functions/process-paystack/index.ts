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

    const { action, amount, currency, email, card_details } = await req.json();

    // ─── PAYSTACK API PLACEHOLDER ───
    // Requires: PAYSTACK_SECRET_KEY
    //
    // Initialize transaction → charge card → verify → credit wallet
    // Webhook: /process-paystack?action=webhook for payment confirmation

    const paystackConfigured = false;

    if (action === "initialize") {
      if (paystackConfigured) {
        // const PAYSTACK_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
        // const resp = await fetch("https://api.paystack.co/transaction/initialize", {
        //   method: "POST",
        //   headers: { Authorization: `Bearer ${PAYSTACK_KEY}`, "Content-Type": "application/json" },
        //   body: JSON.stringify({ email, amount: amount * 100, currency }),
        // });
        // return resp data with authorization_url
      }

      console.log(`[PAYSTACK] Init charge: ${email}, ${currency} ${amount}`);
      return new Response(JSON.stringify({
        success: true,
        provider_configured: false,
        message: "Payment initialized (Paystack API not configured yet)",
        reference: `PAY_${Date.now()}`,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "verify") {
      // Verify transaction after payment
      console.log("[PAYSTACK] Verify transaction");
      return new Response(JSON.stringify({
        success: true,
        provider_configured: false,
        status: "simulated_success",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "webhook") {
      // Paystack webhook — verify signature, credit wallet
      console.log("[PAYSTACK-WEBHOOK] Received");
      return new Response(JSON.stringify({ received: true }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Paystack error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
