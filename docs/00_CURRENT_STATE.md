# NAM NAM DATA — Current State Audit (Phase 0)

**Ngày audit:** 2026-08-28  
**Auditor:** Cursor Agent (theo NAM_NAM_DATA_CURSOR_MASTER_PROMPT)  
**Supabase project:** `namnam-customers` (`cuakkgauyutapdznqhge`)  
**Region:** ap-northeast-2 (Seoul)  
**Postgres:** 17.6.1  
**Workspace local:** `E:\project_1\data_supabase` — **trống, chưa có git repo, chưa có code**

---

## 1. Tóm tắt executive

Supabase đã có schema Master Data **gần đúng** với spec, migrations ổn định, RLS bật trên mọi bảng. Dữ liệu thực tế mới migrate một phần: **customers + drivers + vehicles + quan hệ transport**, trong khi **parties / commodities / destinations vẫn trống**. Auth và profiles **chưa được setup**. RLS hiện tại **quá mở** (`using (true)`) — cần thiết kế lại trước production.

Có một điểm **ARCHITECTURE CONFLICT** cần quyết định: schema có thêm `customer_drivers` và `customer_vehicles` (migration 2026-08-27) trong khi master prompt cấm "gắn Vehicle cố định vào Customer". Xem ADR-005.

---

## 2. Supabase project

| Thuộc tính | Giá trị |
|---|---|
| Tên | namnam-customers |
| Ref | cuakkgauyutapdznqhge |
| Trạng thái | ACTIVE_HEALTHY |
| Tạo | 2026-08-21 |
| Org | xyyylqmpcdvpfcrlrewo |

**Project Supabase khác trong cùng org:** `namnamlogistics` — **không dùng** cho NAM NAM DATA (theo master prompt).

---

## 3. Bảng và dữ liệu hiện có

| Bảng | RLS | Rows | Ghi chú |
|---|---|---|---|
| customers | ✅ | 41 | Dữ liệu chính đã có |
| drivers | ✅ | 8 | Đã migrate |
| vehicles | ✅ | 19 | plate_number unique |
| driver_vehicles | ✅ | 8 | N:N đúng spec |
| customer_vehicles | ✅ | 21 | ⚠️ Xem conflict ADR-005 |
| customer_drivers | ✅ | 9 | ⚠️ Xem conflict ADR-005 |
| parties | ✅ | 0 | Schema sẵn, chưa populate |
| customer_parties | ✅ | 0 | Schema sẵn |
| destinations | ✅ | 0 | Schema sẵn |
| commodities | ✅ | 0 | Schema sẵn |
| customer_commodities | ✅ | 0 | Schema sẵn |
| profiles | ✅ | 0 | Chưa có user |
| audit_logs | ✅ | 0 | Chưa có trigger/app ghi log |

### Sample customers

- 41 customers ACTIVE, code dạng `ATU`, `BBE`, `CCE`…
- `customer_type` đa số `DIRECT_SHIPPER`
- `metadata` chủ yếu `{}` hoặc `{ "default_rate_vnd_kg": null }` — **không còn nested JSON blob** kiểu TECSOPS legacy

### Sample transport

- Driver ↔ Vehicle hoạt động (ví dụ: NGUYEN DUC TIN ↔ 51C98731)
- Customer ↔ Driver/Vehicle có quan hệ (9 + 21 rows) — nguồn từ migration TECSOPS

---

## 4. Migrations đã apply

| Version | Tên | Mục đích |
|---|---|---|
| 20260821180825 | create_customers_master | customers + enums cơ bản |
| 20260821181022 | fix_set_updated_at_search_path | Fix search_path trigger |
| 20260822152854 | customers_authenticated_crud_policies | RLS customers |
| 20260822170408 | esid_profile_tables | profiles, audit_logs |
| 20260827154917 | rebuild_shared_master_data_v2 | parties, commodities, destinations, driver_vehicles… |
| 20260827154937 | add_missing_fk_indexes_v2 | FK indexes |
| 20260827155158 | add_customer_transport_relationships | customer_drivers, customer_vehicles |

**Không có migration local trong repo** — migrations chỉ tồn tại trên Supabase remote.

---

## 5. Enums

| Enum | Values |
|---|---|
| app_role | ADMIN, OPERATOR, VIEWER, INTEGRATION |
| record_status | ACTIVE, INACTIVE, ARCHIVED |
| party_role | SHIPPER, CONSIGNEE |
| customer_type | FORWARDER, DIRECT_SHIPPER, AGENT, OTHER |

