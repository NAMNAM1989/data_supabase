# Đề xuất nút Sửa / sửa dữ liệu nhập sai

**Ngày:** 2026-09-01 · **Trạng thái:** Đã triển khai hết

## Tóm tắt

| Entity | Sửa | Archive | List Pencil |
|---|---|---|---|
| Commodities | Dialog trên list | — | ✏ (dialog) |
| Destinations | Dialog trên list | List ✕/↩ | ✏ (dialog) |
| Parties | Detail form | Detail Archive/Restore | ✏ → detail |
| Customers | Detail form | Detail Archive/Restore | ✏ → detail |
| Drivers | Detail form | Detail Archive/Restore | ✏ → detail |
| Vehicles | Detail form | Detail Archive/Restore | ✏ → detail |
| Users | Dialog display_name + role/status | Status select | ✏ (display_name) |

---

## Đã làm trong đợt này

1. **Commodities** — Pencil + dialog sửa (name/code/english/category)
2. **Parties Archive/Restore** — `archiveParty`/`restoreParty` + actions + nút trên detail (ADMIN)
3. **Users display_name** — Pencil → dialog sửa tên hiển thị
4. **List Pencil** — Customers / Drivers / Vehicles / Parties → trang detail

---

## Checklist vận hành khi nhập sai

| Loại sai | Cách xử lý |
|---|---|
| Sai Customer / Driver / Vehicle / Party | List ✏ hoặc click tên → detail → Lưu |
| Sai Destination / Commodity | List ✏ → dialog → Lưu |
| Record không dùng | Archive (ADMIN); Parties đã có |
| Sai display name user | Users → ✏ → Lưu |
| Sai role/status user | Users → Select inline |
