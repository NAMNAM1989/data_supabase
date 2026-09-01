# Bootstrap Admin & Deploy (data_supabase)

## Tên project đồng bộ

| Nền tảng | Tên | Ghi chú |
|---|---|---|
| Workspace / Railway | `data_supabase` | Đã cấu hình |
| Supabase | Đổi display name → `data_supabase` | Dashboard → Project Settings → General (ref `cuakkgauyutapdznqhge` giữ nguyên) |

---

## 1. Admin đã bootstrap

| Field | Value |
|---|---|
| Email | `namnamlogistics@gmail.com` |
| Role | `ADMIN` |
| Status | `ACTIVE` |

**Mật khẩu:** xem output khi bootstrap (hoặc reset qua Supabase Dashboard → Authentication → Users).

---

## 2. Biến môi trường

### Local (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://cuakkgauyutapdznqhge.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_b5m0H9q9RkVVl12LzJCbCA_DXnGvGFX
SUPABASE_SERVICE_ROLE_KEY=<từ Supabase Dashboard → Settings → API>
```

### Railway (`data_supabase` service)

```powershell
railway link          # project data_supabase
railway service link data_supabase
railway variables set SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Đã set sẵn: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

---

## 3. Script bootstrap (lần sau)

```powershell
# Cần SUPABASE_SERVICE_ROLE_KEY thật
node scripts/bootstrap-admin.mjs
```

Tùy chọn: `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NAME`.

---

## 4. Deploy Railway

**Production:** https://datasupabase-production.up.railway.app

```powershell
railway up --detach
railway domain
curl.exe https://datasupabase-production.up.railway.app/api/health
```

---

## 5. Kiểm tra login

1. `npm run dev` (local) hoặc mở URL Railway
2. **Local + `DEV_SKIP_AUTH=true`:** vào thẳng `/dashboard`, không cần login
3. **Production:** `/login` → email admin + mật khẩu
4. Dashboard hiển thị sau khi đăng nhập thành công

### Bỏ login khi dev local

Trong `.env.local`:

```env
DEV_SKIP_AUTH=true
DEV_AUTH_EMAIL=namnamlogistics@gmail.com
DEV_AUTH_PASSWORD=<mật khẩu admin>
```

App tự đăng nhập ngầm (middleware) và redirect `/login` → `/dashboard`.  
**Chỉ hoạt động khi `NODE_ENV=development`** — Railway/production vẫn bắt login.

### RLS notes (2026-09-01)

- `audit_logs`: SELECT (ADMIN) + INSERT (`actor_user_id = auth.uid()`)
- `profiles`: SELECT own + UPDATE own (`id = auth.uid()`)
