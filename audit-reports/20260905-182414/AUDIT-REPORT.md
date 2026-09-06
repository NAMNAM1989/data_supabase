# AUDIT REPORT — NAM NAM DATA (`data_supabase`)

- **Chế độ:** `AUDIT_ONLY` (không sửa code, không push, không deploy)
- **Múi giờ báo cáo:** Asia/Ho_Chi_Minh (UTC+7)
- **Thời điểm:** 2026-09-05 18:24:14 +07
- **Đường dẫn:** `audit-reports/20260905-182414/AUDIT-REPORT.md`
- **Commit audit:** `f7ff12c876eeed0decb040199a88f1a9f9181244` (`master`)
- **Working tree:** sạch trừ file đính kèm audit local `AUDIT-GITHUB-RAILWAY.md` (untracked, không thuộc repo)

---

## 1. Tóm tắt

| Lớp | Đánh giá |
|---|---|
| Source / repo checkout | **Nhẹ–trung bình** (~770 KB mã quản lý; Git ~2 MB) |
| Dependencies cài đặt | **Nặng theo kỳ vọng** (`node_modules` ~562 MB) — không kết luận “nặng app” chỉ từ số này |
| Build / artifact | **Trung bình** (standalone ~30 MB; static ~2.5 MB; top JS chunk ~313 KB raw) |
| Runtime Railway (1h) | **Nhẹ** (CPU ~0; RAM ~0.09 GB) |
| CI/CD & deploy sync | **Rủi ro vận hành cao** — CI không chạy trên `master`; production lệch code mới |
| Frontend hiệu năng thực địa | **Chưa đủ dữ liệu** (chưa đo Lighthouse/INP production có đăng nhập) |

### 5 vấn đề chính

1. **Production Railway lệch `master`** — live deploy thành công gần nhất `2026-09-02`; GitHub đã push tới `2026-09-05` (`f7ff12c`). Hard-delete / font / audit fixes có thể chưa lên production.
2. **CI GitHub không kích hoạt trên branch mặc định `master`** — workflow chỉ `main`/`develop` → push hiện tại không chạy lint/typecheck/test/build trên Actions.
3. **`npm run lint` fail (7 lỗi `no-explicit-any`)** — `npm run ci` sẽ fail; CI nếu chạy cũng đỏ.
4. **Dependency `xlsx` (HIGH)** — Prototype Pollution; dùng trong import spreadsheet.
5. **List master data không pagination** — `getCustomers` / tương tự `.select("*")` không `limit` → rủi ro chậm khi dữ liệu lớn.

**Ảnh hưởng người dùng:** production có thể thiếu tính năng/bugfix đã merge; lỗi unique trên destinations/commodities đã xuất hiện trong log runtime.  
**Rủi ro vận hành:** không có gate CI trên nhánh deploy thực tế; drift config builder Railway vs `railway.toml`.

---

## 2. Phạm vi

### Stack (CONFIRMED)

- Next.js **16.3.3** App Router, React 19, TypeScript, Tailwind 4, shadcn/Base UI
- Supabase Auth + Postgres (project ref `cuakkgauyutapdznqhge`)
- TanStack Query, Zod, React Hook Form
- Deploy: Railway project `data_supabase` + Docker/`railway.toml` trong repo
- Package manager: npm + `package-lock.json`

### Module đã kiểm tra (đọc / đo / lệnh)

- Git remote/branch/SHA, README, `railway.toml`, `Dockerfile`, `.github/workflows/ci.yml`, `next.config.ts`, middleware/auth
- Master-data list/actions patterns, import (`xlsx`), health API, permissions
- Lệnh: `typecheck`, `lint`, `test`, `build`, `npm audit --omit=dev`
- Railway MCP: status, services, domains, variables (chỉ **tên**), metrics 1h, deploy/runtime logs
- GitHub: branches, default branch, visibility, workflow metadata
- Supabase advisors (security)
- Smoke: `GET https://datasupabase-production.up.railway.app/api/health` → 200

### Module / kiểm tra chưa làm hoặc BLOCKED

| Hạng mục | Trạng thái | Lý do |
|---|---|---|
| E2E login + CRUD trên production/local UI | **BLOCKED** | Không dùng secret/password người dùng; không smoke ghi production |
| Lighthouse / INP thực tế | **NOT RUN** | Cần session + tooling trình duyệt có kiểm soát |
| Bundle analyzer chi tiết theo route | **NOT RUN** | Không thêm dependency trong audit |
| EXPLAIN ANALYZE production | **BLOCKED** | Tránh tải/ghi DB production |
| Provenance SHA chính xác của deployment Railway | **UNVERIFIED** | Log runtime không in commit; builder hiện **RAILPACK** |
| Load test | **NOT_APPLICABLE** theo policy audit |
| Prisma | **NOT_APPLICABLE** | Dự án dùng Supabase client, không Prisma |

