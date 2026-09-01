# QA_AUDIT_REPORT — NAM NAM DATA

**Date:** 2026-09-01  
**Method:** Autonomous Playwright MCP + Supabase SQL data audit  
**Targets:** Local `http://localhost:3000` · Production `https://datasupabase-production.up.railway.app`  
**Rule:** No application code changes (audit only)

---

# EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Overall Quality | **Mixed** — core CRUD works locally; prod UI lag + double-submit + thin master-data links |
| Total Functions (inventory) | ~70 |
| Functions exercised this run | ~35 |
| PASS (runtime confirmed) | 28 |
| FAIL | 4 |
| BLOCKED | 2 (import deep, logout) |
| Total Bugs logged | 4 |
| P0 | 0 |
| P1 | 1 |
| P2 | 2 |
| P3 | 1 |
| P4 | 0 |

**Final verdict:** `NOT READY FOR PRODUCTION` (as full MDM) — see data report + deploy lag + duplicate create.

---

# FUNCTION COVERAGE

| Function | Tests | Pass | Fail | Blocked | Status |
|---|---:|---:|---:|---:|---|
| Routes / Dashboard | 3 | 3 | 0 | 0 | OK |
| Auth login (Railway) | 1 | 1 | 0 | 0 | OK |
| DEV skip auth | 1 | 1 | 0 | 0 | OK |
| Customers search / detail / pencil | 4 | 3 | 1* | 0 | *prod pencil fail |
| Parties create / archive / pencil | 4 | 4 | 0 | 0 | OK (local) |
| Commodities create / edit / empty / dblclick | 5 | 3 | 2 | 0 | dblclick FAIL; prod edit FAIL |
| Destinations edit | 1 | 1 | 0 | 0 | OK |
| Drivers/Vehicles pencil | 2 | 2 | 0 | 0 | OK (local) |
| Users display_name dialog | 2 | 1 | 1* | 0 | *prod missing |
| Global search / duplicates / export | 3 | 3 | 0 | 0 | OK |
| Import commit | 0 | 0 | 0 | 1 | BLOCKED |
| Logout | 0 | 0 | 0 | 1 | BLOCKED |

\*Production build thiếu list-edit UX đã có trên GitHub `master`.

---

# BUG SUMMARY

| Bug | Severity | Module | Function | Reproducible | Root Cause | Fix Priority |
|---|---|---|---|---|---|---|
| BUG-010 | P1 | Deploy | F062/F025b/F153 | Always on Railway | Prod image behind master | IMMEDIATE |
| BUG-011 | P2 | Commodities | F061-rapid | Always | No submit lock / idempotency | HIGH |
| BUG-012 | P2 | DevTooling | Static chunks | Intermittent local | Stale Turbopack `.next` → 403 | HIGH |
| BUG-013 | P3 | Data | Coverage | Always | Sparse relations / incomplete attrs | IMPROVEMENT |

---

# DETAILED BUG REPORTS

## BUG-010 — Production UI thiếu Edit/Pencil đã có trên master

**Severity:** P1  
**Module:** Deploy / Commodities / Customers / Users / Parties  
**Affected Function:** F062, F025b, F153, list pencils  
**Reproducibility:** Always on Railway  

**Precondition:** Logged in as ADMIN on production URL.

**Steps to Reproduce:**
1. Open `/commodities` on Railway.
2. Create commodity (works).
3. Look for ✏ edit / list pencils on customers/users.

**Expected:** Same UX as local/GitHub master (commodity edit dialog, list pencils, users display_name edit).  
**Actual:** Create works; pencils/edit affordances missing. Customer open falls back to text link only.

**Evidence:** Playwright Railway run 2026-09-01 — F062/F153/F025b FAIL; local same DB PASS for F062 after deploy of latest code.  
**Likely Root Cause:** Railway service not redeployed from latest `master` (commit with edit UX).  
**Recommended Fix:** Redeploy Railway from `NAMNAM1989/data_supabase` master; verify commit SHA.  
**Regression Tests:** Smoke checklist pencils on customers/drivers/vehicles/parties/commodities/users.

---

## BUG-011 — Double-click Create tạo 2 commodity trùng

**Severity:** P2  
**Module:** Commodities (likely other dialog creates too)  
**Affected Function:** F061-rapid  
**Reproducibility:** Always  

**Steps to Reproduce:**
1. `/commodities` → Add Commodity.
2. Enter name `QA Double …`.
3. Double-click «Tạo Commodity».

**Expected:** One row.  
**Actual:** Two rows same name (`QA Double L81086` ×2 in DB).

**Evidence:** SQL `count(*) where name='QA Double L81086'` = 2; timestamps ~1s apart.  
**Likely Root Cause:** Form `action`/`saving` state không chặn submit thứ 2 trước khi re-render.  
**Recommended Fix:** Disable submit khi `saving`; optional request idempotency key / unique business key.  
**Regression:** Playwright dblclick create → assert row count == 1.

---

## BUG-012 — Local `/_next/static` chunk 403 làm UI chết (dialog/data client)

**Severity:** P2  
**Module:** Local Next/Turbopack  
**Affected Function:** All client interactivity  
**Reproducibility:** Intermittent (seen after long-running/hung `next dev`)

**Steps:** Browse with Playwright while `.next` stale / server previously hung.  
**Actual:** Many JS chunks 403; Add dialog không mở; table trống dù SSR shell còn.  
**Recovery:** Kill port 3000, delete `.next`, restart `npm run dev` → PASS.

