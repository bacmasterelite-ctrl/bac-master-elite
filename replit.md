# BAC MASTER ELITE

## Overview
Educational platform for African BAC students (séries A, C, D). Features cours, exercises (QCM auto-corrigés), annales (PDF, premium), AI tutor (text + image for premium), methodology cards, ranking, manual Mobile Money payment workflow (Wave / MTN / Orange) with screenshot upload + admin validation, and admin dashboard with charts.

## Stack
- **Frontend**: React + Vite, TailwindCSS, shadcn/ui, framer-motion, recharts, wouter, TanStack Query
- **Backend**: Express 5 (artifacts/api-server), Drizzle ORM, PostgreSQL
- **Auth**: Clerk (`@clerk/react`, `@clerk/express`)
- **AI**: OpenAI via `@workspace/integrations-openai-ai-server` (gpt-5.2)
- **Storage**: Replit Object Storage (proof-of-payment uploads, AI tutor images)
- **API contract**: Zod schemas in `lib/api-zod`, Orval-generated React Query hooks in `lib/api-client-react`

## Structure
- `artifacts/bac-master-elite` — React frontend (sidebar layout, 17 pages, French UI)
- `artifacts/api-server` — Express API (profile, content, payments, admin, ai, storage)
- `lib/api-zod`, `lib/api-client-react`, `lib/db` — shared
- DB schema: `profiles`, `subjects`, `lessons`, `exercises`, `annals`, `methodologyCards`, `payments`, `exerciseResults`

## Conventions
- First registered user is auto-promoted to admin (see `ensureProfile` in `artifacts/api-server/src/routes/profile.ts`)
- Premium price: 5000 XOF, payment numbers hardcoded in `payments.ts`
- AI tutor only sends `image_url` if user is premium
- Seed: `cd artifacts/api-server && pnpm exec tsx src/scripts/seed.ts`
