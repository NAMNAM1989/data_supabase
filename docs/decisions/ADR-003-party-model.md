# ADR-003: Party Model for Shippers and Consignees

**Status:** Accepted  
**Date:** 2026-08-28

## Context

Legacy model lưu shippers/consignees as nested arrays trong customer JSON blob. Điều này gây duplicate data (cùng "ABC TAIWAN" lưu nhiều lần) và khó sync.

## Decision

Sử dụng normalized model:

```text
parties (master entity)
customer_parties (N:N với role SHIPPER | CONSIGNEE)
```

- Một party có thể phục vụ nhiều customers
- Consignee có thể link destination_id
- is_default flag per customer-role

## Consequences

- ✅ Single update to party propagates everywhere
- ✅ Duplicate detection across customers
- ⚠️ UI phức tạp hơn (manage party independently + link)
- ⚠️ Migration từ nested arrays cần dedup logic

## Schema status

Tables exist in Supabase. **0 rows** — data migration pending.
