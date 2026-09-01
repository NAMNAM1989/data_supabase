# TEST_MATRIX (executed subset)

| TC ID | Function | Type | Result | Notes |
|---|---|---|---|---|
| TC-AUTH-01 | F004 | Happy | PARTIAL | Password sync required |
| TC-DASH-01 | F010 | Happy | PASS | Stats render |
| TC-CUST-01 | F021 | Happy | PASS | Search CYL |
| TC-CUST-02 | F021 | Negative | PASS | ZZZNOMATCH |
| TC-CUST-03 | F021 | Clear | PASS | Restore list |
| TC-CUST-04 | F024 | Empty | PASS | Dialog stays |
| TC-CUST-05 | F024 | Happy | PASS | QA889438 / QA979998 |
| TC-CUST-06 | F024 | Duplicate | PASS | Toast tồn tại |
| TC-CUST-07 | F025 | Happy | PASS | Detail URL |
| TC-CUST-08 | F030 | Invalid email | PASS | Email không hợp lệ |
| TC-CUST-09 | F031 | Archive | PASS | Status archived |
| TC-CUST-10 | F031 | Restore rapid | FAIL | Toast intercept |
| TC-PARTY-01 | F051 | Happy | FAIL | Invalid input |
| TC-COMM-01 | F061 | Happy | PASS | QA Goods |
| TC-DEST-01 | F071 | Invalid IATA | PASS | length validation |
| TC-DEST-02 | F071 | Happy | PASS | Q10/Q86 |
| TC-DEST-03 | F071 | Duplicate | PASS | Dữ liệu đã tồn tại |
| TC-DRV-01 | F081 | Happy | PASS | QA Driver |
| TC-VEH-01 | F091 | Happy | PASS | 50QA83831 |
| TC-EXP-01 | F120-122 | Happy | PASS | CSV downloads |
| TC-IMP-01 | F110 | Preview | PASS | duplicates detected |
| TC-IMP-02 | F112 | Update commit | PASS | 2 cập nhật |
| TC-DUP-01 | F130 | Scan | PASS | 0 groups |
| TC-SEARCH-01 | F170-172 | Happy | PASS | QA multi-entity |
| TC-SET-01 | F160 | Happy | FAIL | Audit RLS |
| TC-AUDIT-01 | F140 | Happy | FAIL | Empty |
| TC-USER-01 | F151 | Empty | PASS | Dialog stays |
| TC-ROUTE-01 | All nav | Smoke | PASS | 15 routes 200 |
