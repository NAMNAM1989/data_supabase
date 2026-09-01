# QA_AUDIT_REPORT.md — NAM NAM DATA

**Date:** 2026-09-01  
**Target:** `http://localhost:3000` (Next.js 16 + Supabase `cuakkgauyutapdznqhge`)  
**Method:** Playwright MCP + DB verification (Supabase SQL/Admin API)  
**Mode:** Read/write QA with `QA*` prefixed test data — **no application code changes**

> **Update 2026-09-01 (evening):** P1 bugs **BUG-001 / BUG-002 / BUG-003** fixed in app + Supabase migrations. Settings + Parties create + audit trail verified PASS. **BUG-004** (toast blocking clicks) fixed — Toaster `bottom-right` + `pointer-events: none` on region. Re-audit recommended for remaining P2+ (import audit edge cases only if needed).

---

# EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Overall Quality | **NOT READY FOR PRODUCTION** (audit trail + Settings broken; Parties create broken) |
| Total Functions (inventory) | 72 |
| Functions Tested (runtime) | ~45 |
| PASS | ~32 |
| FAIL | 8 |
| BLOCKED | ~19 (permission-role variants, merge UI absent, print N/A, some relation tabs not fully exercised) |
| Total Test Cases (executed) | ~60+ |
| Total Bugs | 7 |
| P0 | 0 |
| P1 | 3 |
| P2 | 2 |
| P3 | 1 |
| P4 | 1 |

**Verdict:** Core master-data CRUD for Customers / Drivers / Vehicles / Destinations / Import / Export / Global Search works. **Audit logging is non-functional** (RLS + missing calls). **Settings save fails** because of audit insert. **Parties create from list dialog fails** due to `null` FormData → Zod. Toast overlays can block subsequent clicks.

---

# FUNCTION COVERAGE

| Function | Tests | Pass | Fail | Blocked | Status |
|---|---|---|---|---|---|
| F004 DEV skip auth | 2 | 1 | 1 | 0 | PARTIAL — needs valid `DEV_AUTH_PASSWORD` |
| F010–F013 Dashboard | 3 | 3 | 0 | 0 | PASS |
| F020–F025 Customers list | 8 | 7 | 1 | 0 | PASS (nav click flaky w/ toast) |
| F030–F031 Detail update/archive | 4 | 4 | 0 | 0 | PASS |
| F032–F042 Customer relations | 0 | 0 | 0 | 11 | BLOCKED — not fully exercised this run |
| F050–F051 Parties | 3 | 1 | 2 | 0 | **FAIL create** |
| F060–F061 Commodities | 2 | 2 | 0 | 0 | PASS |
| F070–F073 Destinations | 5 | 5 | 0 | 0 | PASS |
| F080–F081 Drivers | 2 | 2 | 0 | 0 | PASS |
| F090–F091 Vehicles | 2 | 2 | 0 | 0 | PASS |
| F100 Driver↔Vehicle list | 1 | 1 | 0 | 0 | PASS |
| F101–F103 Assign/unassign | 0 | 0 | 0 | 3 | BLOCKED — not deep-tested |
| F110–F112 Import | 4 | 4 | 0 | 0 | PASS (update path; create+audit broken) |
| F120–F122 Export | 3 | 3 | 0 | 0 | PASS |
| F130 Duplicates scan | 2 | 2 | 0 | 0 | PASS (0 groups found) |
| F140 Audit list | 2 | 0 | 2 | 0 | **FAIL — empty forever** |
| F150–F151 Users | 2 | 2 | 0 | 0 | PASS (empty validation) |
| F160 Settings | 2 | 0 | 2 | 0 | **FAIL** |
| F170–F172 Global Search | 3 | 3 | 0 | 0 | PASS |
| F001–F002 Login/Logout | 1 | 1 | 0 | 0 | PARTIAL — DEV bypass redirects `/login`→dashboard |

Artifacts: `qa-audit/FUNCTION_INVENTORY.md`, `qa-audit/fixtures/customers-import.csv`

---

# BUG SUMMARY

