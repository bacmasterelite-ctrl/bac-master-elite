// =============================================================================
// Supabase Edge Function — geniuspay-webhook
// =============================================================================
// Reçoit l'événement payment.success de GeniusPay, vérifie la signature,
// applique l'idempotence, met à jour profiles.plan_expires_at et insère
// la transaction dans payments.
//
// Déploiement :
//   supabase functions deploy geniuspay-webhook --no-verify-jwt
//   supabase secrets set \
//     GENIUSPAY_WEBHOOK_SECRET=xxx \
//     SUPABASE_SERVICE_ROLE_KEY=xxx
//
// L'URL publique est :
//   https://<PROJECT_REF>.functions.supabase.co/geniuspay-webhook
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Plan = "mensuel" | "annuel";

const PLAN_PRICES: Record<Plan, number> = {
  mensuel: 1499,
  annuel: 10499,
};

const PLAN_DURATION_DAYS: Record<Plan, number> = {
  mensuel: 30,
  annuel: 365,
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

// Comparaison constante pour éviter les attaques par timing
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  // 1) Lecture du raw body (nécessaire pour la vérification HMAC)
  const raw = await req.text();

  // 2) Vérification de signature
  const webhookSecret = Deno.env.get("GENIUSPAY_WEBHOOK_SECRET");
  if (!webhookSecret) {
    return json(500, { error: "GENIUSPAY_WEBHOOK_SECRET non configurée." });
  }
  const incomingSig =
    req.headers.get("x-geniuspay-signature") ??
    req.headers.get("x-signature") ??
    "";
  const expectedSig = await hmacHex(webhookSecret, raw);
  if (!incomingSig || !safeEqual(incomingSig.toLowerCase(), expectedSig)) {
    return json(401, { error: "Signature invalide." });
  }

  // 3) Parse de l'événement
  let event: {
    event?: string;
    type?: string;
    data?: Record<string, unknown>;
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return json(400, { error: "Body JSON invalide." });
  }
  const eventName = event.event ?? event.type ?? "";
  if (eventName !== "payment.success") {
    // On accuse réception sans rien faire (Stripe-style)
    return json(200, { received: true, ignored: eventName });
  }

  const data = (event.data ?? {}) as Record<string, unknown>;
  const providerRef =
    (data.id as string | undefined) ??
    (data.transaction_id as string | undefined) ??
    (data.reference as string | undefined);
  const amount = Number(data.amount);
  const currency = String(data.currency ?? "");
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const userId = metadata.user_id as string | undefined;
  const plan = metadata.plan as Plan | undefined;
  const expectedAmount = Number(metadata.expected_amount ?? 0);

  if (!providerRef || !userId || !plan) {
    return json(400, { error: "Champs requis manquants (id, user_id, plan)." });
  }
  if (currency !== "XOF") {
    return json(400, { error: `Devise inattendue : ${currency}` });
  }
  if (!(plan in PLAN_PRICES)) {
    return json(400, { error: `Plan inconnu : ${plan}` });
  }
  // Sécurité : le montant reçu doit correspondre au prix officiel ET à la
  // metadata initialement transmise (pour empêcher toute manipulation client)
  if (amount !== PLAN_PRICES[plan] || amount !== expectedAmount) {
    return json(400, {
      error: "Montant reçu incohérent avec le plan annoncé.",
      received: amount,
      expected: PLAN_PRICES[plan],
      metadata_amount: expectedAmount,
    });
  }

  // 4) Client Supabase service_role
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 5) Idempotence : transaction déjà connue ?
  const { data: existing, error: existingErr } = await admin
    .from("payments")
    .select("id, status")
    .eq("provider_ref", providerRef)
    .maybeSingle();
  if (existingErr) return json(500, { error: existingErr.message });
  if (existing && existing.status === "succes") {
    return json(200, { received: true, idempotent: true });
  }

  // 6) Calcul de la nouvelle date d'expiration (cumul si déjà Premium)
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("plan_expires_at")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) return json(500, { error: profileErr.message });

  const nowMs = Date.now();
  const baseMs =
    profile?.plan_expires_at && new Date(profile.plan_expires_at).getTime() > nowMs
      ? new Date(profile.plan_expires_at).getTime()
      : nowMs;
  const newExpiresAt = new Date(
    baseMs + PLAN_DURATION_DAYS[plan] * 24 * 60 * 60 * 1000,
  ).toISOString();

  // 7) Mise à jour du profil
  const { error: updErr } = await admin
    .from("profiles")
    .update({
      plan,
      plan_expires_at: newExpiresAt,
      is_premium: true,
    })
    .eq("id", userId);
  if (updErr) return json(500, { error: updErr.message });

  // 8) Enregistrement de la transaction (upsert sur provider_ref)
  const { error: payErr } = await admin.from("payments").upsert(
    {
      provider: "geniuspay",
      provider_ref: providerRef,
      user_id: userId,
      plan,
      amount,
      currency,
      status: "succes",
      raw_event: event as unknown as Record<string, unknown>,
      paid_at: new Date().toISOString(),
    },
    { onConflict: "provider_ref" },
  );
  if (payErr) return json(500, { error: payErr.message });

  return json(200, {
    received: true,
    user_id: userId,
    plan,
    plan_expires_at: newExpiresAt,
  });
});
