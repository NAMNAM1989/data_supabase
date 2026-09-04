# DATA_QUALITY_REPORT — NAM NAM DATA

**Date:** 2026-09-02  
**Supabase project:** `cuakkgauyutapdznqhge` (namnam-customers)  
**Method:** SQL via Supabase MCP + cross-check Playwright UI counts

---

## Executive summary

Dữ liệu master **đủ cho demo list/search** nhưng **chưa đủ cho vận hành MDM đầy đủ**: quan hệ customer↔party/commodity gần như trống, nhiều attribute thiếu, còn bản ghi QA test.

**Verdict:** Data **PARTIAL** — cần backfill relations trước khi go-live nghiệp vụ.

---

## Entity counts (2026-09-02)

| Table | Rows | UI visible (prod) | Notes |
|---|---:|---|---|
| customers | 45 | ~45 rows | Includes QA test rows |
| parties | 5 | 5 rows | |
| commodities | 4 | 4 rows | |
| drivers | 9 | 9 rows | |
| vehicles | 20 | 20 rows | |
| destinations | 3 | 3 rows | |
| customer_parties | 2 | — | **44/45 customers unlinked** |
| customer_commodities | 0 | — | **No goods links** |
| profiles | 1 | 1 ADMIN | No OPERATOR/VIEWER for RBAC test |

---

## Quality findings

| ID | Finding | Severity | Recommendation |
|---|---|---|---|
| DQ-001 | 44/45 customers không có party | HIGH | Backfill shipper/consignee |
| DQ-002 | 0 customer_commodities | HIGH | Link goods to customers |
| DQ-003 | QA pollution (`QA*`, `QA Audit*`) | MEDIUM | Archive/delete test rows |
| DQ-004 | Single ADMIN profile | LOW | Create OPERATOR/VIEWER test users |
| DQ-005 | Party attributes sparse (code/tax empty) | MEDIUM | Complete master attributes |

---

## Cross-check UI vs DB

| Check | Result |
|---|---|
| Customer list count | PASS (~45) |
| Search «QA» | PASS (5 QA-related rows) |
| Party «KGN EXPRESS» detail | PASS (matches DB) |
| Edit UI on list | N/A (deploy issue, not data) |

---

*Companion to QA_AUDIT_REPORT.md — 2026-09-02*