### Quyền / công cụ

- Có: filesystem, shell local, Railway MCP (whoami `namnam1989`), GitHub MCP/`gh`, Supabase advisors
- Không xuất giá trị secret/env

---

## 3. Baseline

| Chỉ số | Giá trị | Cách đo | Môi trường |
|---|---|---|---|
| SHA | `f7ff12c` | `git rev-parse HEAD` | local Windows |
| Branch | `master` = `origin/master` | `git status -sb` | clean (+ untracked audit md) |
| Managed source (`src,docs,supabase,scripts,public`) | **769 948 bytes**, 192 files | PowerShell `Measure-Object` | cold listing |
| `.git` | **~2.0 MB** | Measure-Object | |
| `node_modules` | **~588 MB** | Measure-Object | installed |
| `.next` (dev+build cache) | **~1.28 GB** | Measure-Object | local artifact — không phải payload browser |
| Standalone output | **~31.3 MB**, 1498 files | sau `npm run build` | local production build |
| `.next/static` | **~2.59 MB** | sau build | |
| Top static JS chunk | **312.7 KB** raw (`1etwcuitmwgwn.js`) | file size, **chưa gzip** | |
| `typecheck` | exit **0**, ~8.3 s | `npm run typecheck` | Node local |
| `lint` | exit **1**, 7 errors, ~38 s | `npm run lint` | |
| `test` | exit **0**, **31/31** pass, ~0.4 s | `npm test` (vitest) | |
| `build` | exit **0**, ~40.7 s | `npm run build` (Turbopack) | dùng `.env.local` (không đọc giá trị) |
| Health production | HTTP **200**, `{"status":"ok","app":"NAM NAM DATA",...}` | Invoke-WebRequest | 2026-09-05T11:25:44Z |
| Railway CPU 1h | current/avg **0** (61 samples) | `get-service-metrics` | production |
| Railway RAM 1h | current **0.0938 GB**, avg **0.0923** |同上 | |
| npm audit (prod omit dev) | **1 high** (`xlsx`), **1 moderate** (`qs`) | `npm audit --omit=dev` | |

**Giới hạn đo:** chưa đo Brotli/gzip network; chưa tách cold/warm LCP; `.next` local lẫn cache turbopack/dev.

---

## 4. Kiến trúc (ngắn)

```text
Browser (Next App Router UI)
  → middleware session (Supabase SSR cookies)
  → Server Actions / client Supabase JS
  → Postgres + RLS (private.can_write / roles)
  → Audit logs (soft-fail write)

Deploy: GitHub repo → Railway service `data_supabase`
Data plane: Supabase cloud (không host DB trên Railway)
```

**Luồng quan trọng:** login → dashboard counts → CRUD customers/parties/… → import/export → users (ADMIN) → hard delete (mã mới trên `master`).

---

## 5. Phát hiện

### F-01 / Production lệch code `master`
- **Loại:** Operations | CI/CD  
- **Mức:** HIGH · **Ưu tiên:** P0 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** Railway live deploy `c665260f…` created `2026-09-02T12:22:24Z`; GitHub `pushed_at` `2026-09-05T06:36:38Z`; commits sau 2026-09-02 gồm `f06f28d`…`f7ff12c`. Health OK nhưng không chứng minh feature mới.  
- **Nguyên nhân:** không có deploy mới sau push gần đây (auto-deploy tắt / branch mismatch / builder không theo dõi `master` — cần xác minh dashboard).  
- **Ảnh hưởng:** user production thiếu hard-delete, font fix, RLS/auth hardening đã merge.  
- **Đề xuất:** xác nhận source branch + bật deploy từ `master` hoặc redeploy thủ công; đối chiếu SHA sau deploy.  
- **Nỗ lực:** S · **Rollback:** redeploy deployment cũ trên Railway.

### F-02 / CI không chạy trên `master`
- **Loại:** CI/CD  
- **Mức:** HIGH · **Ưu tiên:** P0 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** `.github/workflows/ci.yml` lines 4–7 chỉ `main`, `develop`; default branch GitHub = **`master`** (`gh api`); `gh run list` không trả run gần đây.  
- **Ảnh hưởng:** không có gate tự động trước khi deploy; README còn ghi “CI passing on main”.  
- **Đề xuất:** thêm `master` vào `on.push`/`pull_request` (hoặc đổi default branch thống nhất).  
- **Kiểm thử:** push/workflow_dispatch → Actions xanh.

