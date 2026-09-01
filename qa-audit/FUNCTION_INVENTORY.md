# FUNCTION_INVENTORY — NAM NAM DATA QA Audit

**App:** NAM NAM DATA (Next.js 16 + Supabase)  
**Targets:** `http://localhost:3000` (DEV_SKIP_AUTH) · `https://datasupabase-production.up.railway.app`  
**Date:** 2026-09-01 (re-audit)

| ID | Module | Function | Trigger | Expected Result |
|---|---|---|---|---|
| F001 | Auth | Login | `/login` form | Session + dashboard |
| F002 | Auth | Logout | Header menu | Clear session → `/login` |
| F003 | Auth | Root redirect | `/` | → `/dashboard` |
| F004 | Auth | DEV skip auth | middleware | Auto ADMIN session |
| F010 | Dashboard | View stats | page load | Entity counts |
| F011 | Dashboard | Inactive records | page load | Inactive count |
| F012 | Dashboard | Recent audit | page load | Recent changes |
| F013 | Dashboard | Link audit logs | «Xem tất cả» | `/audit-logs` |
| F020 | Customers | List | `/customers` | Table |
| F021 | Customers | Search | search input | Filter |
| F022 | Customers | Filter type | select | Filter |
| F023 | Customers | Filter status | select | Filter |
| F024 | Customers | Create | Add dialog | Created |
| F025 | Customers | Open detail | row link | `/customers/[id]` |
| F025b | Customers | List pencil → detail | ✏ | `/customers/[id]` |
| F030–F042 | Customer Detail | Update / Archive / relations | detail tabs | Persist correctly |
| F050 | Parties | List + search | `/parties` | List |
| F051 | Parties | Create | dialog | Created |
| F052 | Parties | Open detail | link | `/parties/[id]` |
| F053 | Parties | Update | Lưu | Updated |
| F054 | Parties | Linked customers | table | Read-only |
| F055 | Parties | Archive | button | ARCHIVED |
| F055b | Parties | Restore | button | ACTIVE |
| F055c | Parties | List pencil | ✏ | detail |
| F060 | Commodities | List + search | `/commodities` | List |
| F061 | Commodities | Create | dialog | Created |
| F062 | Commodities | Edit | pencil dialog | Updated |
| F061-empty | Commodities | Empty name | submit | Blocked |
| F061-rapid | Commodities | Double submit | dblclick | No duplicate |
| F070–F073 | Destinations | List/Create/Edit/Archive | list actions | Persist |
| F080–F087 | Drivers | CRUD + vehicle assign | list/detail | Persist |
| F082b | Drivers | List pencil | ✏ | detail |
| F090–F096 | Vehicles | CRUD + driver assign | list/detail | Persist |
| F092b | Vehicles | List pencil | ✏ | detail |
| F100–F103 | Driver↔Vehicle | Assign/preferred/unassign | page | Persist |
| F110–F112 | Import | Upload/preview/commit | Import | Rows + audit |
| F120–F122 | Export | CSV downloads | buttons | File download |
| F130–F131 | Duplicates | Scan + open | Quét | Groups |
| F140–F143 | Audit | List/filters | `/audit-logs` | Filtered logs |
| F150–F152 | Users | List/create/role/status | `/users` | Updated |
| F153 | Users | Edit display_name | ✏ dialog | Updated |
| F160 | Search | Global search | ⌘K / header | Cross-entity |
| F170 | Settings | Update self display_name | Lưu | Updated |
| F180 | Health | `/api/health` | GET | `{status:ok}` |
