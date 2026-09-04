-- ESID-aligned master data: party fax + AGENT/NOTIFY roles + customer_esid_profiles
-- Applied remotely: 2026-09-04 via Supabase MCP

ALTER TABLE public.parties ADD COLUMN IF NOT EXISTS fax text;

ALTER TYPE public.party_role ADD VALUE IF NOT EXISTS 'AGENT';
ALTER TYPE public.party_role ADD VALUE IF NOT EXISTS 'NOTIFY';

CREATE TABLE IF NOT EXISTS public.customer_esid_profiles (
  customer_id uuid PRIMARY KEY REFERENCES public.customers(id) ON DELETE CASCADE,
  default_agent_party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  default_notify_party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  default_origin_id uuid REFERENCES public.destinations(id) ON DELETE SET NULL,
  default_payment_term text NOT NULL DEFAULT 'Chuyển khoản/Transfer',
  declarant_name text,
  declarant_phone text,
  declarant_id_number text,
  default_is_consol boolean NOT NULL DEFAULT false,
  default_other_handling boolean NOT NULL DEFAULT true,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS customer_esid_profiles_agent_idx
  ON public.customer_esid_profiles(default_agent_party_id);
CREATE INDEX IF NOT EXISTS customer_esid_profiles_origin_idx
  ON public.customer_esid_profiles(default_origin_id);

ALTER TABLE public.customer_esid_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY authenticated_read_customer_esid_profiles
    ON public.customer_esid_profiles FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY authenticated_write_customer_esid_profiles
    ON public.customer_esid_profiles FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY authenticated_update_customer_esid_profiles
    ON public.customer_esid_profiles FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_read_customer_esid_profiles
    ON public.customer_esid_profiles FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

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

GRANT SELECT ON public.customer_contacts TO anon, authenticated;
GRANT SELECT ON public.customer_esid_profiles TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_customer_esid_profiles_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_esid_profiles_updated_at ON public.customer_esid_profiles;
CREATE TRIGGER trg_customer_esid_profiles_updated_at
BEFORE UPDATE ON public.customer_esid_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_customer_esid_profiles_updated_at();
