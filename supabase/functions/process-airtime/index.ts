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

    const { phone, amount, network, currency } = await req.json();

    // ─── AIRTIME PROVIDER PLACEHOLDER ───
    // Africa's Talking:
    //   const AT_API_KEY = Deno.env.get("AT_API_KEY");
    //   const AT_USERNAME = Deno.env.get("AT_USERNAME");
    //   POST https://api.africastalking.com/version1/airtime/send
    //   { recipients: [{ phoneNumber: phone, amount: `${currency} ${amount}` }] }
    //
    // Reloadly:
    //   const RELOADLY_KEY = Deno.env.get("RELOADLY_API_KEY");
    //   POST https://topups.reloadly.com/topups

    const airtimeProviderConfigured = false;

    if (airtimeProviderConfigured) {
      // Actual API call to purchase airtime
      // const resp = await fetch(...)
    }

    console.log(`[AIRTIME] Purchase: ${network} ${currency} ${amount} to ${phone}`);

    return new Response(JSON.stringify({
      success: true,
      provider_configured: false,
      message: "Airtime purchase queued (provider API not configured yet)",
      phone,
      amount,
      network,
      reference: `AIR_${Date.now()}`,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Airtime error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