### F-03 / ESLint fail — chặn `npm run ci`
- **Loại:** Quality  
- **Mức:** MEDIUM · **Ưu tiên:** P1 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** `npm run lint` exit 1 — `import/actions.ts` (2), `commodities-page-client.tsx` (5) `@typescript-eslint/no-explicit-any`.  
- **Đề xuất:** thay `any` bằng union Zod/`Tables` types.  
- **Tiêu chí:** `npm run lint` exit 0.

### F-04 / `xlsx` HIGH Prototype Pollution
- **Loại:** Security  
- **Mức:** HIGH · **Ưu tiên:** P1 · **Độ xác nhận:** CONFIRMED (advisory); đường dùng CONFIRMED tại `src/lib/import/parse-spreadsheet.ts:1`  
- **Ảnh hưởng:** rủi ro nếu attacker upload workbook độc hại tới user có quyền import (OPERATOR+).  
- **Đề xuất:** nâng/thay parser (SheetJS pro / ExcelJS / CSV-only) sau đánh giá tương thích; harden kích thước file & sheet.  
- **Rủi ro sửa:** regression import.

### F-05 / List không giới hạn trang
- **Loại:** Performance | Database  
- **Mức:** MEDIUM · **Ưu tiên:** P2 · **Độ xác nhận:** CONFIRMED (code); tác động runtime **SUSPECTED** (chưa đo với dataset lớn)  
- **Bằng chứng:** `getCustomers` `src/lib/master-data/customers.ts:19–40` không `.limit()`; hooks client fetch toàn bộ; pattern tương tự commodities/parties/drivers/vehicles.  
- **Đề xuất:** cursor/limit + UI phân trang khi N lớn; index search đã có thì giữ.  
- **Xác minh:** đo latency list với 1k/10k rows trên staging.

### F-06 / Drift builder Railway vs repo
- **Loại:** Operations  
- **Mức:** MEDIUM · **Ưu tiên:** P1 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** `railway.toml` khai báo `builder = "DOCKERFILE"`; `get-service-config` trả `"builder": "RAILPACK"`. Dockerfile local `node:20-alpine` + standalone.  
- **Ảnh hưởng:** hành vi build production có thể khác local Docker; khó tái hiện.  
- **Đề xuất:** thống nhất một builder; ghi rõ trong docs.

### F-07 / Runtime Supabase errors trên production
- **Loại:** Functionality | Operations  
- **Mức:** MEDIUM · **Ưu tiên:** P1 · **Độ xác nhận:** CONFIRMED (log)  
- **Bằng chứng:** deploy logs — `23505 destinations_iata_code_key`, `commodities_code_key`; `[supabase] { code: undefined, message: '' }`; cảnh báo Node 20 deprecated cho `@supabase/supabase-js`.  
- **Ảnh hưởng:** tạo trùng IATA/code fail (UX có thể đã toast); lỗi rỗng khó debug.  
- **Đề xuất:** map lỗi unique thân thiện; nâng Node 22 khi Railway/image cho phép; log `error.message` đầy đủ phía server.

### F-08 / Repo GitHub **public**
- **Loại:** Security | Operations  
- **Mức:** MEDIUM · **Ưu tiên:** P2 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** `visibility: public`. `.env*` gitignore OK; không thấy `.env` tracked.  
- **Ảnh hưởng:** lộ kiến trúc/RLS/docs; không tự lộ secret nếu kỷ luật env tốt.  
- **Đề xuất:** cân nhắc private nếu MDM nội bộ; quét secret định kỳ.

### F-09 / Supabase Auth advisors
- **Loại:** Security  
- **Mức:** LOW–MEDIUM · **Ưu tiên:** P2 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** advisor — leaked password protection **disabled**; function `set_customer_esid_profiles_updated_at` search_path mutable.  
- **Đề xuất:** bật HIBP trên Auth; set `search_path` cố định trên function.

### F-10 / Next middleware deprecation
- **Loại:** Quality  
- **Mức:** LOW · **Ưu tiên:** P3 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** build warning migrate middleware → proxy (Next 16.3.3).  
- **Đề xuất:** theo dõi docs phiên bản; migrate khi ổn định.

### F-11 / `customer-detail-client.tsx` rất lớn
- **Loại:** Quality  
- **Mức:** LOW · **Ưu tiên:** P3 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** ~71.7 KB source — nhiều tab quan hệ trong một client component.  
- **Đề xuất:** tách tab components khi sửa chức năng (không rewrite vì “thích”).

### F-12 / Health endpoint public
- **Loại:** Security  
- **Mức:** LOW · **Ưu tiên:** P3 · **Độ xác nhận:** CONFIRMED  
- **Bằng chứng:** middleware cho `/api/health` public; response chỉ status/app/timestamp — phù hợp healthcheck Railway.  
- **Ghi chú:** giữ nguyên trừ khi cần ẩn metadata.