| Bug | Severity | Module | Function | Reproducible | Root Cause | Fix Priority |
|---|---|---|---|---|---|---|
| BUG-001 | P1 | Audit / Settings / Import | F140, F160, F112 | Always | RLS: no INSERT policy on `audit_logs` | IMMEDIATE |
| BUG-002 | P1 | Parties | F051 | Always | `tax_code: formData.get()` → `null` fails Zod | IMMEDIATE |
| BUG-003 | P1 | Audit | Master CRUD | Always | `writeAuditLog` never called from customers/drivers/… actions | IMMEDIATE |
| BUG-004 | P2 | UI / Sonner | Cross-function | Always | Toast overlay intercepts clicks | HIGH |
| BUG-005 | P2 | Import | F112 create path | Always | Create+audit fails RLS; update path skips audit | HIGH |
| BUG-006 | P3 | Auth DEV | F004 | Always when password stale | Auto sign-in fails; mock session ≠ real Supabase JWT | IMPROVEMENT |
| BUG-007 | P4 | Global Search | F171 | Always | Destination result label lacks separator (`Q10QA City`) | IMPROVEMENT |

---

# DETAILED BUG REPORTS

## BUG-001 — Audit INSERT bị RLS chặn; Settings luôn báo lỗi sau khi update profile

**Severity:** P1  
**Module:** Audit Logs / Settings / Import  
**Affected Function:** F140, F160, F112  
**Reproducibility:** Always  

**Precondition:** Logged in as ADMIN (`authenticated` role)

**Steps to Reproduce:**
1. Open `/settings`
2. Change Display Name → Lưu thay đổi
3. Observe toast error
4. Query `audit_logs` → still 0 rows
5. As authenticated user: `insert into audit_logs` → RLS violation `42501`

**Expected:** Profile saves; audit row written; Audit Logs page shows entries after CRUD/import  

**Actual:**
- Settings toast: `Đã xảy ra lỗi. Vui lòng thử lại` (via `mapSupabaseError` UNKNOWN / permission path)
- `audit_logs` count = **0** after many creates/updates/imports
- Confirmed: only policy is `admin_read_audit` (**SELECT**). **No INSERT policy**

**Evidence:**
- Playwright Settings toast error
- Admin API: `audits: 0`
- Client insert: `new row violates row-level security policy for table "audit_logs"`

**Console Error:** none required  
**Network Error:** PostgREST 401/403 style RLS on insert  

**Minimal Reproduction:** Settings save OR any `writeAuditLog()` call with user-scoped Supabase client  

**Likely Root Cause (CONFIRMED):** Missing RLS INSERT policy for `authenticated` (and/or service role usage for audit writes). Docs in `docs/04_SECURITY_RLS.md` planned `authenticated_insert_audit` but not applied.

**Relevant Code:**
- `src/lib/master-data/audit.ts` → `writeAuditLog`
- `src/app/(app)/settings/actions.ts` (update then audit in same try)
- DB: `pg_policies` on `audit_logs`

**Recommended Fix:**
1. Add INSERT policy: authenticated users may insert when `actor_user_id = auth.uid()` (or admin-only + use service role carefully)
2. Do not fail the primary mutation if audit write fails (log + soft-fail) OR use transaction with clear UX
3. Backfill/migrate policy from security docs

**Regression Risk:** Medium — permission model  
**Regression Tests Required:** Settings save creates audit; Import create writes IMPORT audit; Audit page lists rows

---

## BUG-002 — Không tạo được Party từ dialog list (`Invalid input`)

**Severity:** P1  
**Module:** Parties  
**Affected Function:** F051  
**Reproducibility:** Always  

**Steps to Reproduce:**
1. `/parties` → Add Party
2. Fill Name (+ optional Code)
3. Submit

**Expected:** Party created  
**Actual:** Toast `Invalid input`; no row

**Evidence:** Playwright toast; form has no `tax_code` input but `handleCreate` passes `tax_code: formData.get("tax_code")` → `null`

**Minimal Reproduction:** Create party with only name  

**CONFIRMED Root Cause:** Zod `partySchema` expects `string | undefined | ""` for optional fields; `FormData.get` returns `null` for missing fields → Zod fails with generic `Invalid input`.

**Relevant Code:** `src/components/parties/parties-page-client.tsx` lines 43–50; `src/lib/validation/party.ts`

**Recommended Fix:**
```ts
tax_code: formData.get("tax_code") ?? "",
// or z.preprocess(v => v ?? "", z.string()...)
```
Apply same pattern to all FormData→Zod boundaries.

**Regression Tests:** Create party with only required name; create with all optional empty

---

