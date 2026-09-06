# Airlines AWB prefix non-unique Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép nhiều hãng bay ACTIVE cùng một `awb_prefix` (ví dụ SQ + TR = 618); prefix chỉ là gợi ý, identity vẫn là `iata_code`.

**Architecture:** Migration follow-up drop unique partial index, thêm non-unique index. Cập nhật errors/UI/seed/docs/ADR. Không đổi consumer TECS/ops trong PR này.

**Tech Stack:** Supabase Postgres, Next.js MDM app, Node seed script.

## Global Constraints

- Không sửa migration đã apply `20260906140000_create_airlines.sql` — thêm migration mới.
- Không bảng N:M; không `is_awb_prefix_primary`.
- Không đụng `customers` / shipment.
- Unique `iata_code` giữ nguyên.

---

### Task 1: Migration drop unique AWB prefix

**Files:**
- Create: `supabase/migrations/20260906150000_airlines_awb_prefix_non_unique.sql`
- Apply via Supabase MCP `apply_migration` project `cuakkgauyutapdznqhge`

**Interfaces:**
- Produces: index `airlines_awb_prefix_idx` (non-unique); no `airlines_awb_prefix_uidx`

- [ ] **Step 1: Write migration**

```sql
-- AWB prefix is a hint, not airline identity. Multiple airlines may share a prefix (e.g. SQ + TR = 618).
DROP INDEX IF EXISTS public.airlines_awb_prefix_uidx;

CREATE INDEX IF NOT EXISTS airlines_awb_prefix_idx
  ON public.airlines (awb_prefix)
  WHERE awb_prefix IS NOT NULL;
```

- [ ] **Step 2: Apply to remote project**

Apply same SQL via MCP `apply_migration` name `airlines_awb_prefix_non_unique`.

- [ ] **Step 3: Verify**

```sql
SELECT indexname FROM pg_indexes WHERE tablename = 'airlines' AND indexname LIKE '%awb%';
-- expect: airlines_awb_prefix_idx only (no _uidx)
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260906150000_airlines_awb_prefix_non_unique.sql
git commit -m "Allow shared airline AWB prefixes via non-unique index."
```

---

### Task 2: App errors + UI hint

**Files:**
- Modify: `src/lib/errors.ts` — remove `airlines_awb_prefix` DUPLICATE branch
- Modify: `src/components/airlines/airlines-page-client.tsx` — subtitle + form hint under AWB field

- [ ] **Step 1: Remove obsolete duplicate mapping** in `errors.ts` (delete the `airlines_awb_prefix` block).

- [ ] **Step 2: UI copy**

Page subtitle (or under AWB Prefix label):

`Prefix có thể trùng giữa các hãng; định danh theo mã IATA.`

- [ ] **Step 3: Commit**

```bash
git add src/lib/errors.ts src/components/airlines/airlines-page-client.tsx
git commit -m "Clarify AWB prefix is non-unique in airlines UI and errors."
```

---

### Task 3: Seed TR=618 + docs/ADR

**Files:**
- Modify: `scripts/seed-airlines.mjs` — add TR to ops-extra or AWB map `TR: "618"`; ensure seed upserts TR even if missing from ops JSON
- Modify: `docs/03_DATABASE_CONTRACT.md` — awb_prefix note: not unique
- Modify: `docs/decisions/ADR-007-airlines-master.md` — amend unique decision
- Modify: `docs/superpowers/specs/2026-09-06-airlines-awb-prefix-non-unique-design.md` — Status: Accepted

- [ ] **Step 1: Seed** — In `AWB_PREFIX_BY_IATA` set `TR: "618"`. Add fallback airline `{ prefix: "TR", name: "Scoot" }` merged into seed list if not in ops JSON. Set ICAO `TGW`, country `SG`.

- [ ] **Step 2: Run seed**

```bash
node --env-file=.env.local scripts/seed-airlines.mjs
```

Expected: SQ and TR both `awb_prefix=618`.

- [ ] **Step 3: Verify SQL**

```sql
SELECT iata_code, awb_prefix FROM airlines WHERE awb_prefix = '618' ORDER BY 1;
-- SQ, TR (and any others)
```

- [ ] **Step 4: Docs** — contract + ADR-007 amend + mark design Accepted.

- [ ] **Step 5: Commit + push**

```bash
git add scripts/seed-airlines.mjs docs/
git commit -m "Seed Scoot TR sharing AWB 618; document non-unique prefix."
git push
```

---

## Spec coverage

| Spec item | Task |
|---|---|
| Drop unique / add non-unique index | 1 |
| No primary flag / no N:M | Global + all tasks |
| errors.ts | 2 |
| UI hint | 2 |
| Seed TR=618 | 3 |
| DATABASE_CONTRACT + ADR-007 | 3 |
| Success: two ACTIVE same prefix | 3 verify |
