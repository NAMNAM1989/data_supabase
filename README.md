# NAM NAM DATA

Master Data Management application for Nam Nam Logistics.

## Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS, shadcn/ui
- Supabase (Auth + PostgreSQL)
- TanStack Query, React Hook Form, Zod

## Getting started

```bash
cp .env.example .env.local
# Fill Supabase URL and keys from project: namnam-customers

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run test` | Vitest unit tests |
| `npm run ci` | Full CI pipeline |

## Supabase setup

Bootstrap admin (one-time):

```bash
node scripts/bootstrap-admin.mjs
```

Hoặc xem `docs/09_BOOTSTRAP.md` cho hướng dẫn đầy đủ (Railway + env).

## Documentation

See `docs/` for architecture, database contract, security plan, and phase roadmap.

## Phase status

- Phase 0–1: Audit + architecture docs ✅
- Phase 2: Foundation ✅
- Phase 3: Customer domain ✅
- Phase 4: Transport domain ✅
- Phase 5: Data tools (import, export, search, duplicates) ✅
- Phase 6: System (audit, users, settings) ✅
- Phase 7: Destinations + Railway deploy config ✅

## Railway deployment

### Prerequisites

- GitHub repo connected to Railway
- Supabase project `data_supabase` (ref `cuakkgauyutapdznqhge`) with env keys
- CI passing on `main`

### Live (production)

- **URL:** https://datasupabase-production.up.railway.app
- **Health:** `GET /api/health`
- **Project Railway:** `data_supabase` (ID `f548623f-b86b-4c72-afb5-09a93e2ff047`)

### Setup

1. Create a **Web Service** on [Railway](https://railway.app)
2. Connect this repository (branch: `main`)
3. Set **Dockerfile** builder (uses `Dockerfile` + `railway.toml`)
4. Add environment variables:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + runtime |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build + runtime |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime only |

5. Railway auto-sets `PORT` — app listens on `0.0.0.0:3000`

### Verify after deploy

```bash
curl https://<your-railway-domain>/api/health
```

Expected: `{"status":"ok","app":"NAM NAM DATA",...}`

### Manual smoke test

1. Open `/login` → sign in as admin
2. Dashboard shows counts
3. Create a test customer → verify in Supabase
4. Archive test customer

### Rollback

Use Railway dashboard → **Deployments** → redeploy previous version.