**Likely Root Cause:** Stale Turbopack assets / hung Node on :3000.  
**Recommended Fix:** Document restart procedure; CI use `next start` production build for E2E; avoid multi-dev instances.

---

## BUG-013 — Master data relation coverage quá thấp

**Severity:** P3 (data readiness; not a code crash)  
**Module:** Data  
**Evidence:** See `DATA_QUALITY_REPORT.md` — 44/45 customers without party; 0 customer_commodities; 12/20 vehicles unassigned; all drivers missing phone.

---

# CROSS-FUNCTION ISSUES

- CREATE → EDIT commodity: PASS local; FAIL prod (BUG-010).
- dblclick CREATE: FAIL (BUG-011).
- SEARCH → clear → list: PASS.
- Party CREATE → ARCHIVE → RESTORE: PASS local.
- Prod vs Local same Supabase DB: UI feature parity broken (deploy), data shared (QA rows appear on both).

---

# STATE MANAGEMENT ISSUES

| Issue | Status |
|---|---|
| Double submit / race on create | **CONFIRMED** BUG-011 |
| Modal leakage A→B | Not observed |
| Stale selected record | Not observed |
| List refresh after create | PASS (parties/commodities) |
| Nested `<main>` a11y strictness | Present (sidebar-inset + content) — test flake risk |

---

# CONSOLE / RUNTIME ISSUES

- Local (stale): mass 403 on `/_next/static/chunks/*`, HMR websocket failures.
- After `.next` clear: clean enough for CRUD.
- Base UI uncontrolled FieldControl warning observed historically on party forms (prior session logs).

---

# NETWORK / API ISSUES

- Railway `/api/health` 200 OK.
- Local health hung when Node process wedged (pre-kill).
- Commodity/party mutations succeed (200) even when UI feature missing on prod.

---

# DATA CONSISTENCY ISSUES

- UI create success khớp DB (commodity/party).
- Double create → 2 DB rows (BUG-011).
- Audit log volume thấp hơn số mutation (partial coverage / soft-fail / old build).
- Full analysis: `qa-audit/DATA_QUALITY_REPORT.md`.

---

# UI/UX ISSUES

- Pencil `render={<Link/>}` exposes accessible name `Sửa {name}` — Playwright `getByRole('link',{name: entity})` matches both name link and pencil (substring). Prefer distinct labels or `exact`.
- Prod missing discoverable edit controls (BUG-010).

---

# ROOT CAUSE ANALYSIS

| Category | Count |
|---|---:|
| DEPLOY / ENV DRIFT | 1 (BUG-010) |
| EVENT / SUBMIT RACE | 1 (BUG-011) |
| DEV TOOLING / CACHE | 1 (BUG-012) |
| DATA COMPLETENESS | 1 (BUG-013) |

---

# RECOMMENDED FIX PLAN

## PRIORITY 1 — IMMEDIATE
- Redeploy Railway from latest GitHub `master` (BUG-010).
- Smoke pencils + commodity edit on prod.

## PRIORITY 2 — HIGH
- Disable submit while saving; guard double-submit on all create dialogs (BUG-011).
- Document/automate clean local E2E (`rimraf .next && next build && next start`) (BUG-012).

## PRIORITY 3 — IMPROVEMENT
- Data backfill: parties, commodities links, driver phones, vehicle assignments (BUG-013).
- Clean QA\* and duplicate doubles.
- Add OPERATOR/VIEWER users for RBAC tests.

---

# REGRESSION TEST PLAN

1. **TC-DBL-CREATE:** dblclick create commodity → expect 1 row.  
2. **TC-PENCIL-SMOKE:** customers/drivers/vehicles/parties/commodities/users pencils visible (prod+local).  
3. **TC-PARTY-ARCHIVE:** archive → restore → ACTIVE.  
4. **TC-COMM-EDIT:** create → pencil → rename → list shows new name.  
5. **TC-STATIC-HEALTH:** no `/_next/static` status ≥400 after load.  
6. **TC-DATA-COVERAGE:** SQL gate optional — customers_with_party_pct > threshold.

---

# TEST COVERAGE LIMITATIONS

- Import Excel full commit not re-run this session.
- Logout not tested (kept session).
- RBAC as non-ADMIN not tested (only 1 profile).
- Print N/A.
- Production destructive archive of real customers avoided (used QA rows + prior archive evidence).

---

# FINAL VERDICT

## `NOT READY FOR PRODUCTION`

**Evidence:**
1. Production UI thiếu edit/pencil features đã merge trên master (BUG-010).  
2. Double-submit tạo duplicate master records (BUG-011).  
3. Master data **chưa đủ liên kết** để vận hành MDM (44/45 customers không party; 0 commodity links) — `DATA_QUALITY_REPORT.md`.  

Local happy-path CRUD (sau khi reset `.next`) đạt chất lượng chấp nhận được cho tiếp tục phát triển.

---

## Artifacts

| File | Purpose |
|---|---|
| `qa-audit/FUNCTION_INVENTORY.md` | Function IDs |
| `qa-audit/TEST_MATRIX.md` | Case results |
| `qa-audit/DATA_QUALITY_REPORT.md` | Đánh giá dữ liệu |
| `qa-audit/QA_AUDIT_REPORT.md` | Báo cáo này |
