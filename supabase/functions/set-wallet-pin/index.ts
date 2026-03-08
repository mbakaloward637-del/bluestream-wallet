import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const { pin, current_pin } = await req.json();

    if (!pin || pin.length < 4 || pin.length > 6) {
      return new Response(JSON.stringify({ error: "PIN must be 4-6 digits" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get current wallet
    const { data: wallet } = await serviceClient
      .from("wallets")
      .select("id, pin_hash")
      .eq("user_id", user.id)
      .single();

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If PIN already set, require current PIN for change
    if (wallet.pin_hash && !current_pin) {
      return new Response(JSON.stringify({ error: "Current PIN required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (wallet.pin_hash) {
      // Verify current PIN using SQL crypt
      const { data: valid } = await serviceClient.rpc("verify_pin" as any, {
        _wallet_id: wallet.id,
        _pin: current_pin,
      });
      if (!valid) {
        return new Response(JSON.stringify({ error: "Current PIN is incorrect" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Hash and store PIN using SQL crypt (bcrypt)
    const { error: updateError } = await serviceClient.rpc("set_pin" as any, {
      _wallet_id: wallet.id,
      _pin: pin,
    });

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
