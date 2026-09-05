-- Professional logistics master data expansion for Shippers, Consignees, and Commodities
-- Applied remotely: 2026-09-05 via Supabase MCP

-- 1. Parties (Shippers, Consignees, Agents, Notifies)
ALTER TABLE public.parties
  ADD COLUMN IF NOT EXISTS contact_person text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS branch_name text,
  ADD COLUMN IF NOT EXISTS country_name text,
  ADD COLUMN IF NOT EXISTS handling_instructions text;

-- 2. Customer Parties (Relationships)
ALTER TABLE public.customer_parties
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS notes text;

-- 3. Commodities (Air cargo nature of goods, classification, handling)
ALTER TABLE public.commodities
  ADD COLUMN IF NOT EXISTS cargo_type text NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS special_handling_codes text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS temperature_range text,
  ADD COLUMN IF NOT EXISTS un_number text,
  ADD COLUMN IF NOT EXISTS dg_class text,
  ADD COLUMN IF NOT EXISTS default_packaging text NOT NULL DEFAULT 'CARTON';

-- 4. Customer Commodities (Customer-specific goods description & instructions)
ALTER TABLE public.customer_commodities
  ADD COLUMN IF NOT EXISTS special_instructions text,
  ADD COLUMN IF NOT EXISTS package_type text;

-- 5. Update compatibility views with newly added fields (retaining exact backwards compatibility)
DROP VIEW IF EXISTS public.customer_contacts;
CREATE VIEW public.customer_contacts
WITH (security_invoker = true) AS
SELECT
  cp.id,
  c.code AS customer_code,
  cp.role AS point_type,
  p.name,
  p.address,
  p.phone,
  p.email,
  p.fax,
  p.tax_code,
  p.contact_person,
  p.contact_phone,
  p.branch_name,
  p.country_name,
  p.handling_instructions,
  cp.account_number,
  d.iata_code AS destination,
  cp.is_default,
  cp.status,
  cp.notes AS relation_notes,
  cp.created_at,
  cp.updated_at
FROM public.customer_parties cp
JOIN public.customers c ON c.id = cp.customer_id
JOIN public.parties p ON p.id = cp.party_id
LEFT JOIN public.destinations d ON d.id = cp.destination_id
WHERE cp.status = 'ACTIVE'
  AND c.status = 'ACTIVE'
  AND p.status = 'ACTIVE';

DROP VIEW IF EXISTS public.v_tecs_customer_commodities;
CREATE VIEW public.v_tecs_customer_commodities
WITH (security_invoker = true) AS
SELECT
  cc.id,
  c.code AS customer_code,
  COALESCE(NULLIF(cc.custom_description, ''), com.name, com.english_name) AS nature_of_goods,
  com.code AS commodity_code,
  com.name AS commodity_name,
  com.cargo_type,
  com.special_handling_codes,
  com.temperature_range,
  com.hs_code,
  com.is_dg,
  cc.special_instructions,
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

GRANT SELECT ON public.customer_contacts TO anon, authenticated;
GRANT SELECT ON public.v_tecs_customer_commodities TO anon, authenticated;
