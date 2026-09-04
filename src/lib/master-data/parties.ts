import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { PartyInput, PartyUpdateInput } from "@/lib/validation/party";
import type { Tables } from "@/types/database";

export type Party = Tables<"parties">;

export type PartyFilters = {
  search?: string;
  status?: Party["status"];
};

export type PartyWithUsage = Party & {
  customerCount: number;
};

export async function getParties(supabase: Supabase, filters?: PartyFilters) {
  let query = supabase.from("parties").select("*").order("name", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.neq("status", "ARCHIVED");
  }
  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`name.ilike.${term},code.ilike.${term},tax_code.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getPartiesWithUsage(
  supabase: Supabase,
  filters?: PartyFilters,
): Promise<PartyWithUsage[]> {
  const parties = await getParties(supabase, filters);
  if (parties.length === 0) return [];

  const ids = parties.map((p) => p.id);
  const { data, error } = await supabase
    .from("customer_parties")
    .select("party_id")
    .in("party_id", ids)
    .eq("status", "ACTIVE");

  if (error) throw mapSupabaseError(error);

  const usageMap = new Map<string, number>();
  for (const row of data ?? []) {
    usageMap.set(row.party_id, (usageMap.get(row.party_id) ?? 0) + 1);
  }

  return parties.map((party) => ({
    ...party,
    customerCount: usageMap.get(party.id) ?? 0,
  }));
}

export async function getPartyById(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("parties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getPartyCustomers(supabase: Supabase, partyId: string) {
  const { data, error } = await supabase
    .from("customer_parties")
    .select(
      `
      id,
      role,
      status,
      is_default,
      customer:customers(id, code, name)
    `,
    )
    .eq("party_id", partyId)
    .eq("status", "ACTIVE")
    .order("created_at", { ascending: true });

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createParty(supabase: Supabase, input: PartyInput) {
  const { data, error } = await supabase
    .from("parties")
    .insert({
      code: input.code || null,
      name: input.name,
      tax_code: input.tax_code || null,
      address: input.address || null,
      city: input.city || null,
      state: input.state || null,
      postal_code: input.postal_code || null,
      country_code: input.country_code || null,
      phone: input.phone || null,
      fax: input.fax || null,
      email: input.email || null,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateParty(supabase: Supabase, id: string, input: PartyUpdateInput) {
  const { data, error } = await supabase
    .from("parties")
    .update({
      ...input,
      code: input.code === "" ? null : input.code,
      tax_code: input.tax_code === "" ? null : input.tax_code,
      address: input.address === "" ? null : input.address,
      city: input.city === "" ? null : input.city,
      state: input.state === "" ? null : input.state,
      postal_code: input.postal_code === "" ? null : input.postal_code,
      country_code: input.country_code === "" ? null : input.country_code,
      phone: input.phone === "" ? null : input.phone,
      fax: input.fax === "" ? null : input.fax,
      email: input.email === "" ? null : input.email,
      notes: input.notes === "" ? null : input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function archiveParty(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("parties")
    .update({ status: "ARCHIVED" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function restoreParty(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("parties")
    .update({ status: "ACTIVE" })
    .eq("id", id)
    .select()
    .single();
  if (error) throw mapSupabaseError(error);
  return data;
}
