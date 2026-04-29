import { Router, type IRouter, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";

const router: IRouter = Router();

type Plan = "mensuel" | "annuel";

const PLAN_PRICES: Record<Plan, number> = {
  mensuel: 1499,
  annuel: 10499,
};

router.post("/create-payment", async (req: Request, res: Response) => {
  const payload = (req.body ?? {}) as { plan?: Plan };
  const plan = payload.plan;
  if (plan !== "mensuel" && plan !== "annuel") {
    return res.status(400).json({ error: "plan invalide." });
  }

  const amount = PLAN_PRICES[plan];

  const geniusPublicKey = process.env["GENIUSPAY_PUBLIC_KEY"];
  const geniusSecretKey = process.env["GENIUSPAY_SECRET_KEY"];
  if (!geniusPublicKey || !geniusSecretKey) {
    return res
      .status(500)
      .json({ error: "Config GeniusPay manquante côté serveur." });
  }

  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (!token) return res.status(401).json({ error: "Token manquant." });

  const supabaseUrl = process.env["SUPABASE_URL"];
  const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"];
  if (!supabaseUrl || !supabaseAnonKey) {
    return res
      .status(500)
      .json({ error: "Config Supabase manquante côté serveur." });
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
    return res.status(401).json({ error: "Session invalide." });
  }

  const appUrl =
    process.env["PUBLIC_APP_URL"] ??
    (process.env["REPLIT_DOMAINS"]?.split(",")[0]
      ? `https://${process.env["REPLIT_DOMAINS"]?.split(",")[0]}`
      : "http://localhost");
  const webhookUrl = process.env["GENIUSPAY_WEBHOOK_URL"] ?? "";

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

  let providerRes: Response | globalThis.Response;
  try {
    providerRes = await fetch(
      "https://pay.genius.ci/api/v1/merchant/payments",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-API-Key": geniusPublicKey,
          "X-API-Secret": geniusSecretKey,
        },
        body: JSON.stringify(body),
      },
    );
  } catch (err) {
    return res.status(502).json({
      error: "GeniusPay injoignable.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  const text = await (providerRes as globalThis.Response).text();
  let providerJson: Record<string, unknown> = {};
  try {
    providerJson = text ? JSON.parse(text) : {};
  } catch {
    /* ignore */
  }

  if (!(providerRes as globalThis.Response).ok) {
    req.log.error(
      {
        status: (providerRes as globalThis.Response).status,
        body: providerJson || text,
      },
      "GENIUSPAY_ERROR",
    );
    return res
      .status((providerRes as globalThis.Response).status)
      .json({
        error: "GeniusPay a refusé la transaction.",
        detail: providerJson || text,
      });
  }

  req.log.info({ providerJson }, "GENIUSPAY_SUCCESS");

  const checkoutUrl =
    (providerJson as { data?: { checkout_url?: string; payment_url?: string } })
      ?.data?.checkout_url ??
    (providerJson as { data?: { checkout_url?: string; payment_url?: string } })
      ?.data?.payment_url;

  if (!checkoutUrl) {
    return res
      .status(502)
      .json({ error: "URL de paiement manquante.", detail: providerJson });
  }

  return res.status(200).json({ checkout_url: checkoutUrl, plan, amount });
});

export default router;
