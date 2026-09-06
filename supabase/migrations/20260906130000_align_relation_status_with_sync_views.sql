-- Align ACTIVE relation rows with TECS sync views (customer_contacts / v_tecs_*).
-- Archive orphan ACTIVE links whose party/commodity/customer is ARCHIVED.
-- Ensure default shipper/consignee when missing.

UPDATE public.customer_parties cp
SET status = 'ARCHIVED', updated_at = now()
FROM public.parties p, public.customers c
WHERE cp.party_id = p.id
  AND cp.customer_id = c.id
  AND cp.status = 'ACTIVE'
  AND (p.status = 'ARCHIVED' OR c.status = 'ARCHIVED');

UPDATE public.customer_commodities cc
SET status = 'ARCHIVED', updated_at = now()
FROM public.commodities cm, public.customers c
WHERE cc.commodity_id = cm.id
  AND cc.customer_id = c.id
  AND cc.status = 'ACTIVE'
  AND (cm.status = 'ARCHIVED' OR c.status = 'ARCHIVED');

UPDATE public.customer_parties cp
SET is_default = true, updated_at = now()
FROM (
  SELECT DISTINCT ON (customer_id, role) id
  FROM public.customer_parties
  WHERE status = 'ACTIVE'
    AND role IN ('SHIPPER', 'CONSIGNEE')
  ORDER BY customer_id, role, created_at ASC
) firsts
WHERE cp.id = firsts.id
  AND NOT EXISTS (
    SELECT 1 FROM public.customer_parties x
    WHERE x.customer_id = cp.customer_id
      AND x.role = cp.role
      AND x.status = 'ACTIVE'
      AND x.is_default = true
  );
