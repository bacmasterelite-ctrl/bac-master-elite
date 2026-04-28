import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "edge" };

type Plan = "mensuel" | "annuel";

const PLAN_PRICES: Record<Plan, number> = {
  mensuel: 1499,
  annuel: 10499,
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let payload: { plan?: Plan } = {};
  try { payload = await req.json(); } catch { return json(400, { error: "Body JSON invalide." }); }

  const plan = payload.plan;
  if (plan !== "mensuel" && plan !== "annuel") return json(400, { error: "plan invalide." });

  const amount = PLAN_PRICES[plan];

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return json(401, { error: "Token manquant." });

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return json(500, { error: "Config Supabase manquante côté serveur." });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return json(401, { error: "Session invalide." });

const publicKey = process.env.GENIUSPAY_PUBLIC_KEY;
  if (!secret) return json(500, { error: "GENIUSPAY_SECRET_KEY manquante." });

  const appUrl = process.env.PUBLIC_APP_URL ?? "https://bac-master-elite-bac-master-elite.vercel.app";
  const webhookUrl = process.env.GENIUSPAY_WEBHOOK_URL ?? "";

  const body = {
    amount,
    currency: "XOF",
    description: `BAC MASTER ELITE — Abonnement Premium ${plan}`,
    success_url: `${appUrl}/success`,
    error_url: `${appUrl}/dashboard/upgrade`,
    webhook_url: webhookUrl || undefined,
    metadata: {
      user_id: user.id,
      plan,
      expected_amount: amount,
    },
  };

  let providerRes: Response;
  try {
    providerRes = await fetch("https://pay.genius.ci/api/v1/merchant/payments", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-API-Key": process.env.GENIUSPAY_PUBLIC_KEY!,
        "X-API-Secret": process.env.GENIUSPAY_SECRET_KEY!,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    return json(502, { error: "GeniusPay injoignable.", detail: err instanceof Error ? err.message : String(err) });
  }

  const text = await providerRes.text();
  let providerJson: Record<string, unknown> = {};
  try { providerJson = text ? JSON.parse(text) : {}; } catch {}

  if (!providerRes.ok) {
    return json(providerRes.status, { error: "GeniusPay a refusé la transaction.", detail: providerJson || text });
  }

  const checkoutUrl =
    (providerJson as any)?.data?.checkout_url ??
    (providerJson as any)?.data?.payment_url;

  if (!checkoutUrl) return json(502, { error: "URL de paiement manquante.", detail: providerJson });

  return json(200, { checkout_url: checkoutUrl, plan, amount });
}
