# NAM NAM DATA — Test Strategy

## 1. Testing pyramid

```text
        ┌───────────┐
        │ Playwright │  E2E critical paths
        ├───────────┤
        │ Integration│  CRUD + RLS + relations
        ├───────────┤
        │   Unit     │  Normalization, validation, helpers
        └───────────┘
```

---

## 2. Tooling

| Tool | Purpose |
|---|---|
| Vitest | Unit + integration |
| @testing-library/react | Component tests (selective) |
| Playwright | E2E |
| MSW hoặc Supabase local | Mock API (optional) |

**CI command:** `npm run ci` = lint + typecheck + vitest + build

---

## 3. Unit tests (required)

### lib/normalization/
- `normalizeCustomerCode()` — trim, uppercase
- `normalizePlateNumber()` — 51C-123.45 → 51C12345
- `normalizeEmail()` — lowercase
- `normalizePhone()` — whitespace only

### lib/validation/
- Zod schemas: customer, party, commodity, driver, vehicle, destination
- Edge cases: empty, max length, invalid enum

### lib/import/
- Column mapping auto-detect
- Duplicate detection algorithms
- Row validation aggregator

### lib/auth/
- `canPerform(action, role)` permission helper
- Route access matrix

---

## 4. Integration tests (required)

Sử dụng Supabase test project hoặc local Supabase (`supabase start`).

| Suite | Cases |
|---|---|
| Customer CRUD | create, update, archive, restore, unique code |
| Party relation | link shipper, link consignee with destination, set default |
| Commodity relation | link, unlink, usage_count |
| Driver-Vehicle | assign, unassign, unique pair |
| Customer transport | link driver/vehicle to customer [ADR-005] |
| RLS | VIEWER cannot insert; OPERATOR cannot archive; ADMIN full |
| Audit | write + read logs |

---

## 5. Playwright E2E (critical paths)

| # | Flow | Priority |
|---|---|---|
| 1 | Login → Dashboard | P0 |
| 2 | Create Customer | P0 |
| 3 | Add Shipper to Customer | P0 |
| 4 | Add Consignee to Customer | P0 |
| 5 | Assign Commodity | P1 |
| 6 | Create Driver + Vehicle | P1 |
| 7 | Assign Driver ↔ Vehicle | P1 |
| 8 | Global Search | P1 |
| 9 | Import Preview (no commit) | P1 |
| 10 | Archive / Restore | P1 |

Config:
- `playwright.config.ts` — base URL from env
- Test user credentials from env (never committed)
- Cleanup script after mutation tests

---

## 6. Test data strategy

| Environment | Data |
|---|---|
| Local dev | Seed script `scripts/seed-dev.ts` |
| CI | Ephemeral Supabase branch hoặc docker |
| E2E | Dedicated test user + prefixed test records (`TEST_`) |
| Production | No test data |

---

## 7. CI pipeline (.github/workflows/ci.yml)

```yaml
jobs:
  ci:
    steps:
      - checkout
      - setup-node (20)
      - npm ci
      - npm run lint
      - npm run typecheck
      - npm test
      - npm run build
  # Optional: playwright on main only
  e2e:
    needs: ci
    if: github.ref == 'refs/heads/main'
    steps:
      - npm run test:e2e
```

**Rule:** Không deploy production nếu build fail.

---

## 8. Definition of Done — testing

Một feature hoàn thành khi:
- [ ] Unit tests cho business logic mới
- [ ] Integration test cho CRUD path (nếu có DB interaction)
- [ ] E2E cho critical user flow (nếu user-facing major feature)
- [ ] `npm run ci` pass locally
- [ ] No regression in existing tests

---

## 9. Coverage targets (guideline)

| Area | Target |
|---|---|
| normalization/ | 100% |
| validation/ | 100% |
| master-data/ | 80%+ |
| components/ | 50%+ (focus on logic, not snapshot) |
| Overall | 70%+ |

Không chase 100% coverage — focus meaningful behavior tests.

---

## 10. Manual QA checklist (pre-release)

- [ ] Login/logout all roles
- [ ] Create/edit/archive each entity type
- [ ] Import Excel 50+ rows
- [ ] Search all entity types
- [ ] Responsive check (1280, 768, 375)
- [ ] Error states (network offline, duplicate, permission denied)
- [ ] Railway deploy smoke test
