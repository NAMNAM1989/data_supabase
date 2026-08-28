# NAM NAM DATA — UI/UX Specification

## 1. Design principles

- **Desktop-first**, responsive fallback
- **Fast data entry** — ít click, keyboard friendly
- **Clear, not flashy** — không dashboard màu mè
- **Operational tool** — nhân viên dùng hàng ngày
- Consistent với **Nam Nam brand** — tham khảo TECSOPS tokens, implement bằng shadcn/ui

---

## 2. Visual language (from TECSOPS, adapted)

| Token | Value | Usage |
|---|---|---|
| Background | `#E4EBF3` | Page canvas |
| Surface | `#FFFFFF` | Cards, panels |
| Primary | `#0F766E` | Actions, links |
| Text | `#0B1220` | Headings |
| Text muted | `#5B6B7C` | Labels, secondary |
| Danger | `#B91C1C` | Archive, errors |
| Font | Plus Jakarta Sans | Body |
| Font mono | IBM Plex Mono | Codes, plates |

Implement via Tailwind CSS variables trong `globals.css` + shadcn theme.

---

## 3. App shell

```text
┌──────────────────────────────────────────────────────────┐
│ [Logo] NAM NAM DATA     [Global Search...........] [User]│
├────────────┬─────────────────────────────────────────────┤
│ Sidebar    │  Main Content                               │
│            │                                             │
│ Dashboard  │                                             │
│            │                                             │
│ MASTER DATA│                                             │
│  Customers │                                             │
│  Parties   │                                             │
│  Commodities│                                            │
│            │                                             │
│ TRANSPORT  │                                             │
│  Drivers   │                                             │
│  Vehicles  │                                             │
│  D↔V       │                                             │
│            │                                             │
│ REFERENCE  │                                             │
│  Destinations│                                           │
│            │                                             │
│ DATA TOOLS │                                             │
│  Import    │                                             │
│  Export    │                                             │
│  Duplicates│                                             │
│            │                                             │
│ SYSTEM     │                                             │
│  Audit     │                                             │
│  Users     │                                             │
│  Settings  │                                             │
└────────────┴─────────────────────────────────────────────┘
```

**Sidebar:** collapsible on tablet, drawer on mobile.

**Topbar:** global search (Cmd+K), user menu, role badge.

---

## 4. Page patterns

### 4.1 List page template

```text
[Title]                              [+ Primary Action]
[Search........] [Filter ▼] [Filter ▼] [Status ▼]
┌─────────────────────────────────────────────────────┐
│ Table with sortable columns, row click → detail     │
│ Skeleton rows while loading                         │
│ Empty state with CTA when no data                   │
└─────────────────────────────────────────────────────┘
[Pagination or virtual scroll if >100 rows]
```

### 4.2 Detail page template

```text
[← Back]  ENTITY NAME                    [Actions ▼]
─────────────────────────────────────────
[Tab: Overview] [Tab: Relations] [Tab: History]

Tab content: form (Overview) or relation table (Relations)
```

### 4.3 Quick Entry (modal/sheet)

Floating action hoặc header button "Quick Add":
- Type selector (Consignee / Shipper / …)
- Customer combobox
- Minimal required fields
- [Save] [Save & Add Another]

---

## 5. Key screens

### Dashboard
- Stat cards (6 counts + inactive + duplicates)
- Recent changes table (from audit_logs)
- No complex charts V1

### Customers list
Columns: Code | Customer | Type | Shippers count | CNEE count | Commodities count | Status

### Customer detail tabs
- **Overview:** form fields
- **Shippers:** table from customer_parties (role=SHIPPER), actions: Add existing, Create new, Set default, Disable
- **Consignees:** same + Destination column
- **Commodities:** from customer_commodities
- **History:** audit filtered by customer id

### Parties list + detail
Detail shows "Used by Customers" reverse lookup.

### Drivers / Vehicles
List + detail with relation tab (assign/unassign).

### Global Search
- Cmd+K command palette style
- Grouped results: Customers, Parties, Drivers, Vehicles, Commodities, Destinations
- Keyboard navigation (↑↓ Enter Esc)

---

## 6. Component mapping (shadcn/ui)

| Need | shadcn component |
|---|---|
| Tables | DataTable (TanStack Table + shadcn) |
| Forms | Form + Input + Select + Textarea |
| Dialogs | Dialog, AlertDialog |
| Toasts | Sonner |
| Tabs | Tabs |
| Combobox | Command + Popover |
| Badges | Badge (status colors) |
| Loading | Skeleton |
| Sidebar | Sidebar (shadcn v2) |

---

## 7. UX patterns borrowed from TECSOPS

| Pattern | TECSOPS source | NAM NAM adaptation |
|---|---|---|
| Toast notifications | `src/ui/Toast.tsx` | Sonner + similar messaging |
| Confirm before destructive | `ConfirmDialog.tsx` | AlertDialog |
| Skeleton loading | `Skeleton.tsx` | shadcn Skeleton |
| Status badges | `StatusBadge.tsx` | Badge với record_status colors |
| Search bar | `SmartSearchBar.tsx` | Command palette — rewrite |
| Inline edit | `InlineTextEdit.tsx` | Form mode preferred for master data |
| Filter bar | `StatusFilterBar.tsx` | DataTable filters |

**Không borrow:** shipment table, mobile ops sheets, print modals, warehouse picker.

---

## 8. Status colors

| Status | Color | Badge variant |
|---|---|---|
| ACTIVE | Green (`#059669`) | default/success |
| INACTIVE | Amber (`#D97706`) | warning |
| ARCHIVED | Gray (`#5B6B7C`) | secondary |

---

## 9. Keyboard shortcuts

| Shortcut | Action |
|---|---|
| Cmd/Ctrl + K | Global search |
| Cmd/Ctrl + N | New (context: current page entity) |
| Esc | Close modal/search |
| ↑↓ in search | Navigate results |
| Enter | Open selected result |

---

## 10. Responsive breakpoints

| Breakpoint | Behavior |
|---|---|
| ≥1280px | Full sidebar + wide tables |
| 1024–1279px | Collapsible sidebar |
| 768–1023px | Drawer sidebar, stacked filters |
| <768px | Single column, card list instead of table |

Data entry ưu tiên desktop — mobile chỉ read/browse.

---

## 11. Empty & error states

Every list/detail must have:
- **Loading:** skeleton matching layout
- **Empty:** illustration + "Chưa có dữ liệu" + primary CTA
- **Error:** retry button + friendly message (no raw errors)
- **No permission:** "Bạn không có quyền thực hiện thao tác này"

---

## 12. Accessibility

- Focus visible on all interactive elements
- Form labels associated
- Table headers scope
- Color not sole indicator of status (text label always)
- Target: WCAG 2.1 AA for core flows
