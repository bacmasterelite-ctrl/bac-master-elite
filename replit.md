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

## Artifacts

- **`artifacts/bac-master-elite`** (web, served at `/`) — French BAC exam prep app ported from Vercel/v0. Uses Vite + React, wouter for routing, Tanstack Query, Tailwind v4, Supabase (auth + database), and Google Gemini (AI tutor). Required secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GEMINI_API_KEY`.
- **`artifacts/api-server`** (api, served at `/api`) — shared Express backend scaffold (currently unused by the BAC app, which uses Supabase directly).
- **`artifacts/mockup-sandbox`** (design) — design/mockup canvas scaffold.

## Migration notes

The original Vercel project was already a Vite + React app (not Next.js), so no framework conversion was needed — files were copied into the new artifact, additional runtime deps installed, and Supabase/Gemini secrets requested. The original tree is preserved in `.migration-backup/` (excluded via `.replitignore`).

## Vercel deployment (production target)

The app is built and previewed in Replit, then deployed to Vercel. Configuration:

- `vercel.json` at the repo root configures the build to use the monorepo's pnpm workspace and points Vercel at `artifacts/bac-master-elite/dist/public` as the static output. SPA rewrites (`/(.*) → /index.html`) prevent 404s on direct deep-link navigation.
- In the Vercel project, leave **Root Directory** as the repo root (the default) and let `vercel.json` drive the build/output paths.
- **Required environment variables on Vercel** (Project → Settings → Environment Variables, set for Production / Preview / Development):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_GEMINI_API_KEY`
  These must be re-saved on Vercel because `VITE_*` variables are baked into the bundle at build time — they are NOT read from Replit secrets at runtime.
- After the first Vercel deploy, copy the production URL into the Supabase project (**Authentication → URL Configuration → Site URL & Redirect URLs**) so auth callbacks work from the production domain.

## GeniusPay payments (automated)

Manual payment-proof uploads are gone. Stack:

- **DB schema**: run `payments_setup.sql` once in Supabase SQL Editor. Adds `profiles.{plan, plan_expires_at, free_bot_questions_today, last_activity_date}`, the `payments` table (UUID, `provider_ref UNIQUE` for idempotence), the `is_premium(uid)` SQL helper, RLS on `courses/lessons/exercises/annales` (free or premium-active users only), and the `increment_ai_question(uid)` RPC enforcing 3 questions/day for free users with auto-reset at day change.
- **Vercel Edge function** `api/create-payment.ts`: validates the user JWT via Supabase, looks up server-side prices (mensuel = 1499 XOF, annuel = 10499 XOF), calls `${GENIUSPAY_API_URL}/payments` with metadata `{ user_id, plan, expected_amount }`, and returns `checkout_url` for client-side redirect. Success URL is hard-coded to `https://bac-master-elite-bac-master-elite-2vcw5nv63.vercel.app/success`.
- **Supabase Edge function** `supabase/functions/geniuspay-webhook/index.ts`: verifies HMAC-SHA256 signature on the raw body (`x-geniuspay-signature`), validates currency=XOF and amount matches the plan price + the `expected_amount` metadata, is idempotent on `provider_ref`, and bumps `profiles.plan_expires_at` cumulatively (+30 / +365 days from `max(now, current expiry)`).
- **Required env vars on Vercel** (server-side, not `VITE_*`): `GENIUSPAY_SECRET_KEY`, `GENIUSPAY_API_URL` (optional, defaults to `https://api.geniuspay.io/v1`), `GENIUSPAY_WEBHOOK_URL` (the deployed Supabase function URL), `PUBLIC_APP_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- **Required secrets on Supabase Functions**: `GENIUSPAY_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` (`SUPABASE_URL` is provided automatically).
- Deploy the webhook with `supabase functions deploy geniuspay-webhook --no-verify-jwt` and configure the resulting URL in the GeniusPay dashboard as the webhook target.
