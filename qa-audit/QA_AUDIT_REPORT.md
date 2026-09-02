# QA_AUDIT_REPORT — NAM NAM DATA (re-audit #3)

**Date:** 2026-09-02 (16:30 ICT)  
**Method:** Code inventory + Supabase SQL + Local browser CDP + Railway CLI/logs  
**Targets:** Local `http://localhost:3000` (primary) · Production Railway (secondary)  
**Git reference:** `master` @ `70da5c0`  
**Railway deployment:** `73584907` SUCCESS @ 15:20 ICT (`skipBuildCache: true`, reason: redeploy)  
**Rule:** Audit only (no app code changes this pass)

---

# EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Overall Quality | **Source READY for edit workflow**; **local data path BLOCKED by auth bypass**; **prod UI smoke BLOCKED without session** |
| Git / source CRUD edit | Present (Thao tác, relation update actions, CSV BOM, samples) |
| Local list UI affordance | PASS — cột **Thao tác** render khi role ADMIN |
| Local list data | **FAIL** — bảng Customers: «Chưa có customer» dù DB có 50 rows |
| QA-SAMPLE seed | PASS — 5/5 bộ đủ quan hệ |
| Unit tests | PASS — 28/28 |
| Typecheck | PASS |
| Active bugs | 3 (1 P1 local auth, 1 P2 prod verify, 1 P3 sparse legacy data) |

**Final verdict:** `CONDITIONALLY READY` — code đã đủ chức năng sửa; cần **đăng nhập Supabase thật** (local + prod) để nghiệm thu end-to-end.

---

# FUNCTION COVERAGE (this run)

| Function group | Result | Evidence |
|---|---|---|
| Health local/prod | PASS | `/api/health` → `{"status":"ok"}` cả hai |
| Source: list Sửa / Thao tác | PASS | `edit-row-actions`, customers/parties/… clients |
| Source: relation UPDATE | PASS | `updatePartyRelationAction`, commodity/driver/vehicle/DV |
| Source: CSV BOM + timestamp | PASS | `lib/csv.ts` + tests |
| Source: Settings email helper | PASS | settings-page-client |
| Source: Duplicate deep-link | PASS | `/commodities?edit=` |
| Local: Thao tác column | PASS | CDP: `thao=true` trên `/customers` |
| Local: load customers | **FAIL** | CDP: `empty=true`, `sua=0`, no QA-SAMPLE text; **no `sb-` auth cookie** |
| Prod: anonymous page scan | BLOCKED | HTTP 307 → `/login` (đúng bảo mật) |
| Prod: deploy freshness | PASS* | New deploy `73584907` sau commit; *chưa xác nhận string UI trong session |
| SQL: QA-SAMPLE relations | PASS | 5 customers × shipper/cnee/commodity/driver/vehicle = 1 mỗi loại |
| SQL: legacy coverage | WARN | 44/50 customers vẫn không có party link |
| npm test / typecheck | PASS | 28 tests; tsc clean |

---

# BUG SUMMARY

| Bug | Severity | Module | Status | Notes |
|---|---|---|---|---|
| BUG-010 | P1→**P2** | Deploy | **Mitigated** | Railway đã redeploy no-cache `73584907` sau `70da5c0`. Cần login prod để xác nhận UI Sửa. |
| BUG-012 | **P1** | Local auth | **OPEN** | `DEV_SKIP_AUTH` + mock session → UI ADMIN nhưng client Supabase **không JWT** → RLS trả rỗng → không test được mẫu. |
| BUG-013 | P3 | Data | **Partial** | Seed giảm thiếu quan hệ cho 5 mẫu; 44 customers cũ vẫn trống party. |
| BUG-014 | P2 | UX list | **Fixed in source / local chrome** | Cột Thao tác hiện local; prod chờ verify session. |
| BUG-015 | P2 | Local testability | **NEW** | Không có cookie `sb-*`; auto sign-in fail (log: Invalid login credentials). |

---

# DETAILED FINDINGS

## BUG-012 / BUG-015 — Local không đọc được data (P1 cho QA)

**Observed (browser CDP on `/customers`):**
- Header: Dev Admin / ADMIN
- Table header có **Thao tác**
- Body: «Chưa có customer»
- `document.cookie` không chứa Supabase auth (`hasSupabaseAuthCookie: false`)
- SQL: 50 customers, 5 `QA-SAMPLE-20260902-*`

**Root cause:** `DEV_SKIP_AUTH=true` cho phép mock profile server-side; React Query gọi Supabase **browser client** không session → RLS deny/empty.

**Fix recommended:**
1. Set đúng `DEV_AUTH_PASSWORD` và để `ensureDevAuthSession` sign-in thật; hoặc
2. Tắt `DEV_SKIP_AUTH` và login thủ công; hoặc
3. (dev only) service-role proxy cho read — không khuyến nghị production.

## BUG-010 — Production deploy (cập nhật)

- Deploy cũ `aa105c88` đã REMOVED.
- Deploy mới `73584907` SUCCESS, `skipBuildCache: true`.
- Anonymous GET `/customers` → 307 login (đúng).
- **Chưa** smoke UI Sửa trên prod vì thiếu session audit.

## Data quality (SQL)

| Entity | Total | QA-SAMPLE |
|---|---:|---:|
| customers | 50 | 5 |
| parties | 15 | 10 |
| commodities | 9 | 5 |
| drivers | 14 | 5 |
| vehicles | 25 | 5 |

QA-SAMPLE C01–C05: mỗi customer có 1 shipper, 1 consignee, 1 commodity, 1 preferred driver, 1 preferred vehicle.

Customers without any party link: **44**.

Audits 7d: 17 rows (UPDATE profiles, INSERT parties/commodities, archive/restore…).

---

# ACCEPTANCE vs PRIOR CRUD GOALS

| Criterion | Source | Local E2E | Prod E2E |
|---|---|---|---|
| Sửa Commodity không xóa | Code yes | Blocked (no data) | Blocked (no session) |
| Sửa Customer–Consignee destination | Code yes | Blocked | Blocked |
| Sửa Custom Description | Code yes | Blocked | Blocked |
| Sửa Preferred/Default | Code yes | Blocked | Blocked |
| Driver↔Vehicle edit dialog | Code yes | Blocked | Blocked |
| List Sửa Customers/Parties/Drivers/Vehicles | Code + local header Thao tác | Partial | Blocked |
| Settings email | Code yes | Not exercised | Blocked |
| Export CSV BOM | Code + unit tests | Not exercised | Blocked |
| Duplicate deep-link | Code yes | Not exercised | Blocked |
| Loading skeletons | Code yes | PASS (message + skeletons) | — |

---

# RECOMMENDED NEXT ACTIONS

1. **P0 QA:** Login local bằng tài khoản Supabase thật (sửa `DEV_AUTH_PASSWORD` hoặc tắt bypass) → search `QA-SAMPLE-20260902` → chạy checklist sửa quan hệ.
2. **P0 Prod:** Login Railway → verify cột Thao tác / nút Sửa trên 8 list pages (đóng BUG-010/014).
3. **P2:** Giữ seed script `scripts/seed-test-samples.mjs` trong docs test.
4. **P3:** Backfill quan hệ cho customers legacy nếu business cần.

---

# VERDICT

`CONDITIONALLY READY FOR PRODUCTION` — implementation đã có; **nghiệm thu UI/data đang bị chặn bởi auth session**, không phải thiếu nút Sửa trong source.
