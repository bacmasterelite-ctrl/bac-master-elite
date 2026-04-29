-- =============================================================================
-- BAC MASTER ELITE — GeniusPay automation, Premium gating & AI quota
-- =============================================================================
-- Idempotent : exécutable plusieurs fois sans erreur.
-- À lancer APRÈS schema_final.sql, depuis Supabase Studio > SQL Editor.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES — colonnes nécessaires au gating Premium + quota IA -------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plan                    TEXT,                       -- 'mensuel' | 'annuel' | NULL
  ADD COLUMN IF NOT EXISTS free_bot_questions_today INT     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_date      DATE;

-- Helper : un utilisateur est Premium si plan_expires_at > now()
CREATE OR REPLACE FUNCTION public.is_premium(uid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT plan_expires_at > now() FROM public.profiles WHERE id = uid),
    false
  );
$$;

-- 2. PAYMENTS — historique transactionnel GeniusPay --------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL DEFAULT 'geniuspay',
  provider_ref    TEXT NOT NULL UNIQUE,                   -- ID transaction GeniusPay (idempotence)
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan            TEXT NOT NULL CHECK (plan IN ('mensuel','annuel')),
  amount          INT  NOT NULL,                          -- montant en XOF (entiers)
  currency        TEXT NOT NULL DEFAULT 'XOF',
  status          TEXT NOT NULL CHECK (status IN ('initie','succes','echec','rembourse')),
  raw_event       JSONB,                                  -- payload webhook brut (audit)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payments_user      ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON public.payments (status);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON public.payments;
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Aucune policy d'INSERT/UPDATE côté client : seul le service_role
-- (l'Edge Function geniuspay-webhook) écrit dans cette table.

-- 3. RLS contenu — accès libre OU premium actif -------------------------------
-- Préalable : les tables courses/lessons/exercises/annales ont déjà la
-- colonne is_premium (cf. schema_final.sql). On ajoute la policy de lecture
-- conditionnelle.

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['courses','lessons','exercises','annales'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_read_published" ON public.%1$s;', t);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_read_premium_or_free" ON public.%1$s;', t);
    EXECUTE format(
      'CREATE POLICY "%1$s_read_premium_or_free" ON public.%1$s
         FOR SELECT USING (
           is_published = true
           AND (
             is_premium = false
             OR public.is_premium(auth.uid())
           )
         );', t);
  END LOOP;
END$$;

-- 4. RPC : incrémenter le quota IA quotidien (3 questions/jour gratuites) -----
-- Auto-reset au changement de jour. Renvoie la ligne mise à jour.
CREATE OR REPLACE FUNCTION public.increment_ai_question(uid UUID)
RETURNS TABLE (free_bot_questions_today INT, last_activity_date DATE, allowed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today  DATE := (now() AT TIME ZONE 'UTC')::date;
  rec    RECORD;
  is_pro BOOLEAN;
BEGIN
  SELECT * INTO rec FROM public.profiles WHERE id = uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  is_pro := COALESCE(rec.plan_expires_at > now(), false);

  -- Premium : pas de limite, on n'incrémente pas
  IF is_pro THEN
    free_bot_questions_today := COALESCE(rec.free_bot_questions_today, 0);
    last_activity_date       := COALESCE(rec.last_activity_date, today);
    allowed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Reset si nouveau jour
  IF rec.last_activity_date IS NULL OR rec.last_activity_date <> today THEN
    UPDATE public.profiles
       SET free_bot_questions_today = 1,
           last_activity_date       = today
     WHERE id = uid;
    free_bot_questions_today := 1;
    last_activity_date       := today;
    allowed := true;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Quota dépassé
  IF rec.free_bot_questions_today >= 3 THEN
    free_bot_questions_today := rec.free_bot_questions_today;
    last_activity_date       := rec.last_activity_date;
    allowed := false;
    RETURN NEXT;
    RETURN;
  END IF;

  -- Sinon on incrémente
  UPDATE public.profiles
     SET free_bot_questions_today = COALESCE(rec.free_bot_questions_today, 0) + 1,
         last_activity_date       = today
   WHERE id = uid;

  free_bot_questions_today := COALESCE(rec.free_bot_questions_today, 0) + 1;
  last_activity_date       := today;
  allowed := true;
  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_ai_question(UUID) TO authenticated;

-- 5. PROFILES — RLS minimale (lecture/écriture de soi) -----------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =============================================================================
-- FIN
-- =============================================================================
