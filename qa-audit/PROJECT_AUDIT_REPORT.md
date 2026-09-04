# PROJECT AUDIT REPORT — NAM NAM DATA

**Date:** 2026-09-05  
**Method:** Full repository discovery → feature map → baseline → root-cause fixes → regression  
**Git scope:** App + import/auth/relations + RLS migration (no blind rewrite)

---

## Executive Summary

```text
Overall Health:      SAFE WITH WARNINGS
Architecture:        Consistent Next.js 16 App Router + Supabase MDM
Business Logic:      Import parties + ESID stale state fixed
State Management:    Dev mock auth removed; ESID remount sync
Database:            Role-based write RLS applied (private.can_write)
Security:            Write no longer USING(true); anon ESID PII closed
Test Coverage:       Unit only (29 tests); no Playwright E2E yet
Maintainability:     Dead placeholder removed; docs still partially stale
```

---

## Architecture map (runtime)

```text
User Action
  → UI (*-page-client / detail)
  → Event handler + useSubmitLock (where applied)
  → React Query hooks / Server Actions
  → lib/master-data + permissions
  → Supabase (browser JWT or server cookies)
  → PostgreSQL + RLS
  → Response → invalidate/refetch → UI
```

**Stack:** Next.js 16.3.3 · React 19 · Supabase SSR · TanStack Query · Zod 4 · Vitest · Railway

---

## Feature inventory (high level)

| ID | Feature | Entry |
|---|---|---|
| F001 | Login / session | `/login`, middleware, `DEV_SKIP_AUTH` |
| F002 | Dashboard | `/dashboard` |
| F003–F007 | Customers CRUD + relations + ESID | `/customers`, `/customers/[id]` |
| F008–F009 | Parties CRUD + detail | `/parties` |
| F010 | Commodities | `/commodities` |
| F011 | Destinations | `/destinations` |
| F012–F013 | Drivers / Vehicles | `/drivers`, `/vehicles` |
| F014 | Driver↔Vehicle | `/driver-vehicles` |
| F015 | Import | `/import` |
| F016 | Export | `/export` |
| F017 | Duplicate Center | `/duplicates` |
| F018 | Audit Logs | `/audit-logs` |
| F019 | Users | `/users` |
| F020 | Settings | `/settings` |
| F021 | Global search | header dialog |
| F022 | Health | `/api/health` |

---

## Issues

```text
Critical (P0):  0 open (RLS write open — FIXED this pass)
High (P1):      0 open (auth mock, import entity/parties, ESID stale — FIXED)
Medium (P2):    Partial — import still bypasses full Zod entity schemas
Low (P3):       List counts thiếu AGENT/NOTIFY; requireWrite gộp create/update; no E2E
Cleanup (P4):   Docs drift (Next 15/ExcelJS/Playwright); next-themes nửa vời
```

---

## Fixed bugs

### AUD-001 / BUG-012 — Dev mock ADMIN không JWT
- **Root cause:** `getDevMockSession()` khi auto sign-in fail → UI ADMIN, client không cookie `sb-*`
- **Fix:** Xóa mock; middleware chỉ bypass khi `ensureDevAuthSession` thành công; thiếu password → `/login`
- **Files:** `dev-bypass.ts`, `session.ts`, `middleware.ts`, `.env.example`

### AUD-002 — RLS write `USING (true)`
- **Root cause:** Mọi authenticated user ghi được master data qua PostgREST
- **Fix:** Migration `role_based_write_rls` — `private.can_write()` (ADMIN/OPERATOR); drop anon read ESID PII
- **Applied:** Supabase project `cuakkgauyutapdznqhge`

### AUD-003 — Đổi entity import không clear preview
- **Fix:** `handleEntityChange` clear preview + toast; commit dùng `useSubmitLock`

### AUD-004 — Import parties nửa vời
- **Fix:** Match code/name; update path; load parties đúng; link `customer_code`+`role` khi hợp lệ

### AUD-005 / AUD-013 — ESID stale controlled state + UI `*` giả
- **Fix:** Remount form sau load (`key`); bỏ `*` khi schema optional; `useSubmitLock`

### AUD-006 — Commodity import update thiếu audit
- **Fix:** `writeAuditLog` trên update

### AUD-009 — setDefault clear error bị nuốt
- **Fix:** Check `clearError` trên mọi clear `is_default`

### AUD-010 — Anon đọc ESID PII
- **Fix:** Drop policy + `REVOKE SELECT … FROM anon`

### AUD-012 — ESID FK validation lỏng + unused import
- **Fix:** `optionalUuid`; bỏ `normalizeEmail` thừa

### Dead code
- Removed: `placeholder-page.tsx`, `ExistingKeys`, `setRowAction`

---

## Removed code

```text
Files removed:        1 (placeholder-page.tsx)
Functions removed:    getDevMockSession, ExistingKeys type, setRowAction
Dependencies removed: 0
Approximate LOC:      ~80 net remove + ~200 net add (fixes/RLS)
```

---

## Remaining risks (UNRESOLVED / deferred)

| Item | Reason | Risk | Next |
|---|---|---|---|
| Import không parse qua full Zod schemas | Batch lớn; cần regression data | P2 data quality | Wire schemas per entity |
| `INTEGRATION` không `can_write()` | Docs nói API write; RLS chỉ ADMIN/OPERATOR | Integration write fail | Dedicated policy nếu cần |
| Anon vẫn đọc ACTIVE master (không ESID) | TECS compat views | Intentional exposure | Review scope với TECS |
| Không có Playwright E2E | Deps chưa ship | Sequential bugs trượt | Add E2E matrix |
| Docs `00_CURRENT_STATE` / ExcelJS / Next 15 | Stale docs | Confusion | Refresh docs pass |
| `next-themes` không ThemeProvider | Half-wired | Minor | Wire or remove |
| Customers list không đếm AGENT/NOTIFY | ADR-006 incomplete UI | Low | Add counts if product needs |

---

## Test result

### Baseline (before)

```text
Lint:       0 errors, 1 warning (unused normalizeEmail)
Typecheck:  PASS
Unit:       28/28
Build:      not run in baseline window
```

### After

```text
Lint:       PASS (0 warnings on fixed file)
Typecheck:  PASS
Unit:       29/29 (+ party import match)
Build:      PASS (next build)
CI:         PASS (`npm run ci`)
E2E:        N/A (not in repo)
RLS verify: write policies → private.can_write(); anon ESID gone
```

---

## Before vs After

```text
Metric                  BEFORE          AFTER
------------------------------------------------
Lint warnings           1               0 (fixed)
Type errors             0               0
Test failures           0               0
Unit tests              28              29
Dead stub files         1               0
Write RLS open          YES             NO (role-based)
Mock ADMIN no JWT       YES             NO
Import parties match    NO              YES
ESID stale selects      YES             FIXED
Known P0/P1             4               0 open
Build status            —               PASS
```

---

## Final Assessment

```text
SAFE WITH WARNINGS
```

**Lý do:** Root cause P0/P1 đã xử lý (auth JWT thật, RLS write theo role, import parties/ESID). Hệ thống vượt `npm run ci`. Cảnh báo còn lại: chưa E2E sequential, import chưa full Zod, anon ACTIVE read cho TECS vẫn mở theo thiết kế, docs còn drift.

**Local QA bắt buộc:** đặt `DEV_AUTH_PASSWORD` đúng admin Supabase khi `DEV_SKIP_AUTH=true`.
