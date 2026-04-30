// @ts-nocheck
// Supabase Edge Function: geniuspay-webhook
// Deploy with: supabase functions deploy geniuspay-webhook --no-verify-jwt
//
// Required env (set via: supabase secrets set KEY=value):
//   SUPABASE_URL                — Supabase project URL
//   SUPABASE_SERVICE_ROLE_KEY   — Supabase service role key (bypasses RLS)
//   GENIUSPAY_WEBHOOK_SECRET    — (optional) Shared secret to verify webhook signature
//
// GeniusPay must be configured to POST to:
//   https://<project-ref>.supabase.co/functions/v1/geniuspay-webhook

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("GENIUSPAY_WEBHOOK_SECRET") ?? "";

type Plan = "mensuel" | "annuel";
const PLAN_DAYS: Record<Plan, number> = { mensuel: 30, annuel: 365 };
const PLAN_PRICES: Record<Plan, number> = { mensuel: 1499, annuel: 10499 };

// Tolerant metadata extraction — GeniusPay may nest the payload differently
// across event types. We probe every reasonable location.
function extractMetadata(body: any): Record<string, any> {
  const candidates = [
    body?.metadata,
    body?.data?.metadata,
    body?.payment?.metadata,
    body?.transaction?.metadata,
    body?.event?.metadata,
    body?.event?.data?.metadata,
    body?.event?.data?.attributes?.metadata,
    body?.data?.attributes?.metadata,
    body?.data?.payment?.metadata,
    body?.payload?.metadata,
    body?.payload?.data?.metadata,
  ];
  for (const c of candidates) {
    if (c && typeof c === "object") return c as Record<string, any>;
  }
  return {};
}

function extractStatus(body: any): string {
  return (
    body?.status ??
    body?.data?.status ??
    body?.payment?.status ??
    body?.transaction?.status ??
    body?.event?.type ??
    body?.event?.data?.status ??
    body?.payload?.status ??
    "unknown"
  )
    .toString()
    .toLowerCase();
}

function extractAmount(body: any): number | null {
  const raw =
    body?.amount ??
    body?.data?.amount ??
    body?.payment?.amount ??
    body?.transaction?.amount ??
    body?.event?.data?.amount ??
    null;
  if (raw === null || raw === undefined) return null;
  const n = typeof raw === "string" ? Number(raw) : raw;
  return Number.isFinite(n) ? n : null;
}

function extractTransactionId(body: any): string | null {
  return (
    body?.transaction_id ??
    body?.id ??
    body?.data?.id ??
    body?.payment?.id ??
    body?.transaction?.id ??
    body?.event?.id ??
    null
  );
}

const SUCCESS_TOKENS = ["success", "succes", "succeeded", "paid", "completed", "approved", "ok"];
const FAILURE_TOKENS = ["failed", "echec", "declined", "cancelled", "canceled", "refused"];

async function processWebhook(body: any) {
  const meta = extractMetadata(body);
  const status = extractStatus(body);
  const amount = extractAmount(body);
  const txId = extractTransactionId(body);

  console.log("[geniuspay-webhook] received", {
    status,
    amount,
    txId,
    meta_keys: Object.keys(meta),
  });

  const userId: string | null = meta?.user_id ?? null;
  const plan: Plan | null =
    meta?.plan === "mensuel" || meta?.plan === "annuel" ? meta.plan : null;

  if (!userId || !plan) {
    console.error("[geniuspay-webhook] Missing user_id or plan in metadata", { meta, body });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const isSuccess = SUCCESS_TOKENS.some((t) => status.includes(t));
  const isFailure = FAILURE_TOKENS.some((t) => status.includes(t));
  const dbStatus = isSuccess ? "succes" : isFailure ? "echec" : "initie";

  // Always log the transaction in `payments`
  await supabase.from("payments").upsert(
    {
      transaction_id: txId,
      user_id: userId,
      plan,
      amount: amount ?? PLAN_PRICES[plan],
      currency: "XOF",
      status: dbStatus,
      raw_payload: body,
    },
    { onConflict: "transaction_id" },
  );

  if (!isSuccess) {
    console.log("[geniuspay-webhook] Non-success status, skipping premium update", { status });
    return;
  }

  // Anti-fraud: refuse if amount is below the expected price
  const expected = PLAN_PRICES[plan];
  if (amount !== null && amount < expected) {
    console.warn("[geniuspay-webhook] Amount below expected", { amount, expected });
    return;
  }

  // Compute new expiration (extend if already premium)
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan_expires_at")
    .eq("id", userId)
    .maybeSingle();

  const now = Date.now();
  const currentExpires = profile?.plan_expires_at
    ? new Date(profile.plan_expires_at).getTime()
    : 0;
  const base = currentExpires > now ? currentExpires : now;
  const newExpires = new Date(base + PLAN_DAYS[plan] * 86400 * 1000).toISOString();

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({
      is_premium: true,
      plan_type: plan,
      plan_expires_at: newExpires,
    })
    .eq("id", userId);

  if (updateErr) {
    console.error("[geniuspay-webhook] Profile update failed", updateErr);
    return;
  }

  console.log("[geniuspay-webhook] Premium activated", { userId, plan, newExpires });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization, x-geniuspay-signature",
      },
    });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // Optional signature check
  if (WEBHOOK_SECRET) {
    const sig = req.headers.get("x-geniuspay-signature") ?? req.headers.get("x-webhook-secret");
    if (sig !== WEBHOOK_SECRET) {
      console.warn("[geniuspay-webhook] Invalid signature header");
      // Still respond 200 — but skip processing
      return new Response(JSON.stringify({ received: true, processed: false }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
  }

  // CRITICAL: respond 200 immediately, process in background.
  // Deno Deploy / Edge runtime: use `EdgeRuntime.waitUntil` if available, else fire-and-forget.
  const task = processWebhook(body).catch((err) => {
    console.error("[geniuspay-webhook] processWebhook failed", err);
  });

  // @ts-ignore — EdgeRuntime is provided by Supabase's Deno runtime
  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    // @ts-ignore
    EdgeRuntime.waitUntil(task);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
