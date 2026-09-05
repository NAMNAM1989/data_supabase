-- Enable hard DELETE for mistaken master-data entry cleanup.
-- 1) DELETE RLS for writers (ADMIN/OPERATOR via private.can_write)
-- 2) Cascade party/commodity relation rows so hard-delete is not blocked by RESTRICT

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
    EXECUTE format('DROP POLICY IF EXISTS authenticated_delete_%s ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY authenticated_delete_%s ON public.%I FOR DELETE TO authenticated USING (private.can_write())',
      t, t
    );
  END LOOP;
END $$;

-- Party / commodity were RESTRICT — switch to CASCADE so hard-delete cleans links
ALTER TABLE public.customer_parties
  DROP CONSTRAINT IF EXISTS customer_parties_party_id_fkey,
  ADD CONSTRAINT customer_parties_party_id_fkey
    FOREIGN KEY (party_id) REFERENCES public.parties(id) ON DELETE CASCADE;

ALTER TABLE public.customer_commodities
  DROP CONSTRAINT IF EXISTS customer_commodities_commodity_id_fkey,
  ADD CONSTRAINT customer_commodities_commodity_id_fkey
    FOREIGN KEY (commodity_id) REFERENCES public.commodities(id) ON DELETE CASCADE;
