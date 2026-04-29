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

Fichiers nouveaux : `src/lib/extensions.ts`, `src/lib/quizBank.ts`, `src/components/{RefTracker,TestimonialsCarousel,TeachersSection}.tsx`, `src/pages/{Quiz,Parrainage}.tsx`.
Fichiers édités (additif) : `src/App.tsx`, `src/components/DashboardLayout.tsx`, `src/pages/Landing.tsx`, `src/pages/Dashboard.tsx`.
