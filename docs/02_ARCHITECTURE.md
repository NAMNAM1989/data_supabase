# NAM NAM DATA — Architecture

## 1. Kiến trúc tổng thể

```text
                         SUPABASE
                  NAM NAM MASTER DATABASE
                           │
                PostgreSQL / Auth / RLS
                           │
              ┌────────────┴────────────┐
              │                         │
         NAM NAM DATA                API Layer
        (Next.js App)                  │
              │                          │
              │              ┌───────────┼────────────┐
              │              │           │            │
              ▼              ▼           ▼            ▼
           Railway        TECSOPS   Extensions    Other Apps
```

### Nguyên tắc bất biến

1. **Supabase = single source of truth**
2. **NAM NAM DATA = admin UI only** — không lưu master data local
3. **Railway = deploy platform** — không database trên Railway
4. **Normalized relational model** — không JSON blob nested
5. **TECSOPS = consumer** — đọc từ Supabase, không sở hữu master data

---

## 2. Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Database | Supabase (PostgreSQL 17) |
| Auth | Supabase Auth |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Excel | ExcelJS |
| Unit tests | Vitest |
| E2E | Playwright |
| CI | GitHub Actions |
| Deploy | Railway |

**Không dùng:** Prisma, Express data server, Redux global blob, SQLite/local JSON.

---

## 3. Application layers

```text
┌─────────────────────────────────────────┐
│  app/ (Routes, Server Components)       │
├─────────────────────────────────────────┤
│  components/ (UI per domain)            │
├─────────────────────────────────────────┤
│  hooks/ (TanStack Query wrappers)       │
├─────────────────────────────────────────┤
│  lib/master-data/ (Data access layer)   │
│  lib/auth/                              │
│  lib/validation/ (Zod schemas)          │
│  lib/normalization/                     │
├─────────────────────────────────────────┤
│  lib/supabase/ (Client factories)       │
├─────────────────────────────────────────┤
│  types/ (Generated + domain types)      │
└─────────────────────────────────────────┘
           │
           ▼
      Supabase PostgreSQL
```

### Quy tắc dependency

- **Components** → hooks → master-data → supabase client
- **Không** import `@supabase/supabase-js` trong component
- **Server Actions / Route Handlers** dùng service role chỉ khi cần (admin ops, import batch)
- **Browser client** dùng publishable key + user session

---

## 4. Supabase clients

| Client | Dùng ở đâu | Key |
|---|---|---|
| Browser client | Client components, hooks | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Server client | Server components, actions | Cookie-based session |
| Admin client | Server-only privileged ops | `SUPABASE_SERVICE_ROLE_KEY` |

---

## 5. Auth flow

```text
/login → Supabase signInWithPassword
       → Session cookie (SSR)
       → Load profiles.role
       → Redirect /dashboard
       → Middleware check role per route
```

Protected routes: middleware `@supabase/ssr` verify session.

Role check: đọc từ `profiles` table (không dùng `user_metadata` cho authorization).

---

## 6. Data access pattern

```typescript
// lib/master-data/customers.ts
export async function getCustomers(supabase: SupabaseClient, filters?: CustomerFilters) {
  // query here
}

// hooks/use-customers.ts
export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => getCustomers(supabase, filters),
  });
}
```

Query keys chuẩn hóa theo master prompt §30.

Mutations invalidate đúng subtree — không reload app.

---

## 7. Error handling

| Error type | UI response |
|---|---|
| Zod validation | Inline field errors |
| Unique constraint | Toast "Mã đã tồn tại" |
| FK violation | Toast "Không thể xóa — đang được sử dụng" |
| RLS denied | Toast "Không có quyền" |
| Network | Toast + retry button |
| Unknown | Error boundary + generic message |

Không hiển thị raw PostgreSQL error.

---

## 8. Audit architecture

```text
Mutation (app layer)
    → Write to target table
    → Insert audit_logs row
         actor_user_id, app_name='NAM_NAM_DATA',
         action, table_name, record_id,
         old_data, new_data
```

V1: app-level audit (không DB trigger) — đơn giản, dễ test. Có thể thêm trigger Phase 6+.

---

## 9. Import architecture

```text
Upload (client) → Parse ExcelJS (client or server)
    → Normalize layer
    → Validate (Zod)
    → Duplicate detection (in-memory compare + DB lookup)
    → Preview UI (user decisions)
    → Batch insert (server action + service role or RLS-compliant)
    → Audit IMPORT action
```

---

## 10. Deployment architecture

```text
GitHub (main/develop/feature/*)
    → GitHub Actions (lint, typecheck, test, build)
    → Railway auto-deploy (production)
    → Next.js standalone
    → Health: GET /api/health
    → Env: SUPABASE_URL, keys (Railway secrets)
```

Stateless — không filesystem persistence.

---

## 11. Tách biệt với TECSOPS

| Concern | TECSOPS | NAM NAM DATA |
|---|---|---|
| Purpose | Daily ops, shipments | Master data admin |
| Data write | Đọc master, ghi ops state | Ghi master data |
| Stack | Vite SPA + Express | Next.js + Supabase direct |
| Customer model | Legacy directory (deprecated) | Normalized tables |

TECSOPS sẽ migrate sang đọc Supabase master data — **không gộp codebase**.

---

## 12. Architecture decisions

Xem `docs/decisions/`:
- ADR-001: Supabase as source of truth
- ADR-002: Separate from TECSOPS
- ADR-003: Party model
- ADR-004: Driver-Vehicle N:N
- ADR-005: Customer transport assignment (conflict resolution)
