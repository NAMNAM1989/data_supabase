# ADR-002: Separate Data Manager from TECSOPS

**Status:** Accepted  
**Date:** 2026-08-28

## Context

TECSOPS hiện là app OPS (shipments, tracking) và từng chứa customer directory với nested JSON arrays (savedShippers, savedConsignees, savedGoods).

Master prompt yêu cầu tách NAM NAM DATA thành app riêng.

## Decision

1. NAM NAM DATA là **repository và application riêng**
2. Tech stack khác: Next.js (không Vite SPA + Express)
3. TECSOPS chỉ **đọc** master data từ Supabase (Phase 8)
4. Không copy legacy customer directory architecture

## Consequences

- ✅ Clear separation of concerns
- ✅ Master data không bị ảnh hưởng bởi ops releases
- ⚠️ Cần migration data từ TECSOPS sang Supabase
- ⚠️ Hai deployments cần maintain

## TECSOPS patterns allowed to reuse

- UI design tokens (colors, fonts)
- Toast, dialog, skeleton UX patterns
- Excel import/export concepts
- Testing patterns (Vitest + Playwright)

## TECSOPS patterns forbidden

- `CustomerDirectoryEntry`, `savedShippers[]`, `SET_CUSTOMERS`
- Express server as data layer
- Shipment/ops components
