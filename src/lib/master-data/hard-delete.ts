import { mapSupabaseError, type Supabase } from "@/lib/errors";

export type HardDeleteTable =
  | "customers"
  | "parties"
  | "commodities"
  | "destinations"
  | "drivers"
  | "vehicles";

/**
 * Hard-delete rows by id. Relies on DB CASCADE / DELETE RLS.
 * Returns deleted rows (may be fewer if some ids were missing).
 */
export async function hardDeleteByIds(supabase: Supabase, table: HardDeleteTable, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [] as Array<{ id: string } & Record<string, unknown>>;

  const { data, error } = await supabase.from(table).delete().in("id", uniqueIds).select("*");

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as Array<{ id: string } & Record<string, unknown>>;
}
