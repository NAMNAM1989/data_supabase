# Design: Airlines AWB prefix non-unique

**Status:** Accepted  
**Date:** 2026-09-06  
**Repo:** `data_supabase`  
**Related:** ADR-007, migration `20260906140000_create_airlines.sql`, `20260906150000_airlines_awb_prefix_non_unique.sql`

## Problem

V1 đặt **partial UNIQUE** trên `airlines.awb_prefix`. Thực tế air cargo: nhiều hãng (subsidiary / cùng group) dùng chung một AWB prefix — ví dụ **SQ** và **TR** cùng `618`. Unique chặn seed/CRUD hợp lệ và khuyến khích hiểu sai prefix = identity hãng.

## Decision (đã chốt)

1. **Approach A:** giữ cột `awb_prefix` trên `airlines`; **bỏ unique**; thêm index thường để lookup.
2. **Lookup behavior (option 2):** prefix chỉ **gợi ý danh sách**; shipment/UI **bắt buộc** chọn `iata_code`. Không cờ primary, không auto-map.

## Schema change

```sql
DROP INDEX IF EXISTS public.airlines_awb_prefix_uidx;

CREATE INDEX IF NOT EXISTS airlines_awb_prefix_idx
  ON public.airlines (awb_prefix)
  WHERE awb_prefix IS NOT NULL;
```

Giữ nguyên:
- `UNIQUE (iata_code)`
- `CHECK (awb_prefix IS NULL OR awb_prefix ~ '^[0-9]{3}$')`
- RLS anon SELECT `status = ACTIVE`

## Semantics

| Field | Role |
|---|---|
| `iata_code` | Unique identity của hãng — bắt buộc khi lưu shipment |
| `awb_prefix` | Hint / filter; **0..N airlines** cùng giá trị |

Consumer query gợi ý:

```http
GET /rest/v1/airlines?awb_prefix=eq.618&status=eq.ACTIVE&select=iata_code,name,short_name,awb_prefix
```

→ list; không chọn hộ.

## App / docs changes (MDM)

- Migration mới (không sửa file migration đã apply nếu đã deploy — thêm migration follow-up).
- `src/lib/errors.ts`: bỏ (hoặc nới) mapping duplicate `airlines_awb_prefix`.
- UI airlines: hint “Prefix có thể trùng; định danh theo IATA”.
- `scripts/seed-airlines.mjs`: cho phép nhiều IATA cùng prefix; bổ sung TR=`618` nếu có trong catalog ops.
- Cập nhật `docs/03_DATABASE_CONTRACT.md` + `docs/decisions/ADR-007-airlines-master.md` (amend decision: awb_prefix không unique).

## Non-goals

- Không bảng N:M `airline_awb_prefixes`.
- Không `is_awb_prefix_primary`.
- Không bắt buộc wire TECS/ops trong cùng PR (chỉ contract cho follow-up).
- Không đụng `customers` / shipment schema.

## Success criteria

- Có thể INSERT/UPDATE hai ACTIVE airlines cùng `awb_prefix` (ví dụ SQ + TR = `618`).
- Lookup theo prefix trả về ≥2 hàng khi data có share.
- Unique vẫn enforce trên `iata_code`.
- Docs/ADR phản ánh semantics mới.
