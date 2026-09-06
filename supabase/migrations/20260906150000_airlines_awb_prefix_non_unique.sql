-- AWB prefix is a hint, not airline identity.
-- Multiple airlines may share a prefix (e.g. SQ + TR = 618).
DROP INDEX IF EXISTS public.airlines_awb_prefix_uidx;

CREATE INDEX IF NOT EXISTS airlines_awb_prefix_idx
  ON public.airlines (awb_prefix)
  WHERE awb_prefix IS NOT NULL;
