import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function generateExercise(lesson) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `Tu es un professeur de BAC en Cote d Ivoire. Cree un exercice avec corrige pour la lecon suivante. Reponds UNIQUEMENT en JSON valide sans backticks : {"statement": "enonce en markdown", "solution": "corrige en markdown"}\n\nLecon : ${lesson.title}\nMatiere : ${lesson.subject}\nSerie : ${lesson.serie}`
      }]
    })
  });
  const data = await response.json();
  const text = data.content[0].text;
  return JSON.parse(text);
}

async function main() {
  const { data: lessons } = await supabase.from('lessons').select('id, title, subject, serie').limit(100);
  const { data: existing } = await supabase.from('exercises').select('title, subject');
  const existingSet = new Set(existing.map(e => `${e.title}|${e.subject}`));

  let count = 0;
  for (const lesson of lessons) {
    const key = `${lesson.title}|${lesson.subject}`;
    if (existingSet.has(key)) { console.log(`Skip : ${lesson.title}`); continue; }
    try {
      console.log(`Generating : ${lesson.title}`);
      const exercise = await generateExercise(lesson);
      await supabase.from('exercises').insert({ title: lesson.title, subject: lesson.subject, serie: lesson.serie, statement: exercise.statement, solution: exercise.solution, is_premium: false, is_free: true });
      count++;
      console.log(`OK : ${lesson.title}`);
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) { console.error(`Erreur ${lesson.title}:`, err.message); }
  }
  console.log(`Termine ! ${count} exercices generes.`);
}

main();
