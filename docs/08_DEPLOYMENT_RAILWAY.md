# NAM NAM DATA — Railway Deployment Plan

## 1. Deployment target

```text
GitHub Repository
       │
       ▼ (push to main)
GitHub Actions CI (lint, typecheck, test, build)
       │
       ▼ (pass)
Railway Auto-Deploy
       │
       ▼
Next.js Production App
       │
       ▼
Supabase (namnam-customers)
```

---

## 2. Railway project setup

| Setting | Value |
|---|---|
| Service type | Web |
| Builder | Nixpacks (default) hoặc Dockerfile |
| Root directory | `/` |
| Start command | `npm start` (Next.js standalone) |
| Health check | `/api/health` |
| Restart policy | ON_FAILURE, max 3 retries |
| Region | Gần ap-northeast-2 (Supabase Seoul) nếu có |

---

## 3. Environment variables

| Variable | Scope | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Build + Runtime | ✅ |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Build + Runtime | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime only (server) | ✅ |
| `NODE_ENV` | Runtime | production |
| `PORT` | Runtime | Railway auto-set |

**Không commit** `.env` — dùng Railway Variables + `.env.example` in repo.

### .env.example

```env
NEXT_PUBLIC_SUPABASE_URL=https://cuakkgauyutapdznqhge.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 4. Next.js production config

```javascript
// next.config.ts
const nextConfig = {
  output: 'standalone', // Railway-optimized
};
```

Health endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

---

## 5. GitHub integration

1. Connect Railway to GitHub repo
2. Production branch: `main`
3. Optional preview: `develop` branch → staging service
4. Auto-deploy on push after CI pass

### Branch strategy

```text
main      → production (Railway prod)
develop   → staging (Railway staging, optional)
feature/* → no auto-deploy
```

---

## 6. Dockerfile (alternative to Nixpacks)

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## 7. Pre-deploy checklist

- [ ] `npm run build` pass locally
- [ ] Env vars set on Railway
- [ ] Supabase URL + keys verified
- [ ] RLS policies applied (not open write)
- [ ] Admin user exists
- [ ] Health check responds 200
- [ ] Auth login works on production URL
- [ ] No secrets in client bundle

---

## 8. Post-deploy verification

```bash
# Health
curl https://<railway-domain>/api/health

# Auth smoke (manual)
# 1. Open /login
# 2. Login as admin
# 3. Dashboard loads counts
# 4. Create test customer → verify in Supabase
# 5. Delete test customer (archive)
```

---

## 9. Monitoring & logging

| Concern | Solution |
|---|---|
| App logs | Railway logs dashboard |
| Errors | Console.error + future Sentry (optional) |
| Supabase | Supabase dashboard logs |
| Uptime | Railway health check + external monitor (optional) |

---

## 10. Rollback strategy

1. Railway: redeploy previous deployment (one-click)
2. Database: migrations are forward-only — no rollback schema
3. If bad migration: create fix-forward migration

---

## 11. Stateless requirements

- ✅ No local filesystem data storage
- ✅ No in-memory session store (Supabase cookies)
- ✅ No SQLite/JSON on Railway
- ✅ File uploads (Excel) processed in-memory, not saved to disk

---

## 12. TECSOPS Railway reference

TECSOPS dùng:
- `Dockerfile` + `railway.toml`
- `restartPolicyType = ON_FAILURE`
- Express server (`node server/index.mjs`)

NAM NAM DATA khác:
- Next.js standalone (không Express)
- Không PostgreSQL trên Railway
- Supabase remote only

Chỉ reuse: Railway project setup workflow, env var management pattern, deploy check scripts concept.
