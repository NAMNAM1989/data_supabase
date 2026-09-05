# NAM NAM DATA — Database Contract

Contract giữa Supabase schema và application layer. Mọi thay đổi schema phải qua migration.

**Project:** `namnam-customers` (`cuakkgauyutapdznqhge`)

---

## 1. Entity overview

```text
customers ──┬── customer_parties ── parties
            │         │
            │         └── destinations (FK on CONSIGNEE)
            ├── customer_commodities ── commodities
            ├── customer_drivers ── drivers      [ADR-005]
            └── customer_vehicles ── vehicles    [ADR-005]

drivers ── driver_vehicles ── vehicles

profiles ── auth.users
audit_logs (standalone)
```

---

## 2. Tables

### 2.1 customers

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | uuid | PK, default gen_random_uuid() | Link key |
| code | text | NOT NULL, UNIQUE | Business code, UPPERCASE |
| name | text | NOT NULL | Display name |
| short_name | text | nullable | |
| customer_type | text | nullable | Enum values: FORWARDER, DIRECT_SHIPPER, AGENT, OTHER |
| tax_code | text | nullable | |
| address | text | nullable | |
| phone | text | nullable | |
| email | text | nullable | |
| status | record_status | NOT NULL, default ACTIVE | ACTIVE/INACTIVE/ARCHIVED |
| notes | text | nullable | |
| metadata | jsonb | NOT NULL, default {} | Extension only — không chứa relations |
| created_at | timestamptz | NOT NULL | |
| updated_at | timestamptz | NOT NULL | auto trigger |

### 2.2 parties

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| code | text | UNIQUE, nullable |
| name | text | NOT NULL |
| tax_code, address, city, state, postal_code, country_code | text | nullable |
| branch_name, contact_person, contact_phone, country_name | text | nullable (Logistics operations) |
| phone, fax, email | text | nullable |
| handling_instructions | text | nullable (Chỉ dẫn kho bãi / xếp dỡ) |
| status | record_status | NOT NULL |
| notes | text | nullable |
| metadata | jsonb | NOT NULL |

**Quy tắc:** Một party entity dùng chung cho nhiều customers. Không duplicate party per customer. `fax` map ESID `#faxShp/#faxAgt/#faxCne`.

### 2.3 customer_parties

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| customer_id | uuid | FK → customers |
| party_id | uuid | FK → parties |
| role | party_role | SHIPPER \| CONSIGNEE \| AGENT \| NOTIFY |
| destination_id | uuid | FK → destinations, nullable (Consignee) |
| account_number | text | nullable (Mã tài khoản khách/đại lý) |
| notes | text | nullable (Ghi chú tuyến/điều phối riêng) |
| is_default | boolean | default false |
| status | record_status | NOT NULL |

**Unique:** `(customer_id, party_id, role)`

### 2.3b customer_esid_profiles (1:1)

| Column | Type | Constraints |
|---|---|---|
| customer_id | uuid | PK FK → customers |
| default_agent_party_id | uuid | FK → parties |
| default_notify_party_id | uuid | FK → parties |
| default_origin_id | uuid | FK → destinations |
| default_payment_term | text | default `Chuyển khoản/Transfer` |
| declarant_name / phone / id_number | text | map `#shpRegNam/Tel/Idx` |
| default_is_consol / other_handling | boolean | ESID SHC defaults |
| notes, metadata | | |

Xem ADR-006.

### 2.4 commodities

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| code | text | UNIQUE, nullable |
| name | text | NOT NULL |
| english_name | text | nullable (Nature of Goods ESID) |
| hs_code | text | nullable |
| category | text | nullable |
| cargo_type | text | NOT NULL, default 'GENERAL' |
| special_handling_codes | text[] | NOT NULL, default '{}' (IATA SHC: PER, COL, ELI...) |
| temperature_range | text | nullable (Bảo quản) |
| un_number, dg_class | text | nullable (Hàng nguy hiểm IATA DGR) |
| default_packaging | text | NOT NULL, default 'CARTON' |
| is_dg, contains_battery, is_liquid | boolean | default false |
| status | record_status | NOT NULL |
| notes, metadata | | |

### 2.5 customer_commodities

| Column | Type | Constraints |
|---|---|---|
| customer_id | uuid | FK |
| commodity_id | uuid | FK |
| custom_description | text | nullable (Tên hàng đặc thù khi khai báo) |
| package_type | text | nullable (Quy cách đóng gói riêng) |
| special_instructions | text | nullable (Chỉ dẫn khai báo / kho riêng) |
| is_default | boolean | |
| usage_count | bigint | default 0 |
| last_used_at | timestamptz | nullable |
| status | record_status | |

**Unique:** `(customer_id, commodity_id)`

### 2.6 destinations

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| iata_code | text | NOT NULL, UNIQUE |
| city_name, country_code, country_name, region, timezone | text | nullable |
| status | record_status | |
| metadata | jsonb | |

