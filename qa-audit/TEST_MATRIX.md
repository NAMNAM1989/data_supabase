# TEST_MATRIX — NAM NAM DATA (2026-09-02 re-audit #3)

**Method:** Code inventory · Supabase SQL · Local browser CDP · Railway CLI  
**Git:** `70da5c0` · Railway deploy `73584907`

| TC | Function | Type | Env | Result | Notes |
|---|---|---|---|---|---|
| TC-HEALTH-LOCAL | F180 | Happy | Local | PASS | `/api/health` ok |
| TC-HEALTH-RAIL | F180 | Happy | Railway | PASS | `/api/health` ok |
| TC-DEPLOY-FRESH | Deploy | Ops | Railway | PASS | `73584907` SUCCESS, skipBuildCache |
| TC-GIT-CRUD | Source | Static | Repo | PASS | relation update + edit-row + csv |
| TC-TYPECHECK | CI | Static | Local | PASS | tsc |
| TC-UNIT | CI | Unit | Local | PASS | 28/28 |
| TC-CUST-THAOTAC | F025b | UI | Local | PASS | Header «Thao tác» visible (ADMIN) |
| TC-CUST-DATA | F020 | Happy | Local | **FAIL** | «Chưa có customer»; no sb auth cookie |
| TC-CUST-SUA-BTN | F025b | Happy | Local | **BLOCKED** | Không có row → không có nút Sửa |
| TC-SAMPLE-SQL | Data | SQL | Supabase | PASS | 5 QA-SAMPLE full relations |
| TC-SPARSE-PARTY | Data | SQL | Supabase | WARN | 44 customers no party |
| TC-PROD-ANON | Auth | Security | Railway | PASS | 307 → login |
| TC-PROD-SUA | F025b | Happy | Railway | **BLOCKED** | Cần session ADMIN |
| TC-REL-UPDATE-SRC | C | Static | Repo | PASS | update*Relation actions present |
| TC-CSV-BOM | G | Unit | Local | PASS | csv.test.ts |
| TC-MENU-GROUP | A11y | Static | Repo | PASS | DropdownMenuGroup wrap label |

## Cross-function

| Chain | Result | Notes |
|---|---|---|
| Seed → SQL visible | PASS | TAG `QA-SAMPLE-20260902` |
| Seed → Local UI visible | **FAIL** | RLS/auth bypass |
| Push → Railway redeploy | PASS | New deployment after 70da5c0 |
| Redeploy → Prod UI verify | BLOCKED | No audit login session |

## CDP evidence (local `/customers`)

```json
{
  "url": "/customers",
  "rows": 1,
  "sua": 0,
  "thao": true,
  "loading": false,
  "empty": true,
  "sample": false,
  "hasSupabaseAuthCookie": false
}
```
