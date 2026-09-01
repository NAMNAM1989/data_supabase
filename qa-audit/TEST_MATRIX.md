# TEST_MATRIX — NAM NAM DATA (2026-09-01 re-audit)

| TC | Function | Type | Env | Result | Notes |
|---|---|---|---|---|---|
| TC-ROUTE-ALL | F010–F170 pages | Happy | Local | PASS | 15/15 routes HTTP 200, correct H1 |
| TC-HEALTH | F180 | Happy | Railway | PASS | `status:ok` |
| TC-AUTH-LOGIN | F001 | Happy | Railway | PASS | Admin login → dashboard |
| TC-AUTH-DEV | F004 | Happy | Local | PASS | `/login` redirects to Dashboard |
| TC-DASH-COUNTS | F010 | Happy | Local | PASS | Matches DB (customers 45, drivers 9, vehicles 20…) |
| TC-CUST-SEARCH-EMPTY | F021 | Negative | Railway | PASS | `___NOMATCH___` → empty state |
| TC-COMM-CREATE | F061 | Happy | Railway+Local | PASS | Created `QA-CM-414101` |
| TC-COMM-EDIT | F062 | Happy | Local | PASS | Renamed to LOCAL EDIT |
| TC-COMM-EDIT-PROD | F062 | Happy | Railway | FAIL | Pencil missing — **prod deploy lag** |
| TC-COMM-EMPTY | F061-empty | Empty | Local | PASS | HTML5 required blocks |
| TC-COMM-DBLCLICK | F061-rapid | Repeated | Local | **FAIL** | Created **2** identical rows |
| TC-PARTY-CREATE | F051 | Happy | Local | PASS | Toast + list refresh |
| TC-PARTY-ARCHIVE | F055/F055b | Happy | Local | PASS | Archive → Restore |
| TC-PARTY-PENCIL | F055c | Happy | Local | PASS | ✏ → detail |
| TC-DEST-EDIT | F072 | Happy | Railway | PASS | Edit dialog opens |
| TC-USER-EDIT-NAME | F153 | Happy | Local | PASS | Dialog opens |
| TC-USER-EDIT-PROD | F153 | Happy | Railway | FAIL | Pencil missing — deploy lag |
| TC-PENCIL-CUST | F025b | Happy | Local | PASS | → customer detail |
| TC-PENCIL-DRV | F082b | Happy | Local | PASS | → driver detail |
| TC-PENCIL-VEH | F092b | Happy | Local | PASS | → vehicle detail |
| TC-PENCIL-PROD | F025b | Happy | Railway | FAIL | No list pencils (old build) |
| TC-GSEARCH | F160 | Happy | Railway | PASS | Dialog opens |
| TC-DUP-SCAN | F130 | Happy | Railway | PASS | Scan runs |
| TC-EXPORT-BTNS | F120 | Happy | Railway | PASS | 3 export buttons |
| TC-LOCAL-STATIC-403 | — | Runtime | Local (stale) | FAIL→PASS | After `.next` clear, 403 gone |
| TC-IMPORT-FULL | F110–F112 | Happy | — | BLOCKED | Not re-run this session (file upload timing) |
| TC-LOGOUT | F002 | Happy | — | BLOCKED | Skipped to keep session |

## Cross-function / state

| Chain | Result | Notes |
|---|---|---|
| CREATE commodity → EDIT → READ (DB) | PASS | Local |
| CREATE party → ARCHIVE → RESTORE | PASS | Local |
| SEARCH empty → clear → list | PASS | Customers |
| OPEN dialog A → ESC → OPEN dialog B | PASS | Commodities |
| dblclick Create | **FAIL** | Duplicate insert |
| Prod list pencil features | **FAIL** | Behind GitHub `master` |
