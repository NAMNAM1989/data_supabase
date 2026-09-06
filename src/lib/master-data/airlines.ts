import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { AirlineInput, AirlineUpdateInput } from "@/lib/validation/airline";
import type { Tables } from "@/types/database";

export type Airline = Tables<"airlines">;

export type AirlineFilters = {
  search?: string;
  status?: Airline["status"];
};

export async function getAirlines(supabase: Supabase, filters?: AirlineFilters) {
  let query = supabase.from("airlines").select("*").order("iata_code", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.neq("status", "ARCHIVED");
  }

  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `iata_code.ilike.${term},name.ilike.${term},short_name.ilike.${term},icao_code.ilike.${term},awb_prefix.ilike.${term},country_code.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getAirlineById(supabase: Supabase, id: string) {
  const { data, error } = await supabase.from("airlines").select("*").eq("id", id).maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createAirline(supabase: Supabase, input: AirlineInput) {
  const { data, error } = await supabase
    .from("airlines")
    .insert({
      iata_code: input.iata_code,
      name: input.name,
      short_name: input.short_name || null,
      icao_code: input.icao_code || null,
      awb_prefix: input.awb_prefix || null,
      country_code: input.country_code || null,
      is_cargo_only: input.is_cargo_only,
      notes: input.notes || null,
      status: input.status,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateAirline(supabase: Supabase, id: string, input: AirlineUpdateInput) {
  const { data, error } = await supabase
    .from("airlines")
    .update({
      ...input,
      short_name: input.short_name === "" ? null : input.short_name,
      icao_code: input.icao_code === "" ? null : input.icao_code,
      awb_prefix: input.awb_prefix === "" ? null : input.awb_prefix,
      country_code: input.country_code === "" ? null : input.country_code,
      notes: input.notes === "" ? null : input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function archiveAirline(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("airlines")
    .update({ status: "ARCHIVED" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function restoreAirline(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("airlines")
    .update({ status: "ACTIVE" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}
