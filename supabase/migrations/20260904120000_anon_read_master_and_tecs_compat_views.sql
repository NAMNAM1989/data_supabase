-- Allow linked apps (TECS extension) using anon key to READ active master data.
-- Writes remain authenticated-only.

CREATE OR REPLACE VIEW public.customer_contacts
WITH (security_invoker = true) AS
SELECT
  cp.id,
  c.code AS customer_code,
  cp.role AS point_type,
  p.name,
  p.address,
  p.phone,
  p.email,
  p.tax_code,
  d.iata_code AS destination,
  cp.is_default,
  cp.status,
  cp.created_at,
  cp.updated_at
FROM public.customer_parties cp
JOIN public.customers c ON c.id = cp.customer_id
JOIN public.parties p ON p.id = cp.party_id
LEFT JOIN public.destinations d ON d.id = cp.destination_id
WHERE cp.status = 'ACTIVE'
  AND c.status = 'ACTIVE'
  AND p.status = 'ACTIVE';

CREATE OR REPLACE VIEW public.v_tecs_customer_commodities
WITH (security_invoker = true) AS
SELECT
  cc.id,
  c.code AS customer_code,
  COALESCE(NULLIF(cc.custom_description, ''), com.name, com.english_name) AS nature_of_goods,
  com.code AS commodity_code,
  com.name AS commodity_name,
  cc.is_default,
  cc.status,
  cc.created_at,
  cc.updated_at
FROM public.customer_commodities cc
JOIN public.customers c ON c.id = cc.customer_id
JOIN public.commodities com ON com.id = cc.commodity_id
WHERE cc.status = 'ACTIVE'
  AND c.status = 'ACTIVE'
  AND com.status = 'ACTIVE';

CREATE OR REPLACE VIEW public.v_tecs_customer_vehicles
WITH (security_invoker = true) AS
SELECT
  cv.id,
  c.code AS customer_code,
  COALESCE(v.plate_display, v.plate_number) AS vehicle_number,
  v.plate_number,
  v.vehicle_type,
  COALESCE(d.full_name, '') AS driver_name,
  COALESCE(d.document_number, d.license_number, '') AS driver_id,
  COALESCE(d.document_type, 'CCCD') AS driver_id_type,
  cv.is_default,
  cv.status,
  cv.created_at,
  cv.updated_at
FROM public.customer_vehicles cv
JOIN public.customers c ON c.id = cv.customer_id
JOIN public.vehicles v ON v.id = cv.vehicle_id
LEFT JOIN LATERAL (
  SELECT dr.full_name, dr.document_number, dr.license_number, dr.document_type
  FROM public.customer_drivers cd
  JOIN public.drivers dr ON dr.id = cd.driver_id
  WHERE cd.customer_id = cv.customer_id
    AND cd.status = 'ACTIVE'
    AND dr.status = 'ACTIVE'
  ORDER BY cd.is_default DESC, cd.updated_at DESC
  LIMIT 1
) d ON true
WHERE cv.status = 'ACTIVE'
  AND c.status = 'ACTIVE'
  AND v.status = 'ACTIVE';

GRANT SELECT ON public.customer_contacts TO anon, authenticated;
GRANT SELECT ON public.v_tecs_customer_commodities TO anon, authenticated;
GRANT SELECT ON public.v_tecs_customer_vehicles TO anon, authenticated;

DO $$ BEGIN
  CREATE POLICY anon_read_active_customers ON public.customers FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_parties ON public.parties FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_customer_parties ON public.customer_parties FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_commodities ON public.commodities FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_customer_commodities ON public.customer_commodities FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_vehicles ON public.vehicles FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_customer_vehicles ON public.customer_vehicles FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_drivers ON public.drivers FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_customer_drivers ON public.customer_drivers FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_destinations ON public.destinations FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_active_driver_vehicles ON public.driver_vehicles FOR SELECT TO anon USING (status = 'ACTIVE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
