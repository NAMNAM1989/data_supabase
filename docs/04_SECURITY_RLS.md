# NAM NAM DATA — Security & RLS Plan

## 1. Mục tiêu bảo mật

1. RLS **bật** trên mọi bảng public — không tắt để fix lỗi
2. Authorization dựa trên `profiles.role` — **không** dùng `user_metadata`
3. Service role key **chỉ server-side**
4. Không policy `using (true)` cho write operations ở production

---

## 2. Hiện trạng (GAP)

| Issue | Severity | Detail |
|---|---|---|
| Open write policies | **HIGH** | Mọi authenticated user có INSERT/UPDATE trên master tables |
| No DELETE policies | MEDIUM | Hard delete blocked by default (good) nhưng cần explicit |
| audit_logs no INSERT | MEDIUM | Chưa có policy ghi audit từ app |
| profiles no admin manage | MEDIUM | Chưa có policy ADMIN update profiles |
| No auth users | HIGH | Chưa bootstrap admin |

---

## 3. Role permissions matrix

| Action | ADMIN | OPERATOR | VIEWER | INTEGRATION |
|---|---|---|---|---|
| SELECT master data | ✅ | ✅ | ✅ | ✅ (scoped) |
| INSERT master data | ✅ | ✅ | ❌ | ✅ (API only) |
| UPDATE master data | ✅ | ✅ | ❌ | ❌ |
| ARCHIVE/RESTORE | ✅ | ❌ | ❌ | ❌ |
| Import | ✅ | ✅ | ❌ | ❌ |
| Export | ✅ | ✅ | ✅* | ❌ |
| Merge duplicate | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| View audit | ✅ | ❌ | ❌ | ❌ |
| Hard delete | ✅ | ❌ | ❌ | ❌ |

*VIEWER export: configurable via settings V1.1

---

## 4. RLS helper functions (planned migration)

```sql
-- Private schema helpers (security definer, NOT in public)
CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid() AND status = 'ACTIVE';
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION private.has_role(allowed app_role[])
RETURNS boolean AS $$
  SELECT private.get_user_role() = ANY(allowed);
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean AS $$
  SELECT private.get_user_role() = 'ADMIN';
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION private.can_write()
RETURNS boolean AS $$
  SELECT private.get_user_role() IN ('ADMIN', 'OPERATOR');
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public;
```

> Functions đặt trong schema `private` — không expose qua PostgREST.

---

## 5. Policy templates (target state)

### Master tables (customers, parties, commodities, drivers, vehicles, destinations)

```sql
-- SELECT: all active authenticated users
CREATE POLICY "read_<table>" ON <table>
  FOR SELECT TO authenticated
  USING (true);

-- INSERT: ADMIN + OPERATOR
CREATE POLICY "insert_<table>" ON <table>
  FOR INSERT TO authenticated
  WITH CHECK (private.can_write());

-- UPDATE: ADMIN + OPERATOR
CREATE POLICY "update_<table>" ON <table>
  FOR UPDATE TO authenticated
  USING (private.can_write())
  WITH CHECK (private.can_write());
```

### Relation tables (customer_parties, customer_commodities, driver_vehicles, customer_drivers, customer_vehicles)

Same pattern as master tables.

### profiles

```sql
-- Users read own profile
CREATE POLICY "read_own_profile" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admin read all
CREATE POLICY "admin_read_profiles" ON profiles
  FOR SELECT TO authenticated
  USING (private.is_admin());

-- Admin update any profile (role assignment)
CREATE POLICY "admin_update_profiles" ON profiles
  FOR UPDATE TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());
```

### audit_logs

```sql
-- Admin read
CREATE POLICY "admin_read_audit" ON audit_logs
  FOR SELECT TO authenticated
  USING (private.is_admin());

-- Authenticated insert (app writes audit)
CREATE POLICY "authenticated_insert_audit" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (actor_user_id = auth.uid() OR private.is_admin());
```

---

## 6. Auth bootstrap plan

1. Tạo admin user qua Supabase Dashboard hoặc CLI
2. Trigger `on_auth_user_created` → insert profiles row (default VIEWER)
3. Admin đầu tiên promote role = ADMIN manually (one-time SQL)
4. Subsequent users: ADMIN creates via Users page → invite/signup

```sql
-- One-time bootstrap (run manually after first admin signup)
UPDATE profiles SET role = 'ADMIN'
WHERE id = '<first-admin-uuid>';
```

---

## 7. Server-side privileged operations

Dùng service role **chỉ khi**:

| Operation | Why service role |
|---|---|
| Batch import (>100 rows) | Performance + transaction |
| User creation with email | Admin API |
| Merge duplicate (multi-table) | Atomic transaction |

Implement trong Next.js Server Actions với:
- Verify caller is ADMIN via session
- Log audit
- Never expose service role to client

---

## 8. Middleware route protection

```typescript
// middleware.ts
const ADMIN_ROUTES = ['/users', '/audit-logs', '/duplicate-center/merge'];
const OPERATOR_WRITE_ROUTES = ['/import'];

// Redirect unauthenticated → /login
// Redirect VIEWER from write routes → /dashboard + toast
```

---

## 9. Security checklist (pre-production)

- [ ] Replace all `using (true)` write policies
- [ ] Create private helper functions
- [ ] Bootstrap admin user + profile
- [ ] Verify VIEWER cannot INSERT/UPDATE via Supabase client
- [ ] Verify service role not in client bundle (`grep` build output)
- [ ] Enable Supabase Auth email confirmation (optional)
- [ ] Set JWT expiry reasonable (default 1h + refresh)
- [ ] Run Supabase security advisor
- [ ] Pen test: direct API call without session → 401/403

---

## 10. INTEGRATION role (Phase 8)

- Không login UI thông thường
- Dùng dedicated API key hoặc service account
- RLS policy riêng: read all, write limited tables
- Rate limiting ở Railway/API gateway nếu cần
