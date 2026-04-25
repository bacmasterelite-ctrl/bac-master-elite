-- ============================================================
-- BAC MASTER ELITE — Modèle universel d'ajout de cours
-- Copiez ce fichier, modifiez les valeurs marquées << ... >>
-- puis collez dans Supabase → SQL Editor → Run
-- ============================================================
--
-- COLONNES UTILISÉES PAR LE FRONTEND (vérifié dans Cours.tsx) :
--   title       text  ← obligatoire
--   subject     text  ← obligatoire (Philosophie, Mathématiques, etc.)
--   serie       text  ← 'A' | 'C' | 'D'   (texte, PAS l'UUID)
--   duration    text  ← '45 min', '1h30', etc.
--   is_free     bool  ← true = gratuit, false = Premium
--   content     text  ← Markdown affiché dans la modale
--   progress    int   ← 0-100 (pilote le bouton Continuer)
--
-- ⚠️ slug, order_index, description : NON utilisés par le code actuel.
-- ============================================================


-- ----- EXEMPLE : Cours « La Conscience » (Philosophie, Série D) -----
-- ID de série fourni : 03f3420a-4620-499a-872a-803e9eca7b3a
-- → On résout automatiquement le texte de série depuis cet UUID
--   (fonctionne même si vous changez d'ID plus tard).

-- 1) NETTOYAGE : supprime ce cours s'il existe déjà (re-import sûr)
delete from public.lessons
where title = 'La Conscience'
  and subject = 'Philosophie';

-- 2) INSERTION
insert into public.lessons (title, subject, serie, duration, is_free, progress, content)
values (
  'La Conscience',
  'Philosophie',
  coalesce(
    (select name from public.series where id = '03f3420a-4620-499a-872a-803e9eca7b3a'),
    'D'   -- fallback si la table series n'existe pas encore
  ),
  '60 min',
  true,                                  -- true = teaser gratuit | false = réservé Premium
  0,                                     -- 0 = nouveau cours
  $md$
## Introduction

La **conscience** est ce qui nous distingue de la simple existence biologique : c'est le pouvoir de se savoir vivant, de réfléchir sur soi et sur le monde. Elle est au cœur de la philosophie morale et de la liberté humaine.

## Définition

> "La conscience est la connaissance immédiate que l'esprit a de ses propres états et de ses actes." — *Larousse*

On distingue deux formes :
- **Conscience psychologique** : perception immédiate de soi (je sais que je pense, que je ressens).
- **Conscience morale** : faculté de juger le bien et le mal dans nos actions.

## Auteurs clés

- **Descartes** — *« Je pense, donc je suis »* : la conscience comme première certitude.
- **Kant** — la conscience morale est la voix intérieure de la raison.
- **Freud** — révèle l'inconscient : la conscience n'est qu'une partie de notre vie psychique.
- **Sartre** — la conscience est libre, donc responsable de ses choix.

## Méthode pour la dissertation

1. **Définir** les termes du sujet (conscience ≠ inconscience ≠ inconscient).
2. **Problématiser** : la conscience nous libère-t-elle ou nous condamne-t-elle ?
3. **Plan dialectique** : Thèse → Antithèse → Synthèse.
4. **Citer** au moins deux auteurs avec une analyse personnelle.

## Exemple concret (Côte d'Ivoire)

Quand un élève triche au BAC, sa conscience morale lui rappelle qu'il enfreint le règlement. C'est cette voix intérieure — étudiée par Kant — qui distingue l'action humaine de l'instinct animal.

## Conseils pour le BAC

- Apprenez **3 citations clés** (Descartes, Kant, Sartre) — toujours utiles.
- Rédigez une **introduction percutante** : accroche + définition + problématique + annonce du plan.
- Évitez les exemples trop personnels — préférez des exemples universels (histoire, actualité).
- Relisez votre copie : 5 minutes consacrées à corriger les fautes peuvent vous faire gagner 2 points.

## À retenir

La conscience est à la fois un **don** (elle nous rend libres) et un **fardeau** (elle nous rend responsables). Cette tension est le cœur de toute réflexion philosophique sur l'homme.
$md$
);


-- ============================================================
-- 🎯 MODÈLE GÉNÉRIQUE — Copiez ce bloc pour CHAQUE nouveau cours
-- ============================================================
/*
delete from public.lessons
where title = '<< TITRE DU COURS >>'
  and subject = '<< MATIÈRE >>';

insert into public.lessons (title, subject, serie, duration, is_free, progress, content)
values (
  '<< TITRE DU COURS >>',                -- ex: 'Les Suites Numériques'
  '<< MATIÈRE >>',                       -- ex: 'Mathématiques' (doit matcher la liste autorisée)
  '<< A | C | D >>',                     -- ex: 'D'
  '<< DURÉE >>',                         -- ex: '90 min'
  false,                                 -- true = gratuit (teaser) | false = Premium
  0,                                     -- progression initiale
  $md$
## Introduction
…votre contenu en Markdown ici…

## Définitions
- Terme 1 : …
- Terme 2 : …

## Méthode
1. Étape 1
2. Étape 2

## Exemple concret
…

## Conseils pour le BAC
- Astuce 1
- Astuce 2
$md$
);
*/

-- ============================================================
-- 💡 ASTUCES
-- ============================================================
-- • Le délimiteur $md$ … $md$ permet d'écrire du Markdown sans échapper les apostrophes.
-- • Pour MASSE : enchaînez plusieurs blocs insert dans le même Run.
-- • Pour rendre un cours GRATUIT (teaser) : is_free = true.
--   Pour le réserver aux Premium : is_free = false.
-- • Pour vérifier après import :
--     select id, title, subject, serie, is_free from public.lessons order by created_at desc;
