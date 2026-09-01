import { mapSupabaseError, type Supabase } from "@/lib/errors";

export type SearchEntity =
  | "customer"
  | "party"
  | "driver"
  | "vehicle"
  | "commodity"
  | "destination";

export type SearchResultItem = {
  id: string;
  entity: SearchEntity;
  title: string;
  subtitle: string | null;
  href: string;
};

export type GlobalSearchResults = {
  query: string;
  results: SearchResultItem[];
  grouped: Record<SearchEntity, SearchResultItem[]>;
};

const ENTITY_LIMIT = 5;

function groupResults(items: SearchResultItem[]): Record<SearchEntity, SearchResultItem[]> {
  return {
    customer: items.filter((i) => i.entity === "customer"),
    party: items.filter((i) => i.entity === "party"),
    driver: items.filter((i) => i.entity === "driver"),
    vehicle: items.filter((i) => i.entity === "vehicle"),
    commodity: items.filter((i) => i.entity === "commodity"),
    destination: items.filter((i) => i.entity === "destination"),
  };
}

export async function globalSearch(
  supabase: Supabase,
  query: string,
): Promise<GlobalSearchResults> {
  const term = query.trim();
  if (term.length < 2) {
    return { query: term, results: [], grouped: groupResults([]) };
  }

  const pattern = `%${term}%`;

  const [customers, parties, drivers, vehicles, commodities, destinations] = await Promise.all([
    supabase
      .from("customers")
      .select("id, code, name")
      .or(`code.ilike.${pattern},name.ilike.${pattern},short_name.ilike.${pattern}`)
      .neq("status", "ARCHIVED")
      .limit(ENTITY_LIMIT),
    supabase
      .from("parties")
      .select("id, code, name, tax_code")
      .or(`name.ilike.${pattern},code.ilike.${pattern},tax_code.ilike.${pattern}`)
      .neq("status", "ARCHIVED")
      .limit(ENTITY_LIMIT),
    supabase
      .from("drivers")
      .select("id, code, full_name, phone")
      .or(`full_name.ilike.${pattern},code.ilike.${pattern},phone.ilike.${pattern},document_number.ilike.${pattern}`)
      .neq("status", "ARCHIVED")
      .limit(ENTITY_LIMIT),
    supabase
      .from("vehicles")
      .select("id, plate_number, plate_display")
      .or(`plate_number.ilike.${pattern},plate_display.ilike.${pattern}`)
      .neq("status", "ARCHIVED")
      .limit(ENTITY_LIMIT),
    supabase
      .from("commodities")
      .select("id, code, name")
      .or(`name.ilike.${pattern},code.ilike.${pattern}`)
      .neq("status", "ARCHIVED")
      .limit(ENTITY_LIMIT),
    supabase
      .from("destinations")
      .select("id, iata_code, city_name, country_name")
      .or(`iata_code.ilike.${pattern},city_name.ilike.${pattern},country_name.ilike.${pattern}`)
      .neq("status", "ARCHIVED")
      .limit(ENTITY_LIMIT),
  ]);

  for (const result of [customers, parties, drivers, vehicles, commodities, destinations]) {
    if (result.error) throw mapSupabaseError(result.error);
  }

  const results: SearchResultItem[] = [
    ...(customers.data ?? []).map((row) => ({
      id: row.id,
      entity: "customer" as const,
      title: `${row.code} — ${row.name}`,
      subtitle: "Customer",
      href: `/customers/${row.id}`,
    })),
    ...(parties.data ?? []).map((row) => ({
      id: row.id,
      entity: "party" as const,
      title: row.name,
      subtitle: row.code ?? row.tax_code ?? "Party",
      href: `/parties/${row.id}`,
    })),
    ...(drivers.data ?? []).map((row) => ({
      id: row.id,
      entity: "driver" as const,
      title: row.full_name,
      subtitle: row.code ?? row.phone ?? "Driver",
      href: `/drivers/${row.id}`,
    })),
    ...(vehicles.data ?? []).map((row) => ({
      id: row.id,
      entity: "vehicle" as const,
      title: row.plate_display ?? row.plate_number,
      subtitle: row.plate_number,
      href: `/vehicles/${row.id}`,
    })),
    ...(commodities.data ?? []).map((row) => ({
      id: row.id,
      entity: "commodity" as const,
      title: row.code ? `${row.code} — ${row.name}` : row.name,
      subtitle: "Commodity",
      href: "/commodities",
    })),
    ...(destinations.data ?? []).map((row) => ({
      id: row.id,
      entity: "destination" as const,
      title: row.iata_code,
      subtitle: [row.city_name, row.country_name].filter(Boolean).join(", ") || "Destination",
      href: "/destinations",
    })),
  ];

  return { query: term, results, grouped: groupResults(results) };
}
