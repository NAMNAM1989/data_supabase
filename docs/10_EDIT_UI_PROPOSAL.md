# Nút Sửa / chỉnh sửa dữ liệu nhập

**Ngày cập nhật:** 2026-09-02 · **Trạng thái:** Đã triển khai

## Tóm tắt

| Entity | Tạo mới | Sửa | Archive | Nút trên list |
|---|---|---|---|---|
| Customers | Dialog list | Form detail `/customers/[id]` | Detail (ADMIN) | **Sửa** → detail |
| Parties | Dialog list | Form detail `/parties/[id]` | Detail (ADMIN) | **Sửa** → detail |
| Drivers | Dialog list | Form detail `/drivers/[id]` | Detail (ADMIN) | **Sửa** → detail |
| Vehicles | Dialog list | Form detail `/vehicles/[id]` | Detail (ADMIN) | **Sửa** → detail |
| Commodities | Dialog list | Dialog inline trên list | — | **Sửa** (dialog) |
| Destinations | Dialog list | Dialog inline trên list | List (ADMIN) | **Sửa** (dialog) |
| Users | Dialog list | Dialog `display_name` + role/status inline | Status select | **Sửa** (dialog) |
| Driver ↔ Vehicle | Dialog assign | Sửa driver/xe qua detail | — | **Sửa** (link driver + xe) |

## Component dùng chung

File: `src/components/shared/edit-row-actions.tsx`

| Component | Mục đích |
|---|---|
| `EditRowLink` | Nút **Sửa** (icon + chữ) → trang detail |
| `EditRowButton` | Nút **Sửa** → mở dialog inline trên list |
| `WriteAccessHint` | Banner khi VIEWER — giải thích không có quyền sửa |
| `DetailEditHint` | Gợi ý trên trang detail: chỉnh form rồi bấm **Lưu** |

## Quyền truy cập

- `canWrite(role)` = DATA_ENTRY hoặc ADMIN → hiện cột **Thao tác** và nút **Sửa**
- VIEWER → chỉ xem; hiện banner vàng trên các trang list
- Archive/Restore → chỉ ADMIN (`canPerform(role, "archive")`)

Nếu không thấy nút Sửa: vào **Settings** kiểm tra role tài khoản.

## Checklist khi nhập sai

| Loại sai | Cách xử lý |
|---|---|
| Sai Customer / Driver / Vehicle / Party | List → **Sửa** hoặc click tên → detail → **Lưu** |
| Sai Destination / Commodity | List → **Sửa** → dialog → **Lưu** |
| Record không dùng nữa | Archive (ADMIN) trên trang detail |
| Sai tên hiển thị user | Users → **Sửa** → **Lưu** |
| Sai role/status user | Users → Select inline |
| Cần sửa tài xế/xe trong assignment | Driver ↔ Vehicle → **Sửa** (mở detail driver hoặc xe) |
