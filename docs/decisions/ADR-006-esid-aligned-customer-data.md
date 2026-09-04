# ADR-006: ESID-aligned Customer & Party Master Data

**Status:** Accepted  
**Date:** 2026-09-04  
**Source:** TCS form `https://www.tcs.com.vn/Esid/Export` (field catalog)

## Context

NAM NAM DATA là source of truth cho app liên kết (TECS). Form khai ESID cần nhiều field hơn schema cũ: Fax, Agent, Notify, người đăng ký khai, payment term, origin. Agent đang hardcode trong settings extension → lệch MDM.

## Decision

Mô hình 4 lớp:

1. **parties** — pháp nhân ESID (+ `fax`)
2. **customer_parties.role** — `SHIPPER | CONSIGNEE | AGENT | NOTIFY`
3. **customer_esid_profiles** (1:1) — default fill: declarant, payment, origin, agent/notify FK
4. **Ops shipment** — AWB/flight/pieces/HAWB ở TECS, không đưa vào customer master

## Consequences

- ✅ Fill ESID đủ field từ MDM, không phụ thuộc settings cứng
- ✅ Agent/Notify tái sử dụng như Shipper/Consignee
- ⚠️ UI customer detail thêm tab/section ESID
- ⚠️ TECS cần đọc `customer_esid_profiles` + fax khi sync

## Non-goals

- Không lưu AWB / chuyến bay / số kiện vào customers
- Không thay catalog company TCS (`/api/EsidCtcCmp/GetByUsr`) — chỉ cung cấp dữ liệu match
