import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { CommodityInput, CommodityUpdateInput } from "@/lib/validation/commodity";
import type { Tables } from "@/types/database";

export type Commodity = Tables<"commodities">;

export type CommodityFilters = {
  search?: string;
  status?: Commodity["status"];
};

export async function getCommodities(supabase: Supabase, filters?: CommodityFilters) {
  let query = supabase.from("commodities").select("*").order("name", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.neq("status", "ARCHIVED");
  }
  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},code.ilike.${term},english_name.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getCommodityById(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("commodities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createCommodity(supabase: Supabase, input: CommodityInput) {
  const { data, error } = await supabase
    .from("commodities")
    .insert({
      code: input.code || null,
      name: input.name,
      english_name: input.english_name || null,
      hs_code: input.hs_code || null,
      category: input.category || null,
      cargo_type: input.cargo_type,
      special_handling_codes: input.special_handling_codes ?? [],
      temperature_range: input.temperature_range || null,
      un_number: input.un_number || null,
      dg_class: input.dg_class || null,
      default_packaging: input.default_packaging,
      is_dg: input.is_dg,
      contains_battery: input.contains_battery,
      is_liquid: input.is_liquid,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateCommodity(
  supabase: Supabase,
  id: string,
  input: CommodityUpdateInput,
) {
  const { data, error } = await supabase
    .from("commodities")
    .update({
      ...input,
      code: input.code === "" ? null : input.code,
      english_name: input.english_name === "" ? null : input.english_name,
      hs_code: input.hs_code === "" ? null : input.hs_code,
      category: input.category === "" ? null : input.category,
      temperature_range: input.temperature_range === "" ? null : input.temperature_range,
      un_number: input.un_number === "" ? null : input.un_number,
      dg_class: input.dg_class === "" ? null : input.dg_class,
      notes: input.notes === "" ? null : input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function archiveCommodity(supabase: Supabase, id: string) {
  return updateCommodity(supabase, id, { status: "ARCHIVED" });
}

export async function restoreCommodity(supabase: Supabase, id: string) {
  return updateCommodity(supabase, id, { status: "ACTIVE" });
}
