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

### `bac-master-elite` (web, React + Vite)

Premium French-language BAC prep platform.

- **Routing**: `wouter` v3 (Link renders the anchor itself — pass `className`/`onClick` directly to `<Link>`, do not wrap with an inner `<a>`)
- **Auth & data**: `@supabase/supabase-js` via `src/lib/supabase.ts` and `src/contexts/SupabaseAuthProvider.tsx`. Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Data hooks**: `src/lib/queries.ts` (TanStack Query, safe fallbacks when tables are empty)
- **Theme**: gradient `#1e40af → #10b981` exposed as `.bg-hero-gradient` / `.text-hero-gradient` in `src/index.css`. Tailwind v4 with HSL design tokens (primary blue, secondary green, dark sidebar)
- **Layout**: `src/components/DashboardLayout.tsx` (responsive sidebar + mobile drawer) used by all `/dashboard/*` pages
- **Routes**: `/`, `/login`, `/signup` (public-only), `/dashboard`, `/dashboard/cours`, `/dashboard/exercices`, `/dashboard/annales`, `/dashboard/tuteur-ia` (protected)
- **Charts**: Recharts (Area, Bar, Pie) on the dashboard
- **Vercel**: `vercel.json` provides SPA rewrites and the build/output config
