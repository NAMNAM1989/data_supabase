-- Repair UTF-8 mojibake in customer text fields.
-- Cause: UTF-8 bytes were interpreted as LATIN1/Windows-1252 then stored again as UTF-8
-- (e.g. "CÔNG" → "CÃNG"). UI fonts are fine; only stored data was wrong.
-- Fix: convert_to(LATIN1) → convert_from(UTF8). Safe no-op when markers absent / invalid.

CREATE OR REPLACE FUNCTION private.fix_utf8_mojibake(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF input IS NULL OR input = '' THEN
    RETURN input;
  END IF;

  -- Classic Vietnamese UTF-8→LATIN1 mojibake markers
  IF input !~ '(Ã|Ä|Æ|Â|á»|áº)' THEN
    RETURN input;
  END IF;

  BEGIN
    RETURN convert_from(convert_to(input, 'LATIN1'), 'UTF8');
  EXCEPTION
    WHEN others THEN
      RETURN input;
  END;
END;
$$;

REVOKE ALL ON FUNCTION private.fix_utf8_mojibake(text) FROM PUBLIC;

UPDATE public.customers
SET
  name = private.fix_utf8_mojibake(name),
  short_name = private.fix_utf8_mojibake(short_name),
  address = private.fix_utf8_mojibake(address),
  notes = private.fix_utf8_mojibake(notes),
  updated_at = now()
WHERE name ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(short_name, '') ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(address, '') ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(notes, '') ~ '(Ã|Ä|Æ|Â|á»|áº)';

-- Defensive sweep on other master text columns (no-op if clean)
UPDATE public.parties
SET
  name = private.fix_utf8_mojibake(name),
  address = private.fix_utf8_mojibake(address),
  notes = private.fix_utf8_mojibake(notes),
  updated_at = now()
WHERE name ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(address, '') ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(notes, '') ~ '(Ã|Ä|Æ|Â|á»|áº)';

UPDATE public.drivers
SET
  full_name = private.fix_utf8_mojibake(full_name),
  notes = private.fix_utf8_mojibake(notes),
  updated_at = now()
WHERE full_name ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(notes, '') ~ '(Ã|Ä|Æ|Â|á»|áº)';

UPDATE public.commodities
SET
  name = private.fix_utf8_mojibake(name),
  english_name = private.fix_utf8_mojibake(english_name),
  notes = private.fix_utf8_mojibake(notes),
  updated_at = now()
WHERE name ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(english_name, '') ~ '(Ã|Ä|Æ|Â|á»|áº)'
   OR coalesce(notes, '') ~ '(Ã|Ä|Æ|Â|á»|áº)';
