# FUNCTION_INVENTORY — NAM NAM DATA QA Audit

**App:** NAM NAM DATA (Next.js 16 + Supabase)  
**Target:** http://localhost:3000 (DEV_SKIP_AUTH)  
**Date:** 2026-09-01

| ID | Module | Function | Trigger | Expected Result |
|---|---|---|---|---|
| F001 | Auth | Login | `/login` form submit | Session + redirect dashboard |
| F002 | Auth | Logout | Header → Đăng xuất | Clear session → `/login` |
| F003 | Auth | Root redirect | `/` | → `/dashboard` |
| F004 | Auth | DEV skip auth | middleware | Auto login / mock ADMIN |
| F010 | Dashboard | View stats | page load | Counts for entities |
| F011 | Dashboard | Inactive records | page load | Inactive count |
| F012 | Dashboard | Recent audit | page load | Recent changes table |
| F013 | Dashboard | Link audit logs | «Xem tất cả» | Navigate `/audit-logs` |
| F020 | Customers | List | `/customers` | Table of customers |
| F021 | Customers | Search | search input | Filter by code/name |
| F022 | Customers | Filter type | type select | Filter by customer_type |
| F023 | Customers | Filter status | status select | Filter by status |
| F024 | Customers | Create | Add Customer dialog | New customer created |
| F025 | Customers | Open detail | row link | `/customers/[id]` |
| F030 | Customer Detail | Overview update | Lưu thay đổi | Fields updated |
| F031 | Customer Detail | Archive/Restore | button | Status toggled |
| F032 | Customer Detail | Link shipper | Shippers tab | Relation created |
| F033 | Customer Detail | Unlink shipper | ✕ | Relation removed |
| F034 | Customer Detail | Default shipper | ★ | is_default set |
| F035 | Customer Detail | Link consignee | Consignees tab | Relation created |
| F036 | Customer Detail | Unlink/default consignee | row actions | Updated |
| F037 | Customer Detail | Link commodity | Commodities tab | Relation created |
| F038 | Customer Detail | Unlink commodity | ✕ | Removed |
| F039 | Customer Detail | Link preferred driver | Drivers tab | Preference linked |
| F040 | Customer Detail | Unlink/default driver | row actions | Updated |
| F041 | Customer Detail | Link preferred vehicle | Vehicles tab | Preference linked |
| F042 | Customer Detail | Unlink/default vehicle | row actions | Updated |
| F050 | Parties | List + search | `/parties` | List/filter |
| F051 | Parties | Create | dialog | Party created |
| F052 | Parties | Open detail | row | `/parties/[id]` |
| F053 | Parties | Update | form save | Updated |
| F054 | Parties | View linked customers | detail table | Read-only links |
| F060 | Commodities | List + search | `/commodities` | List/filter |
| F061 | Commodities | Create | dialog | Commodity created |
| F070 | Destinations | List + search | `/destinations` | List/filter |
| F071 | Destinations | Create | dialog | Destination created |
| F072 | Destinations | Edit | edit dialog | Updated |
| F073 | Destinations | Archive/Restore | row actions | Status toggled |
| F080 | Drivers | List + search | `/drivers` | List/filter |
| F081 | Drivers | Create | dialog | Driver created |
| F082 | Drivers | Update | detail form | Updated |
| F083 | Drivers | Archive/Restore | button | Status toggled |
| F084 | Drivers | Assign vehicle | dialog | Relation |
| F085 | Drivers | Unassign vehicle | ✕ | Unlinked |
| F086 | Drivers | Set preferred vehicle | ★ | Preferred |
| F087 | Drivers | Preferred-by customers | table | Read-only |
| F090 | Vehicles | List + search | `/vehicles` | List/filter |
| F091 | Vehicles | Create | dialog | Created |
| F092 | Vehicles | Update | detail form | Updated |
| F093 | Vehicles | Archive/Restore | button | Status toggled |
| F094 | Vehicles | Assign driver | dialog | Relation |
| F095 | Vehicles | Unassign/preferred | row | Updated |
| F096 | Vehicles | Preferred-by customers | table | Read-only |
| F100 | Driver↔Vehicle | List | `/driver-vehicles` | Relations list |
| F101 | Driver↔Vehicle | Assign | New Assignment | Relation created |
| F102 | Driver↔Vehicle | Set preferred | row | Preferred |
| F103 | Driver↔Vehicle | Unassign | row | Removed |
| F110 | Import | Upload + preview | file + entity | Preview rows |
| F111 | Import | Row action select | create/skip/update | Action configured |
| F112 | Import | Commit | Import N dòng | Rows committed + audit |
| F120 | Export | Customers CSV | button | Download CSV |
| F121 | Export | Drivers CSV | button | Download CSV |
| F122 | Export | Vehicles CSV | button | Download CSV |
| F130 | Duplicates | Scan | Quét duplicates | Groups listed |
| F131 | Duplicates | Open record | link | Navigate detail |
| F140 | Audit | List | `/audit-logs` | Logs table |
| F141 | Audit | Search | input | Filtered |
| F142 | Audit | Filter action | select | Filtered |
| F143 | Audit | Filter table | input | Filtered |
| F150 | Users | List | `/users` | Users table |
| F151 | Users | Create | Add User | User+profile |
| F152 | Users | Change role | select | Role updated |
| F153 | Users | Change status | select | Status updated |
| F160 | Settings | Update display name | form | Profile updated |
| F161 | Settings | View app info | cards | Read-only |
| F170 | Search | Open dialog | ⌘K / click | Dialog open |
| F171 | Search | Query ≥2 chars | type | Results grouped |
| F172 | Search | Navigate result | select | Go to entity |

**Total inventory:** 72 functions
