-- Role-based write RLS for master data (replaces USING/WITH CHECK (true) on writes)
-- Keeps authenticated SELECT open; keeps anon SELECT ACTIVE for TECS compat views.
-- Removes anon SELECT on customer_esid_profiles (declarant PII).

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.get_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid()
    AND status = 'ACTIVE'::public.record_status;
$$;

CREATE OR REPLACE FUNCTION private.has_role(allowed public.app_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.get_user_role() = ANY (allowed);
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.get_user_role() = 'ADMIN'::public.app_role;
$$;

CREATE OR REPLACE FUNCTION private.can_write()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT private.get_user_role() IN (
    'ADMIN'::public.app_role,
    'OPERATOR'::public.app_role
  );
$$;

REVOKE ALL ON FUNCTION private.get_user_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.has_role(public.app_role[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.can_write() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(public.app_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_write() TO authenticated;

-- Drop open write policies and recreate with can_write()
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'customers',
    'parties',
    'commodities',
    'destinations',
    'drivers',
    'vehicles',
    'customer_parties',
    'customer_commodities',
    'customer_drivers',
    'customer_vehicles',
    'driver_vehicles',
    'customer_esid_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS authenticated_write_%s ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS authenticated_update_%s ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY authenticated_write_%s ON public.%I FOR INSERT TO authenticated WITH CHECK (private.can_write())',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY authenticated_update_%s ON public.%I FOR UPDATE TO authenticated USING (private.can_write()) WITH CHECK (private.can_write())',
      t, t
    );
  END LOOP;
END $$;

-- Remove anon read of ESID PII (declarant name/phone/id)
DROP POLICY IF EXISTS anon_read_customer_esid_profiles ON public.customer_esid_profiles;
REVOKE SELECT ON public.customer_esid_profiles FROM anon;

-- Admin can read/update all profiles (user management via service role still works)
DO $$ BEGIN
  CREATE POLICY admin_read_profiles ON public.profiles
    FOR SELECT TO authenticated
    USING (private.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY admin_update_profiles ON public.profiles
    FOR UPDATE TO authenticated
    USING (private.is_admin())
    WITH CHECK (private.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
