import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const payload = await req.json()
  const user = payload.record

  const email = user.email
  const name = user.raw_user_meta_data?.full_name || "étudiant(e)"
  const id = user.id

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "BAC Master Elite <onboarding@resend.dev>",
      to: email,
      subject: "🎓 Bienvenue sur BAC Master Elite !",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
          <div style="background:#1a56db;padding:24px;border-radius:8px 8px 0 0">
            <h1 style="color:white;margin:0">BAC Master Elite 🎓</h1>
          </div>
          <div style="padding:32px;background:#f9fafb">
            <h2>Bienvenue, ${name} !</h2>
            <p>Tu as maintenant accès à des cours structurés par série et matière pour préparer ton BAC en Côte d'Ivoire.</p>
            <ul>
              <li>📚 Cours par série (A, C, D...)</li>
              <li>📝 Exercices et annales</li>
              <li>📊 Suivi de progression</li>
            </ul>
            <a href="${Deno.env.get("SITE_URL")}/cours"
               style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a56db;color:white;border-radius:6px;text-decoration:none;font-weight:bold">
              Commencer à réviser →
            </a>
          </div>
          <div style="padding:16px;text-align:center;color:#9ca3af;font-size:12px">
            BAC Master Elite · Côte d'Ivoire
          </div>
        </div>
      `
    })
  })

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )
  await supabase.from("profiles").update({ welcome_email_sent: true }).eq("id", id)

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
