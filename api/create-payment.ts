/**
 * POST /api/create-payment
 *
 * Crée une session de paiement GeniusPay et renvoie l'URL de redirection.
 * Le client appelle cette route avec son JWT Supabase, choisit un plan
 * ('mensuel' ou 'annuel'), et est immédiatement redirigé vers GeniusPay.
 *
 * Variables d'environnement requises (à configurer sur Vercel) :
 *   - GENIUSPAY_SECRET_KEY     (clé API GeniusPay côté serveur)
 *   - GENIUSPAY_API_URL        (optionnel, défaut https://sandbox.pay.genius.ci/api/v1)
 *   - GENIUSPAY_WEBHOOK_URL    (URL publique de l'Edge Function webhook)
 *   - PUBLIC_APP_URL           (URL publique du front, pour success/cancel)
 *   - SUPABASE_URL             (URL projet Supabase)
 *   - SUPABASE_ANON_KEY        (clé anon, pour vérifier le JWT utilisateur)
 *
 * Runtime : Edge (Web standard Request/Response, identique au App Router Next.js).
 */

import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

type Plan = "mensuel" | "annuel";

const PLAN_PRICES: Record<Plan, number> = {
  mensuel: 1499,
  annuel: 10499,
};

const SUCCESS_URL =
  "https://bac-master-elite-bac-master-elite-2vcw5nv63.vercel.app/success";

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  // 1) Lecture / validation du body
  let payload: { plan?: Plan } = {};
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "Body JSON invalide." });
  }
  const plan = payload.plan;
  if (plan !== "mensuel" && plan !== "annuel") {
    return json(400, { error: "plan doit être 'mensuel' ou 'annuel'." });
  }
  const amount = PLAN_PRICES[plan];

  // 2) Vérification du JWT utilisateur (Authorization: Bearer …)
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) {
    return json(401, { error: "Token d'authentification manquant." });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return json(500, { error: "Config Supabase manquante côté serveur." });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return json(401, { error: "Session invalide ou expirée." });
  }

  // 3) Appel GeniusPay
  const secret = process.env.GENIUSPAY_SECRET_KEY;
  if (!secret) {
    return json(500, { error: "GENIUSPAY_SECRET_KEY non configurée." });
  }
  const apiUrl =
    process.env.GENIUSPAY_API_URL?.replace(/\/$/, "") ??
    "https://sandbox.pay.genius.ci/api/v1";
  const webhookUrl = process.env.GENIUSPAY_WEBHOOK_URL ?? "";

  const body = {
    amount,
    currency: "XOF",
    description: `BAC MASTER ELITE — Abonnement Premium ${plan}`,
    success_url: SUCCESS_URL,
    cancel_url:
      (process.env.PUBLIC_APP_URL ?? SUCCESS_URL.replace("/success", "")) +
      "/dashboard/upgrade",
    webhook_url: webhookUrl || undefined,
    customer: {
      id: user.id,
      email: user.email ?? undefined,
      name: (user.user_metadata?.full_name as string | undefined) ?? undefined,
    },
    metadata: {
      user_id: user.id,
      plan,
      expected_amount: amount,
    },
  };

  let providerRes: Response;
  try {
    providerRes = await fetch(`${apiUrl}/payments`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-API-Key": secret,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return json(502, {
      error: "GeniusPay injoignable.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  const text = await providerRes.text();
  let providerJson: Record<string, unknown> = {};
  try {
    providerJson = text ? JSON.parse(text) : {};
  } catch {
    /* providerJson reste vide */
  }

  if (!providerRes.ok) {
    return json(providerRes.status, {
      error: "GeniusPay a refusé la transaction.",
      detail: providerJson || text,
    });
  }

  const checkoutUrl =
    (providerJson.payment_url as string | undefined) ??
    (providerJson.checkout_url as string | undefined) ??
    (providerJson.url as string | undefined);
  const providerRef =
    (providerJson.id as string | undefined) ??
    (providerJson.transaction_id as string | undefined) ??
    (providerJson.reference as string | undefined);

  if (!checkoutUrl) {
    return json(502, {
      error: "Réponse GeniusPay incomplète : URL de paiement manquante.",
      detail: providerJson,
    });
  }

  return json(200, {
    checkout_url: checkoutUrl,
    provider_ref: providerRef,
    plan,
    amount,
  });
}
