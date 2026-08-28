# ADR-001: Supabase as Single Source of Truth

**Status:** Accepted  
**Date:** 2026-08-28

## Context

Nam Nam Logistics cần một nguồn dữ liệu master tập trung phục vụ nhiều ứng dụng (TECSOPS, extensions, future apps).

## Decision

Supabase project `namnam-customers` là **single source of truth** cho toàn bộ master data.

- PostgreSQL hosted by Supabase
- Auth managed by Supabase Auth
- RLS enforced at database level
- NAM NAM DATA app chỉ là admin UI — không sở hữu data

## Consequences

- ✅ Một nơi duy nhất để sync data giữa apps
- ✅ RLS bảo vệ ngay cả khi app bị compromise
- ⚠️ Phụ thuộc Supabase uptime
- ⚠️ Schema changes cần migration discipline

## Alternatives rejected

- Railway PostgreSQL riêng — duplicate source, sync complexity
- JSON/local files — không scale, no concurrent access
- TECSOPS PostgreSQL — mixing ops + master data
