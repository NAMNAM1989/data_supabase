import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { CustomerInput, CustomerUpdateInput } from "@/lib/validation/customer";
import type { Tables } from "@/types/database";

export type Customer = Tables<"customers">;

export type CustomerFilters = {
  search?: string;
  status?: Customer["status"];
  customerType?: string;
};

export type CustomerListItem = Customer & {
  shipperCount: number;
  consigneeCount: number;
  commodityCount: number;
};

export async function getCustomers(supabase: Supabase, filters?: CustomerFilters) {
  let query = supabase
    .from("customers")
    .select("*")
    .order("code", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.neq("status", "ARCHIVED");
  }
  if (filters?.customerType) {
    query = query.eq("customer_type", filters.customerType);
  }
  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`code.ilike.${term},name.ilike.${term},short_name.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

function buildCountMap(
  rows: Array<{ customer_id: string; role?: string }>,
  role?: string,
) {
  const map = new Map<string, number>();
  for (const row of rows) {
    if (role && row.role !== role) continue;
    map.set(row.customer_id, (map.get(row.customer_id) ?? 0) + 1);
  }
  return map;
}

export async function getCustomersWithCounts(
  supabase: Supabase,
  filters?: CustomerFilters,
): Promise<CustomerListItem[]> {
  const customers = await getCustomers(supabase, filters);
  if (customers.length === 0) return [];

  const ids = customers.map((c) => c.id);
  const [partiesResult, commoditiesResult] = await Promise.all([
    supabase
      .from("customer_parties")
      .select("customer_id, role")
      .in("customer_id", ids)
      .eq("status", "ACTIVE"),
    supabase
      .from("customer_commodities")
      .select("customer_id")
      .in("customer_id", ids)
      .eq("status", "ACTIVE"),
  ]);

  if (partiesResult.error) throw mapSupabaseError(partiesResult.error);
  if (commoditiesResult.error) throw mapSupabaseError(commoditiesResult.error);

  const shipperMap = buildCountMap(partiesResult.data ?? [], "SHIPPER");
  const consigneeMap = buildCountMap(partiesResult.data ?? [], "CONSIGNEE");
  const commodityMap = buildCountMap(commoditiesResult.data ?? []);

  return customers.map((customer) => ({
    ...customer,
    shipperCount: shipperMap.get(customer.id) ?? 0,
    consigneeCount: consigneeMap.get(customer.id) ?? 0,
    commodityCount: commodityMap.get(customer.id) ?? 0,
  }));
}

export async function getCustomerById(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createCustomer(supabase: Supabase, input: CustomerInput) {
  const { data, error } = await supabase
    .from("customers")
    .insert({
      code: input.code,
      name: input.name,
      short_name: input.short_name || null,
      customer_type: input.customer_type ?? null,
      tax_code: input.tax_code || null,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateCustomer(
  supabase: Supabase,
  id: string,
  input: CustomerUpdateInput,
) {
  const { data, error } = await supabase
    .from("customers")
    .update({
      ...input,
      short_name: input.short_name === "" ? null : input.short_name,
      tax_code: input.tax_code === "" ? null : input.tax_code,
      address: input.address === "" ? null : input.address,
      phone: input.phone === "" ? null : input.phone,
      email: input.email === "" ? null : input.email,
      notes: input.notes === "" ? null : input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function archiveCustomer(supabase: Supabase, id: string) {
  return updateCustomer(supabase, id, { status: "ARCHIVED" });
}

export async function restoreCustomer(supabase: Supabase, id: string) {
  return updateCustomer(supabase, id, { status: "ACTIVE" });
}
