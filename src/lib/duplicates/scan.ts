import {
  findExactDuplicateGroups,
  findFuzzyDuplicateGroups,
  type DuplicateGroup,
} from "@/lib/duplicates/detect";
import { mapSupabaseError, type Supabase } from "@/lib/errors";

export async function scanDuplicateGroups(supabase: Supabase): Promise<DuplicateGroup[]> {
  const [customers, parties, drivers, vehicles, commodities, destinations] = await Promise.all([
    supabase.from("customers").select("id, code, name").neq("status", "ARCHIVED"),
    supabase.from("parties").select("id, code, name, tax_code").neq("status", "ARCHIVED"),
    supabase.from("drivers").select("id, code, full_name, document_number").neq("status", "ARCHIVED"),
    supabase.from("vehicles").select("id, plate_number, plate_display").neq("status", "ARCHIVED"),
    supabase.from("commodities").select("id, code, name").neq("status", "ARCHIVED"),
    supabase.from("destinations").select("id, iata_code, city_name").neq("status", "ARCHIVED"),
  ]);

  for (const result of [customers, parties, drivers, vehicles, commodities, destinations]) {
    if (result.error) throw mapSupabaseError(result.error);
  }

  const groups: DuplicateGroup[] = [];

  groups.push(
    ...findExactDuplicateGroups(
      "customer",
      (customers.data ?? []).map((row) => ({
        id: row.id,
        label: `${row.code} — ${row.name}`,
        meta: row.code,
      })),
      (row) => row.meta,
      "customer code",
    ),
    ...findFuzzyDuplicateGroups(
      "party",
      (parties.data ?? []).map((row) => ({
        id: row.id,
        label: row.name,
        meta: row.tax_code ?? row.code ?? undefined,
      })),
    ),
    ...findExactDuplicateGroups(
      "driver",
      (drivers.data ?? [])
        .filter((row) => row.document_number)
        .map((row) => ({
          id: row.id,
          label: row.full_name,
          meta: row.document_number!,
        })),
      (row) => row.meta,
      "document_number",
    ),
    ...findExactDuplicateGroups(
      "driver",
      (drivers.data ?? [])
        .filter((row) => row.code)
        .map((row) => ({
          id: row.id,
          label: row.full_name,
          meta: row.code!,
        })),
      (row) => row.meta,
      "driver code",
    ),
    ...findExactDuplicateGroups(
      "vehicle",
      (vehicles.data ?? []).map((row) => ({
        id: row.id,
        label: row.plate_display ?? row.plate_number,
        meta: row.plate_number,
      })),
      (row) => row.meta,
      "plate_number",
    ),
    ...findExactDuplicateGroups(
      "commodity",
      (commodities.data ?? []).map((row) => ({
        id: row.id,
        label: row.code ? `${row.code} — ${row.name}` : row.name,
        meta: row.code ?? undefined,
      })),
      (row) => row.meta,
      "commodity code",
    ),
    ...findFuzzyDuplicateGroups(
      "commodity",
      (commodities.data ?? []).map((row) => ({
        id: row.id,
        label: row.name,
        meta: row.code ?? undefined,
      })),
    ),
    ...findExactDuplicateGroups(
      "destination",
      (destinations.data ?? []).map((row) => ({
        id: row.id,
        label: row.iata_code,
        meta: row.city_name ?? undefined,
      })),
      (row) => row.label,
      "iata_code",
    ),
  );

  return groups.sort((a, b) => b.records.length - a.records.length);
}
