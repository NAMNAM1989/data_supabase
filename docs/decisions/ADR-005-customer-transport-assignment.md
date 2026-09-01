# ADR-005: Customer Transport Assignment Tables

**Status:** Accepted (Option A)  
**Date:** 2026-08-28

## Context

Master prompt §40 nói rõ:

> 5. Gắn Vehicle cố định vào Customer.

Nhưng Supabase migration `add_customer_transport_relationships` (2026-08-27) đã tạo:

```text
customer_drivers (customer_id, driver_id, is_default, status)
customer_vehicles (customer_id, vehicle_id, is_default, status)
```

Hiện có **9 customer_drivers** và **21 customer_vehicles** rows — migrated từ TECSOPS.

## ARCHITECTURE CONFLICT

| Master Prompt | Current Schema |
|---|---|
| Không gắn vehicle/driver cố định vào customer | Có bảng customer_drivers, customer_vehicles |
| Driver ↔ Vehicle = N:N only | N:N exists **plus** customer assignment |

## Analysis

Hai khái niệm khác nhau:

1. **Operational capability:** Driver X có thể chạy Vehicle Y (`driver_vehicles`)
2. **Customer preference:** Customer CYL thường dùng Driver A và Vehicle B (`customer_drivers`, `customer_vehicles`)

Bảng customer_* không vi phạm tinh thần "không gắn driver_id vào vehicle" — chúng là **assignment preference**, không phải ownership.

TECSOPS cần biết "customer này dùng xe/tài xế nào mặc định" khi tạo shipment.

## Proposed Resolution (Option A — Recommended)

**Giữ** `customer_drivers` và `customer_vehicles` với tên gọi rõ ràng:

- Document as "Customer Transport Preferences" (không phải ownership)
- UI: tab "Preferred Drivers/Vehicles" trong Customer detail (Phase 3+)
- Master prompt §40 cần amend: "Không coi driver/vehicle là **sở hữu** của customer" thay vì cấm hoàn toàn

## Alternative (Option B)

**Xóa** customer_drivers/customer_vehicles:
- Migrate 9+21 rows vào metadata hoặc bỏ
- TECSOPS tự quản lý preference locally
- ❌ Mất master data sync, vi phạm single source of truth

## Alternative (Option C)

**Merge** vào customer_parties pattern:
- Treat drivers/vehicles as "transport parties"
- ❌ Over-engineering, drivers/vehicles không phải parties

## Decision

**Accepted Option A** (2026-08-28): Giữ `customer_drivers` và `customer_vehicles` như **Customer Transport Preferences** — không phải ownership. UI sẽ có tab "Preferred Drivers/Vehicles" trong Customer detail.

## Consequences if Option A accepted

- ✅ Preserve migrated data
- ✅ TECSOPS can read customer transport prefs from Supabase
- ⚠️ Master prompt needs minor amendment
- ⚠️ UI thêm scope: Customer → Preferred Drivers/Vehicles tab

## Action required

- [x] Option A: Giữ customer_drivers/vehicles as preferences (accepted 2026-08-28)
