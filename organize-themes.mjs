import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function main() {
  console.log("Chargement des leçons...");
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id, title, subject, serie")
    .is("theme_id", null);

  if (error) { console.error("Erreur:", error); process.exit(1); }
  console.log(`${lessons.length} leçons trouvées.`);

  const bySubject = {};
  for (const l of lessons) {
    const mat = l.matiere ?? l.subject ?? "Autre";
    if (!bySubject[mat]) bySubject[mat] = [];
    bySubject[mat].push({ id: l.id, titre: l.title ?? "Sans titre" });
  }

  for (const [subject, subLessons] of Object.entries(bySubject)) {
    console.log(`\nAnalyse de "${subject}" (${subLessons.length} leçons)...`);
    const titresList = subLessons.map((l, i) => `${i + 1}. [ID:${l.id}] ${l.titre}`).join("\n");
    const prompt = `Tu es un expert en programmes scolaires africains (BAC).
Voici une liste de leçons de la matière "${subject}" :
${titresList}
Regroupe ces leçons en thèmes cohérents (entre 3 et 8 thèmes max).
Réponds UNIQUEMENT en JSON valide, sans texte avant ou après, sans balises markdown :
{"themes":[{"name":"Nom du thème","order_index":1,"lesson_ids":["uuid1","uuid2"]}]}`;

    let result;
    try {
      const msg = await anthropic.messages.create({
        model: "claude-opus-4-5",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      });
      result = JSON.parse(msg.content[0].text.trim());
    } catch (e) {
      console.error(`Erreur pour "${subject}":`, e.message);
      continue;
    }

    for (const theme of result.themes) {
      const { data: inserted, error: tErr } = await supabase
        .from("themes")
        .insert({ name: theme.name, subject, order_index: theme.order_index })
        .select("id")
        .single();
      if (tErr) { console.error(`Erreur thème "${theme.name}":`, tErr.message); continue; }
      console.log(`  Thème créé : "${theme.name}" (${theme.lesson_ids.length} leçons)`);
      if (theme.lesson_ids.length > 0) {
        await supabase.from("lessons").update({ theme_id: inserted.id }).in("id", theme.lesson_ids);
      }
    }
  }
  console.log("\nOrganisation terminée !");
}

main();
