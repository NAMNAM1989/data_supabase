# DATA_QUALITY_REPORT — Đánh giá dữ liệu master

**Project:** Supabase `data_supabase` (`cuakkgauyutapdznqhge`)  
**Date:** 2026-09-01  
**After:** Playwright QA mutations (QA-prefixed rows present)

---

## 1. Executive data verdict

**DATA NOT PRODUCTION-READY for full MDM use** — integrity (keys/orphans/duplicates of real codes) is OK, nhưng **coverage quan hệ rất thấp** và có **noise QA + duplicate double-submit**.

| Area | Score | Comment |
|---|---|---|
| Referential integrity | ✅ Good | 0 orphan FK |
| Unique codes/names (business) | ✅ Good | 0 duplicate customer code/name, plate, IATA |
| Relation coverage | ❌ Poor | 44/45 customers không có party; 0 commodity links |
| Attribute completeness | ⚠️ Weak | 9/9 drivers thiếu phone; 1 party thiếu address |
| Audit completeness | ⚠️ Partial | Ít log so với volume CRUD (một phần soft-fail / deploy cũ) |
| QA pollution | ⚠️ Present | Nhiều `QA %` parties/commodities + 2 duplicate doubles |

---

## 2. Volume snapshot (post-QA)

| Entity | Total | Active notes |
|---|---:|---|
| customers | 45 | 44 ACTIVE, ≥1 ARCHIVED historically |
| parties | 5 | incl. 3 QA\* |
| commodities | 4 | incl. QA + 2× `QA Double L81086` |
| destinations | 3 | |
| drivers | 9 | all ACTIVE |
| vehicles | 20 | all ACTIVE |
| customer_parties ACTIVE | 2 | |
| customer_commodities ACTIVE | 0 | |
| customer_drivers | 9 | |
| customer_vehicles | 21 | |
| driver_vehicles ACTIVE | 8 | |
| audit_logs | 11 | |
| profiles | 1 | ADMIN only |

Dashboard UI khớp: Customers 45, Shippers 1, Consignees 1, Commodities (catalog) 1→4 sau QA, Drivers 9, Vehicles 20.

---

## 3. Integrity checks

| Check | Result |
|---|---|
| Duplicate customer codes/names | 0 |
| Duplicate party names | 0 (business); QA names unique |
| Duplicate driver names | 0 |
| Duplicate vehicle plates | 0 |
| Duplicate IATA | 0 |
| Blank required name/code/plate | 0 |
| Orphan relation rows | **0** all junction tables |
| Multi-default customer_parties | 0 |
| Multi-preferred driver_vehicles | 0 |

---

## 4. Coverage / completeness gaps (business risk)

| Gap | Count | Impact |
|---|---:|---|
| Customers without ACTIVE party | **44 / 45** | Shipper/CNEE master gần như chưa gắn |
| Customers without commodity | **45 / 45** | Goods master chưa liên kết customer |
| Drivers without vehicle | 1 / 9 | Nhỏ |
| Vehicles without driver | **12 / 20** | Nhiều xe chưa gán tài xế |
| Drivers missing phone | **9 / 9** | Contact incomplete |
| Parties missing address | 1 | |
| Vehicles missing type | 1 | |
| Only 1 ADMIN profile | 1 | Không có OPERATOR/VIEWER để test RBAC thật |

---

## 5. QA / process pollution

| Item | Detail |
|---|---|
| QA parties | `QA Party Fix 5478`, `QA Party L81086`, `QA Party PX7059` (và tương tự) |
| QA commodities | `QA Commodity LOCAL EDIT`, `QA Goods 16482`, **2× `QA Double L81086`** |
| audit TEST row | `action=TEST table=qa` (smoke) |
| Recommendation | Archive/delete QA\* rows; add unique constraint or idempotency on create |

---

## 6. Data recommendations (priority)

### P1 — Business data readiness
1. Import/gắn **customer ↔ party** (shipper/consignee) cho phần lớn 45 customers.  
2. Tạo commodity catalog thật + link `customer_commodities`.  
3. Gán driver↔vehicle còn thiếu (12 vehicles).  

### P2 — Completeness & hygiene
4. Bổ sung phone drivers / address parties / vehicle_type.  
5. Dọn QA rows và duplicate `QA Double L81086`.  
6. Redeploy Railway để UI edit mới khớp DB capabilities.  

### P3 — Governance
7. Thêm user OPERATOR/VIEWER để kiểm RBAC trên data.  
8. Chuẩn hóa naming/code conventions trước import lớn.  
9. Idempotent create (disable submit + dedupe key) để tránh double insert.

---

## 7. SQL used (reference)

Counts, orphan checks, duplicate detection, coverage gaps — executed via Supabase MCP `execute_sql` on project `cuakkgauyutapdznqhge` during this audit.
