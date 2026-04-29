-- =============================================================================
-- BAC MASTER ELITE — Schéma SQL universel pour Supabase
-- =============================================================================
-- Ce script est IDEMPOTENT : vous pouvez l'exécuter plusieurs fois sans erreur.
-- Il crée les 4 tables principales (courses, lessons, exercises, annales),
-- leurs index, leur sécurité (RLS) et fournit des INSERT modèles à la fin.
--
-- Compatibilité avec le code TypeScript :
--   • types/colonnes EN (title, subject, content, statement, solution, year…)
--   • alias FR (titre, matiere, enonce, corrige, annee, duree…) — stockés
--     comme colonnes générées pour que `pickString(r,"titre","title")` etc.
--     trouve toujours une valeur, peu importe la langue d'écriture.
--   • is_premium (BOOL) et pdf_url (TEXT) sur chaque table de contenu.
--
-- À exécuter depuis : Supabase Studio > SQL Editor > New query > Run
-- =============================================================================

-- 1. EXTENSIONS ---------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()

-- 2. ENUM partagé pour la difficulté ------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'difficulty_level') THEN
    CREATE TYPE difficulty_level AS ENUM ('facile', 'moyen', 'difficile');
  END IF;
END$$;

-- 3. TABLE : courses ----------------------------------------------------------
-- Une matière OU un programme thématique (« Mathématiques série C », etc.)
CREATE TABLE IF NOT EXISTS public.courses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  subject     TEXT,                                    -- ex: "Mathématiques"
  serie       TEXT,                                    -- ex: "A", "C", "D", "A/C/D"
  level       TEXT,                                    -- ex: "Terminale"
  cover_url   TEXT,                                    -- image de couverture (Storage)
  pdf_url     TEXT,                                    -- syllabus PDF (Storage)
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,      -- métadonnées libres
  is_premium  BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_subject ON public.courses (subject);
CREATE INDEX IF NOT EXISTS idx_courses_serie   ON public.courses (serie);

