import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { DestinationInput, DestinationUpdateInput } from "@/lib/validation/destination";
import type { Tables } from "@/types/database";

export type Destination = Tables<"destinations">;

export type DestinationFilters = {
  search?: string;
  status?: Destination["status"];
};

export async function getDestinations(supabase: Supabase, filters?: DestinationFilters) {
  let query = supabase.from("destinations").select("*").order("iata_code", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.neq("status", "ARCHIVED");
  }

  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `iata_code.ilike.${term},city_name.ilike.${term},country_name.ilike.${term},country_code.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getDestinationById(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createDestination(supabase: Supabase, input: DestinationInput) {
  const { data, error } = await supabase
    .from("destinations")
    .insert({
      iata_code: input.iata_code,
      city_name: input.city_name || null,
      country_code: input.country_code || null,
      country_name: input.country_name || null,
      region: input.region || null,
      timezone: input.timezone || null,
      status: input.status,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateDestination(
  supabase: Supabase,
  id: string,
  input: DestinationUpdateInput,
) {
  const { data, error } = await supabase
    .from("destinations")
    .update({
      ...input,
      city_name: input.city_name === "" ? null : input.city_name,
      country_code: input.country_code === "" ? null : input.country_code,
      country_name: input.country_name === "" ? null : input.country_name,
      region: input.region === "" ? null : input.region,
      timezone: input.timezone === "" ? null : input.timezone,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function archiveDestination(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("destinations")
    .update({ status: "ARCHIVED" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function restoreDestination(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("destinations")
    .update({ status: "ACTIVE" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}