## BUG-003 — Master-data CRUD không ghi audit log

**Severity:** P1  
**Module:** Customers, Drivers, Vehicles, Destinations, Parties, Commodities  
**Affected Function:** F024, F030, F071, F081, F091, …  
**Reproducibility:** Always  

**Steps:** Create/update/archive customer (or destination) → open Audit Logs  

**Expected:** INSERT/UPDATE/ARCHIVE entries  
**Actual:** Empty audit table; code paths never call `writeAuditLog` (only Settings, Users, Import)

**Likely Root Cause (CONFIRMED from source):** Design gap — audit helper exists but not wired in entity actions.

**Recommended Fix:** Call `writeAuditLog` in each mutating server action (after BUG-001 RLS fix). Prefer single helper wrapper `withAudit(action, fn)`.

---

## BUG-004 — Sonner toast chặn click các nút phía dưới/cạnh

**Severity:** P2  
**Module:** Global UI  
**Affected Function:** Cross-function (F031 Restore observed)  
**Reproducibility:** Always while toast visible  

**Steps:** Archive customer → immediately click Restore  

**Actual:** Playwright: toast `<li data-sonner-toast>` intercepts pointer events; click times out  

**Likely Root Cause:** Toast stacking/position + high z-index without pointer-events passthrough on container  

**Recommended Fix:** Auto-dismiss sooner; `pointer-events: none` on toast region except close button; or queue toasts bottom-left away from primary actions  

**Regression Tests:** Archive → Restore within 1s; Create → immediately open another dialog

---

## BUG-005 — Import CREATE + audit: create có thể thành công nhưng audit fail; UPDATE bỏ qua audit

**Severity:** P2  
**Module:** Import  
**Affected Function:** F112  

**Observed:** Re-import of `QAIMP01/02` → `Import xong: 0 tạo, 2 cập nhật` (update path không gọi `writeAuditLog`). Create path gọi `writeAuditLog` sau `createCustomer` — sẽ throw RLS (BUG-001), risking partial success depending on catch scope.

**Relevant Code:** `src/app/(app)/import/actions.ts` (~162–175 update branch vs create+audit)

**Recommended Fix:** Fix RLS; write audit for update/skip decisions; wrap per-row so audit failure is reported in `result.errors`

---

## BUG-006 — DEV_SKIP_AUTH fragile khi password lệch

**Severity:** P3  
**Module:** Auth  
**Observed:** Dev server logs `[dev-auth] Auto sign-in failed: Invalid login credentials` until password synced via Admin API. Mock session can show ADMIN UI while browser client lacks JWT → data/query risk.

**Recommended Fix:** Document password sync; fail hard in middleware if auto-login fails (don’t serve mock as if authenticated for client queries)

---

## BUG-007 — Global Search destination label thiếu separator

**Severity:** P4  
**Module:** Global Search  
**Observed:** Result text `Q10QA City` instead of `Q10 — QA City`  

**Recommended Fix:** Align label format with customers (`code — name`)

---

# CROSS-FUNCTION ISSUES

| Sequence | Result |
|---|---|
| CREATE customer → SEARCH → OPEN detail | PASS (after toast cleared) |
| ARCHIVE → RESTORE (immediate) | FAIL interaction (BUG-004) |
| IMPORT preview → COMMIT update → SEARCH | PASS |
| SETTINGS save → AUDIT list | FAIL (BUG-001) |
| CREATE destination → CREATE duplicate IATA | PASS (`Dữ liệu đã tồn tại`) |
| CREATE customer duplicate code | PASS |
| Invalid email on detail → save | PASS validation message |
| Export Customers/Drivers/Vehicles CSV | PASS downloads |
| Global Search `QA` → multi-entity results | PASS |
| Duplicate Center scan after QA data | PASS scan, 0 fuzzy groups (may be threshold) |

---

# STATE MANAGEMENT ISSUES

| Issue | Notes |
|---|---|
| Toast modal leakage | Blocks subsequent actions (BUG-004) |
| Settings error after successful profile write | Audit failure masks success (BUG-001) |
| DEV mock vs real session | Potential stale/unauthorized client queries (BUG-006) |
| No stale-record print bugs | N/A — app has no PRINT |

---

# CONSOLE / RUNTIME ISSUES

- No React crash observed on main routes (15/15 smoke 200)
- Dev warning: middleware → proxy deprecation (Next 16)
- No hydration errors recorded during tested flows