---

## 6. Ma trận chức năng & kết quả lệnh

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| Typecheck | **PASS** | exit 0 |
| Lint | **FAIL** | 7× no-explicit-any |
| Unit tests | **PASS** | 31 tests / 7 files |
| Production build | **PASS** | exit 0 ~41s |
| Health production | **PASS** | HTTP 200 |
| Login / CRUD UI | **BLOCKED** | không dùng credential |
| Import Excel độc hại | **NOT RUN** | tránh tác dụng phụ |
| Hard delete bulk | **NOT RUN** trên prod | mã có trên `f7ff12c`; prod có thể chưa deploy |
| Thao tác liên tiếp (A→B stale state) | **UNVERIFIED** | cần E2E |
| `npm run ci` end-to-end | **FAIL dự kiến** | lint đỏ |

---

## 7. Đối chiếu GitHub / Railway

| Trạng thái | Giá trị |
|---|---|
| Local audit SHA | `f7ff12c` |
| Remote `origin/master` | cùng SHA (synced lúc audit) |
| Default branch GitHub | `master` |
| CI trigger | `main`/`develop` — **không khớp** |
| Railway project | `data_supabase` (`f548623f-…`) |
| Environment | `production` |
| Service | `data_supabase` — status **SUCCESS** |
| Domain | `https://datasupabase-production.up.railway.app` |
| Env vars (tên) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (+ RAILWAY_*) — **đủ theo README** |
| Builder thực tế | **RAILPACK** |
| Builder trong repo | **DOCKERFILE** (`railway.toml` + `Dockerfile`) |
| Region/replicas | `us-west2` × 1 |
| Healthcheck config (repo) | `/api/health`, timeout 30 (`railway.toml`) |
| Deploy SHA | **UNVERIFIED** |
| Auto-deploy từ `master` | **UNVERIFIED** (suy ra có thể tắt/lệch vì không có deploy sau 2026-09-02) |

---

## 8. Lộ trình sửa đề xuất

| Ưu tiên | Việc |
|---|---|
| **P0** | Đồng bộ deploy production với `f7ff12c` (hoặc SHA mong muốn); sửa CI trigger cho `master` |
| **P1** | Fix lint `any`; xử lý/triển khai giảm rủi ro `xlsx`; thống nhất builder Railway; cải thiện UX lỗi unique + log Supabase rỗng |
| **P2** | Pagination list; Auth HIBP; cân nhắc repo private; function search_path |
| **P3** | Middleware→proxy; tách `customer-detail`; Node 22 khi sẵn sàng |

**Không xếp P0** cho pagination/`xlsx` vì chưa có bằng chứng exploit/outage hiện tại — nhưng `xlsx` vẫn P1 bảo mật.

---

## 9. Kế hoạch xác minh (khi FIX_AND_VERIFY)

1. Sau sửa CI: Actions run trên push `master` = xanh (`lint`+`typecheck`+`test`+`build`).
2. Sau redeploy: health 200; `/login` smoke; tạo customer test; hard-delete 1 bản ghi test trên staging trước prod.
3. Đo lại: list latency với N mẫu cố định; `npm audit` sau thay `xlsx`.
4. Rollback: Railway redeploy deployment `c665260f…` (hoặc bản trước đó); DB migration/hard-delete **không** tự rollback theo app.

---

## 10. Giới hạn & bước tiếp theo

- Chưa E2E có đăng nhập; chưa Lighthouse; chưa xác minh SHA artifact Railway.
- File `AUDIT-GITHUB-RAILWAY.md` ở root là bản copy hướng dẫn — **chưa** commit (đúng AUDIT_ONLY).
- **Khuyến nghị:** giữ kiến trúc hiện tại; ưu tiên **đồng bộ deploy + CI branch** trước tối ưu hiệu năng lớn.
- Lượt sau nếu muốn sửa: nói rõ `FIX_AND_VERIFY` + quyền commit/push/deploy.

---

## Phụ lục — lệnh đã chạy (tóm tắt)

```text
git rev-parse HEAD / status / log
npm run typecheck   → 0 (~8313 ms)
npm run lint        → 1 (7 errors, ~38305 ms)
npm test            → 0 (31 passed, ~2064 ms wall)
npm run build       → 0 (~40746 ms)
npm audit --omit=dev
Invoke-WebRequest .../api/health → 200
Railway: whoami, list-projects/services, get-status, get-service-config,
         list-variables (names), list-deployments, get-service-metrics, get-logs
GitHub: get_me, list_branches, gh api default_branch, workflows
Supabase: get_advisors(security)
```
