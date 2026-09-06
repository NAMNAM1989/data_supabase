-- Master airlines (air cargo carriers) — separate from destinations (airports).
-- IATA 2-char code + optional 3-digit AWB prefix. Soft archive via status.
-- Anon SELECT ACTIVE for TECS / ops consumers.

CREATE TABLE IF NOT EXISTS public.airlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iata_code text NOT NULL,
  name text NOT NULL,
  short_name text,
  icao_code text,
  awb_prefix text,
  country_code text,
  is_cargo_only boolean NOT NULL DEFAULT false,
  notes text,
  status public.record_status NOT NULL DEFAULT 'ACTIVE',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT airlines_iata_code_key UNIQUE (iata_code),
  CONSTRAINT airlines_iata_format CHECK (iata_code ~ '^[A-Z0-9]{2}$'),
  CONSTRAINT airlines_awb_prefix_format CHECK (awb_prefix IS NULL OR awb_prefix ~ '^[0-9]{3}$')
);

CREATE UNIQUE INDEX IF NOT EXISTS airlines_awb_prefix_uidx
  ON public.airlines (awb_prefix)
  WHERE awb_prefix IS NOT NULL;

CREATE INDEX IF NOT EXISTS airlines_status_idx ON public.airlines (status);

DROP TRIGGER IF EXISTS trg_airlines_updated_at ON public.airlines;
CREATE TRIGGER trg_airlines_updated_at
  BEFORE UPDATE ON public.airlines
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.airlines ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY authenticated_read_airlines
    ON public.airlines FOR SELECT TO authenticated
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_write_airlines
    ON public.airlines FOR INSERT TO authenticated
    WITH CHECK (private.can_write());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_update_airlines
    ON public.airlines FOR UPDATE TO authenticated
    USING (private.can_write())
    WITH CHECK (private.can_write());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY authenticated_delete_airlines
    ON public.airlines FOR DELETE TO authenticated
    USING (private.can_write());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY anon_read_active_airlines
    ON public.airlines FOR SELECT TO anon
    USING (status = 'ACTIVE'::public.record_status);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON public.airlines TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.airlines TO authenticated;
