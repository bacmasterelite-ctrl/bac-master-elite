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
