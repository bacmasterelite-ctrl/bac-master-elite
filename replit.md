# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## BAC MASTER ELITE — Recent Additions (additive-only)

New features added without modifying existing logic:

- **Points système global** — `profiles.points` incremented via `useAddPointsToProfile` (extensions.ts). +10 par bonne réponse quiz, +10 par clic de parrainage.
- **Quiz par série** — `/dashboard/quiz` (Quiz.tsx) avec banque de questions A/C/D (quizBank.ts). Écrit dans `quiz_results`, débite `daily_usage.quiz_count` (limite gratuite = 3/jour), crédite les points.
- **Parrainage** — `/dashboard/parrainage` (Parrainage.tsx). Lien `?ref=CODE` tracké globalement par `RefTracker` (App.tsx). Table `invitations` (clicks compteur). Idempotent par `localStorage`.
- **Témoignages dynamiques** — `TestimonialsCarousel` lit/écrit `reviews`. Affiché en bas de Landing (lecture seule) et de Dashboard (avec formulaire). Mélange 6 noms ivoiriens fictifs + vrais avis utilisateurs.
- **Recommandations professeurs** — `TeachersSection` statique avec 4 enseignants ivoiriens fictifs. Sur Landing.
- **Limites freemium** — `daily_usage` table (quiz_count colonne nouvelle uniquement, lessons_count/chat_count existants pas touchés).

Tables Supabase attendues : `invitations`, `reviews`, `quiz_results`, `daily_usage`. Si absentes, le code log un avertissement sans crasher.

### Setup Supabase requis (à appliquer dans SQL Editor)
1. `.local/sql/rls_policies.sql` — politiques RLS reviews + invitations
2. `.local/sql/additional_setup.sql` — contrainte unique reviews + RPC `register_referral_click`
3. `.local/sql/referral_v2.sql` — colonne `profiles.referrer_id` + RPC `register_referral_signup` (parrainage v2 : `?ref=user_id`)

### Affichage leçon
- `Lecon.tsx` affiche le contenu HTML+SVG via `dangerouslySetInnerHTML` (plus ReactMarkdown)
- SVG : `[&_svg]:w-full [&_svg]:h-auto` — respecte le viewBox en pleine largeur
- Bouton "Télécharger PDF" appelle `window.print()` (réservé Premium) ; CSS `@media print` dans `index.css` masque navbar/boutons, garde les SVG nets
- Bouton Retour → `/dashboard/cours?subject=<matière>` (la page Cours filtre déjà par `?subject=`)

### Limites non-premium (3 leçons/jour + 3 questions chatbot/jour)
- Composant `PremiumLimitModal` (`src/components/PremiumLimitModal.tsx`) réutilisable (types : `"lessons"` | `"chatbot"`)
- Leçons : `useCheckCourseAccess` (RPC `check_and_increment_course`) → si `!allowed`, modal + écran bloqué
- Chatbot : `useIncrementAIQuestion` (RPC `increment_ai_question`) → si `!res.allowed` ou `blockedByQuota`, modal
- La limite est vérifiée côté client ; le RPC est SECURITY DEFINER (bloquage côté DB)

### Reset password
- Bouton "Mot de passe oublié ?" sur `/login` ouvre un dialogue → `supabase.auth.resetPasswordForEmail(email, { redirectTo: <origin>/reset-password })`
- Page `/reset-password` (publique, hors PublicOnlyRoute) → `supabase.auth.updateUser({ password })` quand session recovery présente

### Parrainage v2
- Lien : `?ref=<user.id UUID>` (plus de table `invitations`)
- `RefTracker` capture le ref dans localStorage (TTL 30 jours), `SupabaseAuthProvider.ensureProfile` appelle le RPC `register_referral_signup` après l'upsert du profil → +10 points au parrain (idempotent, anti auto-parrainage)
- Stats sur `/dashboard/parrainage` = `count(profiles WHERE referrer_id = me)` × 10

### GeniusPay
- `api/create-payment.ts` — Vercel serverless (utilise env `GENIUSPAY_*`, fallback sur ancienne orthographe `GENUISPAY_*`)
- `supabase/functions/geniuspay-webhook/index.ts` — Edge Function à déployer via `supabase functions deploy geniuspay-webhook --no-verify-jwt`
- Webhook répond 200 instantané puis traite en arrière-plan (`EdgeRuntime.waitUntil`)
- Extraction tolérante du metadata + status (probe toutes les structures GeniusPay possibles)

Fichiers nouveaux : `src/lib/extensions.ts`, `src/lib/quizBank.ts`, `src/components/{RefTracker,TestimonialsCarousel,TeachersSection}.tsx`, `src/pages/{Quiz,Parrainage}.tsx`.
Fichiers édités (additif) : `src/App.tsx`, `src/components/DashboardLayout.tsx`, `src/pages/Landing.tsx`, `src/pages/Dashboard.tsx`.
