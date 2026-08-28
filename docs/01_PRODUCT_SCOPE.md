# NAM NAM DATA — Product Scope

## 1. Định nghĩa sản phẩm

**NAM NAM DATA** là ứng dụng **Master Data Management** nội bộ của Nam Nam Logistics.

Đây **không phải** module TECSOPS, không phải app shipment/tracking/booking/accounting.

NAM NAM DATA là **giao diện quản trị** cho Supabase Master Database — single source of truth cho mọi app khác (TECSOPS, Chrome Extensions, …).

---

## 2. Người dùng mục tiêu

| Persona | Role | Nhu cầu chính |
|---|---|---|
| Admin | ADMIN | Full control, users, audit, merge duplicate |
| Data entry staff | OPERATOR | CRUD master data, import Excel |
| Manager / viewer | VIEWER | Read-only, export |
| Integration service | INTEGRATION | API read/write có kiểm soát (không dùng UI) |

---

## 3. Phạm vi V1 (In Scope)

### Master Data
- Customers — CRUD, archive/restore
- Parties (Shipper / Consignee) — quản lý độc lập + liên kết Customer
- Commodities — master + liên kết Customer
- Destinations — IATA reference data

### Transport
- Drivers — CRUD
- Vehicles — CRUD
- Driver ↔ Vehicle — N:N assignment

### Data Tools
- Excel Import — preview, validate, duplicate detection
- Export — CSV/Excel
- Duplicate Center — đề xuất + user confirm merge
- Global Search — cross-entity

### System
- Auth (Supabase)
- Role-based access
- Audit logs (UI + filter)
- User management (ADMIN)
- Settings cơ bản

### Dashboard
- Counts: customers, shippers, consignees, commodities, drivers, vehicles
- Inactive records, duplicate warnings, recent changes
- **Không** biểu đồ phức tạp V1

---

## 4. Out of Scope V1

| Item | Lý do |
|---|---|
| Shipment / booking / tracking | Thuộc TECSOPS |
| Accounting / billing | App khác |
| Realtime mọi table | TanStack Query invalidate đủ V1 |
| TECSOPS integration trực tiếp | Phase 8 — sau khi app ổn |
| Prisma / ORM | Supabase SDK + SQL đủ |
| Mobile-first ops UI | Desktop-first data entry |
| Auto merge duplicate | User phải confirm |

---

## 5. Non-functional requirements

| Yêu cầu | Target |
|---|---|
| Data integrity | Supabase = source of truth, soft delete only |
| Security | RLS theo role, no service role in browser |
| Performance | Table load < 2s cho ~500 customers |
| Maintainability | `src/lib/master-data/` layer, no query in JSX |
| Deploy | Railway, stateless, health check |
| Testing | Unit + integration + Playwright critical paths |
| CI | lint, typecheck, test, build |

---

## 6. Success criteria V1

1. Admin login → dashboard hiển thị counts đúng
2. CRUD customer + link shipper/consignee/commodity hoạt động
3. CRUD driver/vehicle + assign N:N
4. Import Excel có preview, không import thẳng
5. Global search trả kết quả đúng entity
6. Archive/restore không hard delete
7. Audit log ghi INSERT/UPDATE/ARCHIVE/IMPORT
8. Build pass, deploy Railway production

---

## 7. Phase roadmap (tóm tắt)

| Phase | Nội dung |
|---|---|
| 0 | Audit ✅ |
| 1 | Architecture docs ✅ |
| 2 | Foundation (Next.js, auth, shell) |
| 3 | Customer domain |
| 4 | Transport domain |
| 5 | Data tools |
| 6 | System (audit, users) |
| 7 | Railway production |
| 8 | Integration contract (TECSOPS) |
