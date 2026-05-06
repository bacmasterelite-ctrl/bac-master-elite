import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

async function sendEmail(to: string, subject: string, html: string) {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "BAC Master Elite <onboarding@resend.dev>",
      to, subject, html
    })
  })
}

serve(async () => {
  const h72ago = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()

  // NUDGE 1 : Free plan depuis 72h
  const { data: freeUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("plan", "free")
    .eq("free_nudge_sent", false)
    .lte("created_at", h72ago)

  for (const u of freeUsers || []) {
    await sendEmail(u.email, "⏳ Passe au niveau supérieur !", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:#f59e0b;padding:24px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Il est temps de progresser !</h1>
        </div>
        <div style="padding:32px">
          <p>Salut <strong>${u.full_name || "étudiant(e)"}</strong>,</p>
          <p>Tu es sur BAC Master Elite depuis 72h. Passe au <strong>Premium</strong> pour débloquer tous les cours et corrigés !</p>
          <a href="${Deno.env.get("SITE_URL")}/upgrade"
             style="display:inline-block;margin-top:16px;padding:12px 24px;background:#f59e0b;color:white;border-radius:6px;text-decoration:none;font-weight:bold">
            Voir les offres →
          </a>
        </div>
      </div>
    `)
    await supabase.from("profiles").update({ free_nudge_sent: true }).eq("id", u.id)
  }

  // NUDGE 2 : Inactif depuis 72h
  const { data: inactiveUsers } = await supabase
    .from("profiles")
    .select("id, email, full_name, serie")
    .eq("inactive_nudge_sent", false)
    .lte("last_course_viewed_at", h72ago)
    .not("last_course_viewed_at", "is", null)

  for (const u of inactiveUsers || []) {
    const { data: cours } = await supabase
      .from("lessons")
      .select("id, title, subject")
      .eq("serie", u.serie)
      .limit(1)
      .single()

    await sendEmail(u.email, "📖 Tu nous manques !", `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
        <div style="background:#1a56db;padding:24px;border-radius:8px 8px 0 0">
          <h1 style="color:white;margin:0">Tu nous manques, ${u.full_name || "étudiant(e)"} !</h1>
        </div>
        <div style="padding:32px">
          <p>Ça fait 72h sans cours. Le BAC n'attend pas !</p>
          <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
            <strong>${cours?.subject || "Cours recommandé"}</strong><br/>
            ${cours?.title || "Continue tes révisions"}
          </div>
          <a href="${Deno.env.get("SITE_URL")}/cours/${cours?.id || ""}"
             style="display:inline-block;margin-top:16px;padding:12px 24px;background:#1a56db;color:white;border-radius:6px;text-decoration:none;font-weight:bold">
            Reprendre les cours →
          </a>
        </div>
      </div>
    `)
    await supabase.from("profiles").update({ inactive_nudge_sent: true }).eq("id", u.id)
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 })
})
