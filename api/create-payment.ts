import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

type Plan = "mensuel" | "annuel";
const PLAN_PRICES: Record<Plan, number> = { mensuel: 1499, annuel: 10499 };

const env = (key: string, fallbackKey?: string): string | undefined => {
  return process.env[key] ?? (fallbackKey ? process.env[fallbackKey] : undefined);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { plan } = (req.body ?? {}) as { plan?: Plan };
  if (plan !== "mensuel" && plan !== "annuel") {
    return res.status(400).json({ error: "Plan invalide. Attendu: 'mensuel' ou 'annuel'." });
  }

  const geniusUrl = env("GENIUSPAY_URL", "GENUISPAY_URL");
  const geniusPublicKey = env("GENIUSPAY_PUBLIC_KEY", "GENUISPAY_PUBLIC_KEY");
  const geniusSecretKey = env("GENIUSPAY_SECRET_KEY", "GENUISPAY_SECRET_KEY");
  const webhookUrl = env("GENIUSPAY_WEBHOOK_URL", "GENUISPAY_WEBHOOK_URL") ?? "";
  const supabaseUrl = env("SUPABASE_URL");
  const supabaseAnonKey = env("SUPABASE_ANON_KEY");

  if (!geniusUrl || !geniusPublicKey || !geniusSecretKey) {
    console.error("[create-payment] Missing GeniusPay env vars", {
      hasUrl: !!geniusUrl,
      hasPublic: !!geniusPublicKey,
      hasSecret: !!geniusSecretKey,
    });
    return res.status(500).json({
      error:
        "Config GeniusPay manquante côté serveur (GENIUSPAY_URL, GENIUSPAY_PUBLIC_KEY, GENIUSPAY_SECRET_KEY).",
    });
  }
  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: "Config Supabase manquante côté serveur." });
  }

  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Vous devez être connecté pour payer." });
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
    return res.status(401).json({ error: "Session invalide ou expirée. Reconnectez-vous." });
  }

  const appUrl = env("PUBLIC_APP_URL") ?? `https://${req.headers.host ?? ""}`;
  const amount = PLAN_PRICES[plan];

  const payload = {
    amount,
    currency: "XOF",
    description: `BAC MASTER ELITE — Abonnement Premium ${plan}`,
    success_url: `${appUrl}/success`,
    error_url: `${appUrl}/dashboard/upgrade`,
    cancel_url: `${appUrl}/dashboard/upgrade`,
    webhook_url: webhookUrl || undefined,
    callback_url: webhookUrl || undefined,
    metadata: { user_id: user.id, plan, expected_amount: amount, currency: "XOF" },
    customer: { email: user.email ?? undefined, id: user.id },
  };

  try {
    const providerRes = await fetch(geniusUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-API-Secret": geniusSecretKey,
        "X-API-Key": geniusPublicKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await providerRes.text();
    let providerJson: Record<string, unknown> = {};
    try {
      providerJson = text ? JSON.parse(text) : {};
    } catch {
      console.warn("[create-payment] Non-JSON response from GeniusPay:", text.slice(0, 500));
    }

    if (!providerRes.ok) {
      console.error("[create-payment] GeniusPay rejected", {
        status: providerRes.status,
        body: providerJson,
      });
      return res.status(providerRes.status).json({
        error: "GeniusPay a refusé la transaction.",
        detail: providerJson || text.slice(0, 500),
      });
    }

    const j = providerJson as Record<string, any>;
    const checkoutUrl: string | undefined =
      j?.checkout_url ??
      j?.payment_url ??
      j?.url ??
      j?.data?.checkout_url ??
      j?.data?.payment_url ??
      j?.data?.url ??
      j?.data?.attributes?.checkout_url ??
      j?.payment?.checkout_url ??
      j?.transaction?.checkout_url;

    if (!checkoutUrl) {
      console.error("[create-payment] No checkout URL in GeniusPay response", { body: providerJson });
      return res.status(502).json({
        error: "URL de paiement manquante dans la réponse GeniusPay.",
        detail: providerJson,
      });
    }

    return res.status(200).json({ checkout_url: checkoutUrl, plan, amount });
  } catch (err) {
    console.error("[create-payment] Exception:", err);
    return res.status(502).json({
      error: "GeniusPay injoignable. Réessayez dans un instant.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
