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
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, amount, currency, reference, recipient_phone, recipient_name, sender_name } = await req.json();

    if (!type || !amount || !currency) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get caller's profile for their phone
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await serviceClient.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("phone, first_name")
      .eq("user_id", user.id)
      .single();

    // Build SMS messages based on transaction type
    const messages: { phone: string; text: string }[] = [];

    const formattedAmount = `${currency} ${Number(amount).toLocaleString()}`;

    if (type === "deposit") {
      // Notify the depositor
      if (profile?.phone) {
        messages.push({
          phone: profile.phone,
          text: `AbanRemit: Your wallet has been credited with ${formattedAmount}. Ref: ${reference}. Thank you for using AbanRemit.`,
        });
      }
    } else if (type === "send") {
      // Notify sender
      if (profile?.phone) {
        messages.push({
          phone: profile.phone,
          text: `AbanRemit: You sent ${formattedAmount} to ${recipient_name || "a recipient"}. Ref: ${reference}. Your new balance has been updated.`,
        });
      }
      // Notify recipient
      if (recipient_phone) {
        messages.push({
          phone: recipient_phone,
          text: `AbanRemit: You received ${formattedAmount} from ${sender_name || profile?.first_name || "someone"}. Ref: ${reference}. Check your wallet.`,
        });
      }
    } else if (type === "withdraw") {
      if (profile?.phone) {
        messages.push({
          phone: profile.phone,
          text: `AbanRemit: Withdrawal of ${formattedAmount} initiated. Ref: ${reference}. You will be notified once processed.`,
        });
      }
    } else if (type === "airtime") {
      if (profile?.phone) {
        messages.push({
          phone: profile.phone,
          text: `AbanRemit: Airtime purchase of ${formattedAmount} successful. Ref: ${reference}.`,
        });
      }
    }

    // ─── SMS PROVIDER PLACEHOLDER ───
    // Replace with your provider (Africa's Talking, Twilio, etc.)
    // const AT_API_KEY = Deno.env.get("AT_API_KEY");
    // const AT_USERNAME = Deno.env.get("AT_USERNAME");
    const smsProviderConfigured = false;

    let sent = 0;
    let failed = 0;

    for (const msg of messages) {
      if (smsProviderConfigured) {
        // ─── ACTUAL SMS SENDING ───
        // try {
        //   await sendSMS(msg.phone, msg.text);
        //   sent++;
        // } catch { failed++; }
      } else {
        // Log for development
        console.log(`[SMS-TRANSACTION] To: ${msg.phone} | ${msg.text}`);
        sent++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        provider_configured: smsProviderConfigured,
        messages_queued: messages.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Transaction SMS error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