### 2.7 drivers

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| code | text | UNIQUE, nullable |
| full_name | text | NOT NULL |
| phone | text | nullable |
| document_type, document_number | text | document_number UNIQUE |
| license_number, license_class | text | nullable |
| license_expiry | date | nullable |
| status | record_status | |
| notes, metadata | | |

### 2.8 vehicles

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| plate_number | text | NOT NULL, UNIQUE — canonical (51C12345) |
| plate_display | text | nullable — formatted (51C-123.45) |
| vehicle_type, brand, model | text | nullable |
| payload_kg | numeric | nullable |
| status | record_status | |
| notes, metadata | | |

### 2.9 driver_vehicles

| Column | Type | Constraints |
|---|---|---|
| driver_id | uuid | FK |
| vehicle_id | uuid | FK |
| is_preferred | boolean | default false |
| valid_from, valid_to | date | nullable, check valid_to >= valid_from |
| status | record_status | |

**Unique:** `(driver_id, vehicle_id)`

### 2.10 customer_drivers / customer_vehicles [ADR-005]

| Column | Type | Constraints |
|---|---|---|
| customer_id | uuid | FK |
| driver_id / vehicle_id | uuid | FK |
| is_default | boolean | |
| status | record_status | |

**Unique:** `(customer_id, driver_id)` / `(customer_id, vehicle_id)`

→ Operational assignment: customer nào thường dùng driver/vehicle nào. **Không thay thế** driver_vehicles N:N.

### 2.11 profiles

| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK, FK → auth.users |
| display_name | text | nullable |
| role | app_role | default VIEWER |
| status | record_status | default ACTIVE |

### 2.12 audit_logs

| Column | Type | Notes |
|---|---|---|
| id | bigint | PK (identity) |
| actor_user_id | uuid | FK auth.users, nullable |
| app_name | text | default 'UNKNOWN' |
| action | text | INSERT, UPDATE, ARCHIVE, IMPORT, MERGE… |
| table_name | text | |
| record_id | uuid | nullable |
| old_data, new_data | jsonb | nullable |
| created_at | timestamptz | |

---

## 3. Enums

```sql
app_role: ADMIN | OPERATOR | VIEWER | INTEGRATION
record_status: ACTIVE | INACTIVE | ARCHIVED
party_role: SHIPPER | CONSIGNEE
customer_type: FORWARDER | DIRECT_SHIPPER | AGENT | OTHER
```

---

## 4. Normalization rules (app layer)

| Field | Rule |
|---|---|
| customer.code | trim → uppercase |
| plate_number | remove non-alphanumeric → uppercase |
| plate_display | preserve user input |
| email | trim → lowercase |
| phone | normalize whitespace only |
| names | preserve Unicode (Vietnamese) |

---

## 5. Soft delete contract

- UI action: **Archive** → `status = ARCHIVED`
- **Restore** → `status = ACTIVE`
- Hard delete: ADMIN only + confirmation + audit

---

## 6. TypeScript types

Generate từ Supabase:

```bash
npx supabase gen types typescript --project-id cuakkgauyutapdznqhge > src/types/database.ts
```

Domain types extend generated types trong `src/types/`.

---

## 7. master-data API surface

| Module | Functions |
|---|---|
| customers.ts | getCustomers, getCustomerById, createCustomer, updateCustomer, archiveCustomer, restoreCustomer |
| parties.ts | getParties, getPartyById, createParty, updateParty, getPartyCustomers |
| relations.ts | getCustomerShippers, getCustomerConsignees, linkParty, unlinkParty, setDefaultParty |
| commodities.ts | getCommodities, getCustomerCommodities, linkCommodity |
| drivers.ts | getDrivers, getDriverById, createDriver, updateDriver, getDriverVehicles, assignVehicle |
| vehicles.ts | getVehicles, getVehicleById, createVehicle, updateVehicle, getVehicleDrivers, assignDriver |
| destinations.ts | getDestinations, createDestination |
| search.ts | globalSearch |
| audit.ts | getAuditLogs, writeAuditLog |

---

## 8. Migration policy

1. Mọi schema change → Supabase migration file
2. Sync migrations vào repo `supabase/migrations/`
3. Không ALTER runtime
4. Test migration trên branch Supabase trước production merge
5. Backward compatible khi có thể

---

## 9. Data migration từ TECSOPS (planned)

| Source (TECSOPS) | Target (Supabase) | Status |
|---|---|---|
| Customer list | customers | ✅ 41 rows |
| savedShippers[] | parties + customer_parties | ❌ Pending |
| savedConsignees[] | parties + customer_parties + destinations | ❌ Pending |
| savedGoods[] | commodities + customer_commodities | ❌ Pending |
| Drivers/Vehicles | drivers, vehicles, driver_vehicles | ✅ Partial |
| Customer-driver/vehicle prefs | customer_drivers, customer_vehicles | ✅ 9+21 rows |

Migration script sẽ là Phase 3 prerequisite hoặc parallel task.
