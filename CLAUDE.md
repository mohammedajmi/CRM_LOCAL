# CRM_Local — Claude Context

## Purpose
Clean ground-up rebuild of the OHB Change Request Management app. Pure
localStorage data layer, no backend, no DB, no serverless functions.
Designed to deploy to Vercel as a static SPA.

## Status
v1 — Dashboard, Change Requests (list/new/detail), Audit Trail, Login.
Skips Incidents, Suggestions, Admin Settings, Access Requests, Reports
(present in CRM_main but out of scope here).

## Tech Stack
- Frontend: React 18 + Vite 5 + TypeScript + react-router-dom v6 (HashRouter)
- Styles: Tailwind v4 (via `@tailwindcss/postcss`), CSS custom properties
- Charts: recharts
- Icons: lucide-react
- AI: `@google/genai` direct browser → Gemini (requires `VITE_API_KEY`)
- Data: pure `localStorage` (no fetch, no Express, no Postgres)

## Personal OS Context
Lives at `01_Apps/CRM_Local/`. Sibling to `CRM_main` (the original app)
but architecturally distinct — single-layer data, deployable to Vercel
with zero infra.

## Design System Compliance
Uses DataLens tokens (`brand-*`, `accent-*`, `slate-850`) directly in
`src/styles/index.css` via Tailwind v4 `@theme` block. Same palette and
typography as CRM_main.

## Key files
- `src/data/db.ts` — all reads/writes (Users, Requests, Audit, Session, Theme)
- `src/data/auth.ts` — login/logout subscription model
- `src/services/ai.ts` — Gemini BRD generation + workflow suggestion
- `src/App.tsx` — HashRouter routes + RequireAuth guard

## Environment Variables
- `VITE_API_KEY` — Gemini API key (required for AI features)
- `VITE_ADMIN_EMAIL` — contact email shown in offline banner (defaults to mohammed.alajmi@ohb.co.om)

## Run
```bash
npm run dev      # http://localhost:5180
npm run build    # static SPA in dist/
```