---

# NETWORK / API ISSUES

- Authenticated `audit_logs` INSERT → RLS deny (42501)
- Export endpoints return CSV successfully
- Import commit returns success toast for update path

---

# DATA CONSISTENCY ISSUES

| Issue | Severity |
|---|---|
| Audit trail missing while DB mutations succeed | P1 |
| Settings UI error despite possible profile write | P2 |
| Dashboard “Shippers/Consignees” = link counts, not party master rows | P4 (label clarity) — by design in `getDashboardStats` |

QA seed data left in DB (safe to delete): customers `QA*`, `QAIMP*`; destinations `Q10/Q86/Q99`; driver `QA Driver*`; commodity `QA Goods*`; vehicle `50QA*`.

---

# UI/UX ISSUES

- Toast blocking (BUG-004)
- Search destination formatting (BUG-007)
- Commodity list: no edit UI (server update exists) — product gap
- Duplicate Center: no merge UI (documented V1)
- Dashboard empty audit widget always empty until BUG-001/003 fixed

---

# ROOT CAUSE ANALYSIS

| Category | Count |
|---|---|
| RLS / Permissions | 1 (BUG-001, drives BUG-005) |
| Validation / FormData null | 1 (BUG-002) |
| Missing feature wiring | 1 (BUG-003) |
| UI event / overlay | 1 (BUG-004) |
| Dev tooling / env | 1 (BUG-006) |
| Presentation | 1 (BUG-007) |

---

# RECOMMENDED FIX PLAN

## PRIORITY 1 — IMMEDIATE

1. **Migration:** add `audit_logs` INSERT policy (match `docs/04_SECURITY_RLS.md`)
2. **Parties create:** coerce `FormData` nulls to `""` (and audit all similar forms)
3. **Wire `writeAuditLog`** into all mutating actions OR accept soft-fail audit with monitoring

## PRIORITY 2 — HIGH

4. Soft-fail or reorder Settings so profile update success isn’t reported as failure when audit fails
5. Import: audit on UPDATE; surface audit errors in commit result
6. Toast UX: don’t block primary actions

## PRIORITY 3 — IMPROVEMENT

7. Harden DEV_SKIP_AUTH
8. Search result label formatting
9. Commodity edit UI; Duplicate merge (if in scope)
10. Role-based E2E (OPERATOR/VIEWER) — currently BLOCKED / untested

---

# REGRESSION TEST PLAN

Automate (Playwright):

1. **BUG-001:** Settings save → assert toast success + ≥1 `audit_logs` row with `table_name=profiles`
2. **BUG-001:** Import create new code → audit `action=IMPORT`
3. **BUG-002:** Parties Add with name only → row appears
4. **BUG-003:** Create customer → audit INSERT (after wiring)
5. **BUG-004:** Archive then Restore within 500ms → both succeed
6. **Happy:** Export 3 CSVs download; Global Search navigates; Duplicate IATA rejected
7. **Negative:** Invalid email; empty required; duplicate customer code

Suggested CI job: `npm run test:e2e` against local with `DEV_SKIP_AUTH` + known password.

---

# TEST COVERAGE LIMITATIONS

- Production Railway not fully re-audited this run (local focus)
- Customer relation tabs (shipper/consignee/commodity/driver/vehicle prefs) not fully CRUD-tested
- Driver↔Vehicle assign/unassign/preferred not deep-tested
- Users create with real email not executed (avoid mailbox spam)
- OPERATOR/VIEWER/INTEGRATION permission matrix not tested
- No PRINT feature in app
- Duplicate fuzzy matching returned 0 groups — algorithm sensitivity not fully validated
- Large-file import / malformed Excel not tested
- Mobile viewport not tested

---

# FINAL VERDICT

## `NOT READY FOR PRODUCTION`

**Why:**
1. Audit trail is effectively dead (RLS + unwired CRUD) — compliance/ops risk  
2. Settings cannot complete successfully from user POV  
3. Parties cannot be created from primary UI dialog  

**What works well enough for continued internal testing:**
- Customers / Drivers / Vehicles / Destinations CRUD
- Import (update) / Export CSV
- Global Search
- Validation for duplicate codes & invalid email
- Route shell & navigation under ADMIN

Ship only after Priority 1 fixes + regression suite green.
