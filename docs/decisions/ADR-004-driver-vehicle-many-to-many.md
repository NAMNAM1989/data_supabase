# ADR-004: Driver-Vehicle Many-to-Many

**Status:** Accepted  
**Date:** 2026-08-28

## Context

Quan hệ thực tế: một tài xế chạy nhiều xe, một xe có nhiều tài xế. Legacy code có thể gắn driver_id trực tiếp trên vehicle.

## Decision

Sử dụng junction table `driver_vehicles`:

```text
drivers ── driver_vehicles ── vehicles
UNIQUE(driver_id, vehicle_id)
```

Fields: is_preferred, valid_from, valid_to, status.

**Không** có `vehicles.driver_id` hoặc `drivers.vehicle_id`.

## Consequences

- ✅ Reflects real-world assignment
- ✅ Historical tracking via valid_from/valid_to
- ✅ Already implemented and populated (8 rows)

## Schema status

✅ Implemented and in use.
