import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("WEBHOOK_RECEIVED", JSON.stringify(body));

    // Vérifier que le paiement est bien réussi
    if (body.event !== "payment.success" && body.status !== "completed") {
      return new Response("ignored", { status: 200 });
    }

    const user_id = body.metadata?.user_id;
    const plan = body.metadata?.plan;

    if (!user_id || !plan) {
      return new Response("missing metadata", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calculer la date d'expiration
    const now = new Date();
    const expires = new Date(now);
    if (plan === "mensuel") {
      expires.setMonth(expires.getMonth() + 1);
    } else {
      expires.setFullYear(expires.getFullYear() + 1);
    }

    // Mettre à jour l'utilisateur
    const { error } = await supabase
      .from("profiles")
      .update({
        is_premium: true,
        plan: plan,
        plan_expires_at: expires.toISOString(),
      })
      .eq("id", user_id);

    if (error) {
      console.error("DB_ERROR", error);
      return new Response("db error", { status: 500 });
    }

    console.log("PREMIUM_ACTIVATED", { user_id, plan });
    return new Response("ok", { status: 200 });

  } catch (err) {
    console.error("WEBHOOK_ERROR", err);
    return new Response("error", { status: 500 });
  }
});
