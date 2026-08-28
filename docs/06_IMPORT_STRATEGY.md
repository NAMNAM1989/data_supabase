# NAM NAM DATA — Import Strategy

## 1. Nguyên tắc

1. **Không import thẳng** file vào database
2. Luôn có **preview** trước khi confirm
3. **Normalize → Validate → Detect duplicates → User decision → Commit**
4. Mọi import phải **audit** (action = IMPORT)
5. Batch commit dùng transaction (server-side)

---

## 2. Supported import types V1

| Import type | Priority | Source |
|---|---|---|
| Customers | P0 | Excel template |
| Parties (Shipper/Consignee) | P0 | Excel + link customer |
| Commodities | P1 | Excel |
| Destinations | P1 | Excel (IATA list) |
| Drivers | P1 | Excel |
| Vehicles | P1 | Excel |
| Combined customer directory | P2 | Legacy TECSOPS export |

---

## 3. Import flow

```text
┌─────────┐    ┌─────────┐    ┌────────────┐    ┌──────────┐
│ Upload  │───▶│  Parse  │───▶│ Map Columns│───▶│ Normalize│
│ .xlsx   │    │ ExcelJS │    │ (UI step)  │    │  layer   │
└─────────┘    └─────────┘    └────────────┘    └────┬─────┘
                                                      │
┌─────────┐    ┌─────────┐    ┌────────────┐         │
│ Commit  │◀───│ Preview │◀───│  Validate  │◀────────┤
│ + Audit │    │ + Decide│    │ + Duplicates│        │
└─────────┘    └─────────┘    └────────────┘         │
```

---

## 4. Column mapping UI

- Auto-detect headers (fuzzy match: "Mã KH" → code, "Tên" → name)
- User can override mapping per column
- Save mapping template for reuse
- Show sample rows (first 5) after mapping

---

## 5. Validation rules

### Customers
| Field | Rule |
|---|---|
| code | required, unique, uppercase |
| name | required |
| customer_type | enum hoặc default OTHER |
| email | email format nếu có |
| status | default ACTIVE |

### Parties
| Field | Rule |
|---|---|
| name | required |
| role | SHIPPER or CONSIGNEE |
| customer_code | must exist in DB or same import batch |
| destination | IATA must exist hoặc flagged |

### Drivers
| Field | Rule |
|---|---|
| full_name | required |
| document_number | unique nếu có |
| code | unique nếu có |

### Vehicles
| Field | Rule |
|---|---|
| plate_number | required, unique, normalized |
| plate_display | optional |

---

## 6. Duplicate detection

| Entity | Match keys | Similarity |
|---|---|---|
| Customer | code (exact) | — |
| Party | name + address + tax_code | fuzzy name (≥0.85) |
| Driver | document_number (exact), code (exact) | name fuzzy |
| Vehicle | plate_number (exact) | — |
| Commodity | code (exact), name (fuzzy) | |
| Destination | iata_code (exact) | — |

### User decisions per row

| Decision | Behavior |
|---|---|
| Skip | Không import row |
| Create New | Insert new record |
| Update Existing | Merge fields vào record existing |
| Merge | Combine relations (party merge — ADMIN only) |

**Không auto-merge** khi không chắc chắn.

---

## 7. Preview UI

Table columns:
- Row # | Status icon | Data preview | Match found | Action (dropdown)

Summary bar:
- Total rows | Valid | Warnings | Errors | Duplicates
- [Import Selected] [Cancel]

Color coding:
- 🟢 Valid new
- 🟡 Duplicate — needs decision
- 🔴 Error — cannot import

---

## 8. Commit strategy

```typescript
// Server Action: commitImport(batch: ImportRow[])
async function commitImport(batch) {
  // 1. Verify session + role (ADMIN/OPERATOR)
  // 2. Begin transaction (service role client)
  // 3. Process rows in order (masters before relations)
  // 4. Write audit_logs per entity
  // 5. Return summary { created, updated, skipped, errors }
}
```

Order of insert:
1. destinations, commodities (no deps)
2. customers, parties, drivers, vehicles
3. relation tables

---

## 9. Error handling during commit

| Error | Handling |
|---|---|
| Unique violation mid-batch | Rollback row, continue others, report |
| FK violation | Skip row, log reason |
| RLS denied | Abort entire batch |
| Network timeout | Retry with idempotency key |

---

## 10. Export (symmetric)

- Export current filtered view to Excel
- Include all visible columns + id (hidden column for re-import)
- VIEWER: export allowed if setting enabled

---

## 11. Excel templates

Provide downloadable templates in `/public/templates/`:
- `import-customers.xlsx`
- `import-parties.xlsx`
- `import-drivers-vehicles.xlsx`

Headers match normalization expectations.

---

## 12. TECSOPS migration import

One-time script (not UI) để migrate legacy data:
- Read TECSOPS PostgreSQL hoặc JSON export
- Transform nested arrays → normalized inserts
- Run duplicate detection
- Dry-run mode default

Script location: `scripts/migrate-from-tecsops/` — Phase 3 task.

---

## 13. Testing import

| Test | Type |
|---|---|
| Normalization functions | Unit |
| Column mapping | Unit |
| Duplicate detection | Unit |
| Preview without commit | Integration |
| Full import round-trip | Integration |
| Import preview E2E | Playwright |

Sample fixtures: `tests/fixtures/import/`