-- 4. TABLE : lessons ----------------------------------------------------------
-- Une leçon rattachée à un cours.
CREATE TABLE IF NOT EXISTS public.lessons (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  subject     TEXT,                                    -- redondant pour requêtes rapides
  serie       TEXT,
  duration    TEXT,                                    -- ex: "20 min"
  content     TEXT,                                    -- markdown principal (rendu via ReactMarkdown)
  content_meta JSONB NOT NULL DEFAULT '{}'::jsonb,     -- pièces jointes, vidéos, etc.
  pdf_url     TEXT,                                    -- PDF téléchargeable (Storage)
  cover_url   TEXT,
  is_premium  BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course   ON public.lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_subject  ON public.lessons (subject);
CREATE INDEX IF NOT EXISTS idx_lessons_serie    ON public.lessons (serie);

-- 5. TABLE : exercises --------------------------------------------------------
-- Un exercice rattaché à un cours (et indirectement à une leçon).
CREATE TABLE IF NOT EXISTS public.exercises (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  lesson_id   UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  subject     TEXT,
  serie       TEXT,
  difficulty  difficulty_level NOT NULL DEFAULT 'moyen',
  duration    TEXT,                                    -- ex: "15 min"
  points      INT NOT NULL DEFAULT 10,
  statement   TEXT,                                    -- énoncé (markdown)
  solution    TEXT,                                    -- corrigé (markdown)
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,      -- ressources annexes
  pdf_url     TEXT,                                    -- énoncé+corrigé en PDF
  is_premium  BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT true,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exercises_course     ON public.exercises (course_id);
CREATE INDEX IF NOT EXISTS idx_exercises_lesson     ON public.exercises (lesson_id);
CREATE INDEX IF NOT EXISTS idx_exercises_subject    ON public.exercises (subject);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON public.exercises (difficulty);

-- 6. TABLE : annales ----------------------------------------------------------
-- Sujets d'examens officiels avec leur corrigé.
CREATE TABLE IF NOT EXISTS public.annales (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  subject     TEXT NOT NULL,                           -- ex: "Mathématiques"
  serie       TEXT NOT NULL,                           -- ex: "C"
  year        INT  NOT NULL,                           -- ex: 2024
  session     TEXT,                                    -- ex: "Juin", "Septembre"
  duration    TEXT,                                    -- ex: "4h"
  statement   TEXT,                                    -- sujet (markdown)
  solution    TEXT,                                    -- corrigé (markdown)
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  pdf_url     TEXT,                                    -- sujet PDF (Storage)
  pdf_correction_url TEXT,                             -- corrigé PDF (Storage)
  is_premium  BOOLEAN NOT NULL DEFAULT true,           -- annales = premium par défaut
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_annales_subject ON public.annales (subject);
CREATE INDEX IF NOT EXISTS idx_annales_serie   ON public.annales (serie);
CREATE INDEX IF NOT EXISTS idx_annales_year    ON public.annales (year DESC);

-- 7. ALIAS FR — colonnes générées (lecture seule) ----------------------------
-- Permettent à pickString(r,"titre","title") de toujours trouver la valeur,
-- sans dupliquer la donnée et sans casser le code FR existant.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS titre   TEXT GENERATED ALWAYS AS (title)   STORED,
  ADD COLUMN IF NOT EXISTS matiere TEXT GENERATED ALWAYS AS (subject) STORED;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS titre   TEXT GENERATED ALWAYS AS (title)    STORED,
  ADD COLUMN IF NOT EXISTS matiere TEXT GENERATED ALWAYS AS (subject)  STORED,
  ADD COLUMN IF NOT EXISTS duree   TEXT GENERATED ALWAYS AS (duration) STORED;

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS titre      TEXT GENERATED ALWAYS AS (title)     STORED,
  ADD COLUMN IF NOT EXISTS matiere    TEXT GENERATED ALWAYS AS (subject)   STORED,
  ADD COLUMN IF NOT EXISTS enonce     TEXT GENERATED ALWAYS AS (statement) STORED,
  ADD COLUMN IF NOT EXISTS corrige    TEXT GENERATED ALWAYS AS (solution)  STORED,
  ADD COLUMN IF NOT EXISTS difficulte TEXT GENERATED ALWAYS AS (difficulty::text) STORED,
  ADD COLUMN IF NOT EXISTS duree      TEXT GENERATED ALWAYS AS (duration)  STORED;

ALTER TABLE public.annales
  ADD COLUMN IF NOT EXISTS titre   TEXT GENERATED ALWAYS AS (title)     STORED,
  ADD COLUMN IF NOT EXISTS matiere TEXT GENERATED ALWAYS AS (subject)   STORED,
  ADD COLUMN IF NOT EXISTS annee   INT  GENERATED ALWAYS AS (year)      STORED,
  ADD COLUMN IF NOT EXISTS sujet   TEXT GENERATED ALWAYS AS (statement) STORED,
  ADD COLUMN IF NOT EXISTS corrige TEXT GENERATED ALWAYS AS (solution)  STORED,
  ADD COLUMN IF NOT EXISTS duree   TEXT GENERATED ALWAYS AS (duration)  STORED;

-- 8. TRIGGER updated_at -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['courses','lessons','exercises','annales'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON public.%1$s;', t);
    EXECUTE format(
      'CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON public.%1$s
         FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();', t);
  END LOOP;
END$$;

-- 9. ROW LEVEL SECURITY -------------------------------------------------------
-- Lecture publique pour le contenu publié, écriture réservée au service_role.
ALTER TABLE public.courses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annales   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['courses','lessons','exercises','annales'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_read_published" ON public.%1$s;', t);
    EXECUTE format(
      'CREATE POLICY "%1$s_read_published" ON public.%1$s
         FOR SELECT USING (is_published = true);', t);
  END LOOP;
END$$;

-- 10. EXEMPLES D'INSERT (à adapter ou décommenter) ---------------------------
-- Important : pour le `pdf_url`, uploadez d'abord votre fichier dans
--   Supabase Studio > Storage > Bucket "content" (créez-le, public ou signé)
-- puis copiez l'URL publique de la forme :
--   https://<PROJECT_REF>.supabase.co/storage/v1/object/public/content/<path>.pdf

/* ===== COURSES ===========================================================
INSERT INTO public.courses (title, description, subject, serie, level,
                            cover_url, pdf_url, is_premium, content)
VALUES
  ('Analyse — Fonctions et limites',
   'Programme complet d''analyse pour la Terminale C.',
   'Mathématiques', 'C', 'Terminale',
   'https://<PROJECT>.supabase.co/storage/v1/object/public/content/covers/maths-c.jpg',
   'https://<PROJECT>.supabase.co/storage/v1/object/public/content/syllabus/maths-c.pdf',
   false,
   '{"chapters": ["Limites", "Continuité", "Dérivation", "Intégrales"]}'::jsonb);
*/

/* ===== LESSONS ===========================================================
INSERT INTO public.lessons (course_id, title, description, subject, serie,
                            duration, content, pdf_url, is_premium, position)
VALUES
  ((SELECT id FROM public.courses WHERE title = 'Analyse — Fonctions et limites' LIMIT 1),
   'Limite d''une fonction en l''infini',
   'Définition rigoureuse, théorèmes de comparaison et exemples résolus.',
   'Mathématiques', 'C', '20 min',
   '## Définition

Une fonction f admet pour limite L en +∞ si... (markdown)',
   'https://<PROJECT>.supabase.co/storage/v1/object/public/content/lessons/limites-infini.pdf',
   false, 1);
*/

/* ===== EXERCISES =========================================================
INSERT INTO public.exercises (course_id, lesson_id, title, subject, serie,
                              difficulty, duration, points,
                              statement, solution, pdf_url, is_premium)
VALUES
  ((SELECT id FROM public.courses WHERE title = 'Analyse — Fonctions et limites' LIMIT 1),
   NULL,
   'Étude de f(x) = x³ − 3x + 2',
   'Mathématiques', 'C', 'moyen', '20 min', 15,
   '**Énoncé.** Étudier les variations de f sur ℝ et préciser les extrema.',
   '**Corrigé.** f''(x) = 3(x−1)(x+1). f croissante sur ]−∞;−1] et [1;+∞[, décroissante sur [−1;1]. Max local f(−1)=4, min local f(1)=0.',
   'https://<PROJECT>.supabase.co/storage/v1/object/public/content/exercises/etude-fonction.pdf',
   false);
*/

/* ===== ANNALES ===========================================================
INSERT INTO public.annales (course_id, title, subject, serie, year, session,
                            duration, statement, solution,
                            pdf_url, pdf_correction_url, is_premium)
VALUES
  (NULL,
   'BAC Mathématiques — Session Juin 2024',
   'Mathématiques', 'C', 2024, 'Juin', '4h',
   '**Exercice 1 (8 pts).** Soit la suite (u_n)... ',
   '**Corrigé Exercice 1.** On montre par récurrence que u_n = ...',
   'https://<PROJECT>.supabase.co/storage/v1/object/public/content/annales/bac-c-2024-sujet.pdf',
   'https://<PROJECT>.supabase.co/storage/v1/object/public/content/annales/bac-c-2024-corrige.pdf',
   true);
*/

-- =============================================================================
-- FIN DU SCHÉMA
-- Pour réinitialiser COMPLÈTEMENT (dangereux !) :
--   DROP TABLE IF EXISTS public.annales, public.exercises, public.lessons, public.courses CASCADE;
-- =============================================================================