**Lưu ý:** Cột `customers.customer_type` hiện là `text`, không phải enum `customer_type` — inconsistency nhỏ, có thể chuẩn hóa sau bằng migration nếu cần.

---

## 6. Indexes

Đã có indexes hợp lý cho FK và search:

- Unique: `customers.code`, `vehicles.plate_number`, `drivers.document_number`, `destinations.iata_code`, `commodities.code`, `parties.code`
- Composite unique: `(customer_id, party_id, role)`, `(driver_id, vehicle_id)`, `(customer_id, driver_id)`, `(customer_id, vehicle_id)`, `(customer_id, commodity_id)`
- Partial indexes cho ACTIVE status trên relation tables

**Performance advisor:** 16 indexes chưa được sử dụng (INFO) — bình thường vì app chưa chạy query thật.

---

## 7. Triggers

Mọi bảng master có `trg_*_updated_at` → gọi `set_updated_at()`.

**Chưa có:** audit trigger, profile auto-create on signup.

---

## 8. RLS — tình trạng hiện tại

| Bảng | Policies | Đánh giá |
|---|---|---|
| customers | SELECT/INSERT/UPDATE `using (true)` | ⚠️ Mọi authenticated user full write |
| parties, commodities, destinations, relations… | Tương tự | ⚠️ Không phân role |
| profiles | SELECT own only | ✅ |
| audit_logs | SELECT admin only | ✅ Nhưng chưa có INSERT policy |

**Security advisor:** Không có lint bảo mật nghiêm trọng từ Supabase linter — nhưng policy `using (true)` **vi phạm nguyên tắc** trong master prompt §13.

---

## 9. Auth

| Metric | Giá trị |
|---|---|
| auth.users | 0 |
| profiles | 0 |

→ Cần tạo admin user đầu tiên + trigger/function tạo profile khi signup.

---

## 10. Railway

- **Chưa có** deployment cho NAM NAM DATA
- TECSOPS đã deploy Railway (Dockerfile, `railway.toml`, restart ON_FAILURE) — tham khảo pattern, không copy stack

---

## 11. TECSOPS — tham khảo UI/UX

| Khía cạnh | TECSOPS | NAM NAM DATA |
|---|---|---|
| Framework | Vite + React SPA | **Next.js App Router** (theo spec) |
| Backend | Express + PostgreSQL local/Railway | **Supabase trực tiếp** |
| UI kit | Custom `src/ui/*` (Button, Toast, Skeleton…) | **shadcn/ui** + Tailwind |
| Customer data | Legacy `customerDirectory/` + nested arrays | **Normalized Supabase tables** |
| Deploy | Docker + Railway | Next.js standalone + Railway |
| Excel | ExcelJS có sẵn | ExcelJS (theo spec) |
| Tests | Vitest + Playwright scripts | Vitest + Playwright (theo spec) |

**Patterns hữu ích từ TECSOPS:**
- Design tokens Tailwind (`ui.*` colors, Plus Jakarta Sans)
- Toast/notify pattern
- Skeleton loading
- ConfirmDialog
- SmartSearchBar concept (cần viết lại cho master data)
- Desktop table + filter bar UX
- Excel import preview flow (GoogleSheetImportModal — ý tưởng, không copy code)

**Không copy:**
- `src/components/customerDirectory/*`
- Redux/state blob kiểu SET_CUSTOMERS
- Express server làm data layer
- Shipment/ops components

---

## 12. Gap analysis — cần làm trước khi code

| # | Gap | Ưu tiên |
|---|---|---|
| 1 | Workspace trống — scaffold Next.js | P0 |
| 2 | RLS role-based chưa có | P0 |
| 3 | Auth + profiles + admin bootstrap | P0 |
| 4 | Quyết định customer_drivers/vehicles (ADR-005) | P0 |
| 5 | Migrate parties/commodities/destinations từ TECSOPS | P1 |
| 6 | Audit log write path | P1 |
| 7 | Supabase migrations local sync | P1 |
| 8 | Railway project + env vars | P2 |

---

## 13. Kết luận Phase 0

**Database foundation: 70% sẵn sàng.** Schema đúng hướng normalized master data. Dữ liệu transport đã có; party/commodity/destination cần migration dữ liệu. Security layer (RLS theo role, auth, audit) **chưa production-ready**. App layer **chưa tồn tại**.

**Khuyến nghị:** Hoàn thiện tài liệu Phase 1 → quyết ADR-005 → scaffold Phase 2 → harden RLS trong Phase 2 song song với auth.
