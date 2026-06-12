# CRM_Local — OHB Change Management (localStorage-only rebuild)

A clean ground-up rebuild of the OHB Change Request Management app. **Zero
backend, zero database** — all data lives in the browser's `localStorage`.

## Why this exists

The original `CRM_main` mixed a React frontend with an Express server, a
PostgreSQL schema, Vercel serverless functions, and a fetch interceptor
that bolted on a localStorage fallback. This rebuild is the same UI/UX,
but with a single layer: React + Vite + a typed `db.ts` module that owns
all reads and writes.

## Features

- **Auth** — seed users, one-click quick-login (`admin/admin123`, `it/it123`, `risk/risk123`, `comp/comp123`, `cab/cab123`)
- **Dashboard** — KPIs + recharts (status pie, priority bar, monthly trend)
- **Change Requests** — list with search/filters; detail view with BRD,
  workflow steps, comments, audit; 4-step wizard for creating new
  (Basic info → AI BRD → Workflow → Review)
- **AI-assisted BRD generation** — Google Gemini via `@google/genai`,
  with workflow recommendation
- **Audit trail** — every action persisted and viewable
- **Dark mode** + responsive (mobile-first sidebar with overlay)

## Run locally

```bash
cp .env.example .env.local       # paste your VITE_API_KEY
npm install
npm run dev                      # http://localhost:5180
```

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. In **Settings → Environment Variables**, add:
   - `VITE_API_KEY` — your Gemini API key
   - `VITE_ADMIN_EMAIL` — contact email (optional)
4. Build settings auto-detected (Vite). No serverless functions needed —
   pure static SPA.

## Architecture

```
src/
├── data/                   # The entire data layer
│   ├── types.ts            # All shared types
│   ├── db.ts               # localStorage CRUD: Users, Requests, Audit, Session, Theme
│   ├── auth.ts             # login/logout + subscriptions
│   └── workflowTemplates.ts
├── services/
│   └── ai.ts               # Gemini integration (browser → Gemini)
├── components/
│   ├── Layout.tsx          # Sidebar + topbar + offline banner
│   └── ui/                 # Button, Card, Input, Select, Badge, Empty
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── ChangeRequests.tsx
│   ├── NewChangeRequest.tsx
│   ├── ChangeRequestDetail.tsx
│   └── AuditTrail.tsx
├── styles/index.css        # Tailwind v4 with @theme tokens
├── App.tsx                 # HashRouter + RequireAuth + routes
└── main.tsx
```

## Data lifetime

All keys are under the `crm_` namespace:
- `crm_users`, `crm_requests`, `crm_audit_logs`, `crm_current_user`, `crm_theme`

To wipe: open DevTools → Application → Local Storage → clear all `crm_*` keys, or
call `DB.reset()` from the console:
```js
const { DB } = await import('/src/data/db.ts'); DB.reset();
```
