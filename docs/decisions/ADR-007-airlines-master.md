# ADR-007: Airlines master separate from Destinations

**Status:** Accepted  
**Date:** 2026-09-06  

## Context

Air cargo ops và TECS cần hai loại IATA khác nhau:

| Khái niệm | Độ dài | Ví dụ | Master hiện có |
|---|---|---|---|
| Sân bay | 3 ký tự | `TPE`, `SGN` | `destinations` |
| Hãng bay | 2 ký tự | `CI`, `VN`, `5J` | không có (ops JSON / TECS string) |
| AWB prefix | 3 số | `297`, `738` | không có |

ADR-001/002: master data thuộc Supabase. ADR-006: không nhét chuyến bay/AWB đầy đủ vào customers — chỉ reference master.

## Decision

1. Bảng mới **`airlines`** — **không** gộp vào `destinations`.
2. Pattern giống destinations: CRUD + soft archive `status`, RLS `anon` SELECT `status = ACTIVE`.
3. Unique: `iata_code` (2 ký tự); partial unique `awb_prefix` khi không null.
4. V1: MDM web + migration + seed + anon read. Consumer TECS/ops đổi schema follow-up.

## Non-goals

- Không lưu `flight_number`, `flight_date`, AWB đầy đủ — thuộc shipment runtime.
- Không bắt buộc wire TECS / `ops_aircargo` trong cùng thay đổi schema.
- Không thay `destinations` semantics (airport).

## Consequences

- ✅ SSoT cho airline code + AWB prefix
- ✅ TECS/ops có thể thay JSON/fallback bằng REST `airlines?status=eq.ACTIVE`
- ⚠️ Seed AWB prefix chỉ cover hãng hay dùng; thiếu prefix thì để null và bổ sung sau
