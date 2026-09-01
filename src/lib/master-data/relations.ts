import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { Tables } from "@/types/database";

export type CustomerParty = Tables<"customer_parties"> & {
  party: Tables<"parties">;
  destination: Tables<"destinations"> | null;
};

export type CustomerCommodity = Tables<"customer_commodities"> & {
  commodity: Tables<"commodities">;
};

export type CustomerDriver = Tables<"customer_drivers"> & {
  driver: Tables<"drivers">;
};

export type CustomerVehicle = Tables<"customer_vehicles"> & {
  vehicle: Tables<"vehicles">;
};

export async function getCustomerShippers(supabase: Supabase, customerId: string) {
  const { data, error } = await supabase
    .from("customer_parties")
    .select(
      `
      *,
      party:parties(*),
      destination:destinations(*)
    `,
    )
    .eq("customer_id", customerId)
    .eq("role", "SHIPPER")
    .neq("status", "ARCHIVED")
    .order("is_default", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as CustomerParty[];
}

export async function getCustomerConsignees(supabase: Supabase, customerId: string) {
  const { data, error } = await supabase
    .from("customer_parties")
    .select(
      `
      *,
      party:parties(*),
      destination:destinations(*)
    `,
    )
    .eq("customer_id", customerId)
    .eq("role", "CONSIGNEE")
    .neq("status", "ARCHIVED")
    .order("is_default", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as CustomerParty[];
}

export async function getCustomerCommodities(supabase: Supabase, customerId: string) {
  const { data, error } = await supabase
    .from("customer_commodities")
    .select(
      `
      *,
      commodity:commodities(*)
    `,
    )
    .eq("customer_id", customerId)
    .neq("status", "ARCHIVED")
    .order("is_default", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as CustomerCommodity[];
}

export async function linkCustomerParty(
  supabase: Supabase,
  input: {
    customer_id: string;
    party_id: string;
    role: "SHIPPER" | "CONSIGNEE";
    destination_id?: string | null;
    is_default?: boolean;
  },
) {
  const { data, error } = await supabase
    .from("customer_parties")
    .insert({
      customer_id: input.customer_id,
      party_id: input.party_id,
      role: input.role,
      destination_id: input.destination_id ?? null,
      is_default: input.is_default ?? false,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function unlinkCustomerParty(supabase: Supabase, relationId: string) {
  const { data, error } = await supabase
    .from("customer_parties")
    .update({ status: "ARCHIVED" })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function setDefaultCustomerParty(supabase: Supabase, relationId: string) {
  const { data: relation, error: fetchError } = await supabase
    .from("customer_parties")
    .select("customer_id, role")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  await supabase
    .from("customer_parties")
    .update({ is_default: false })
    .eq("customer_id", relation.customer_id)
    .eq("role", relation.role);

  const { data, error } = await supabase
    .from("customer_parties")
    .update({ is_default: true })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function linkCustomerCommodity(
  supabase: Supabase,
  input: {
    customer_id: string;
    commodity_id: string;
    is_default?: boolean;
    custom_description?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("customer_commodities")
    .insert({
      customer_id: input.customer_id,
      commodity_id: input.commodity_id,
      is_default: input.is_default ?? false,
      custom_description: input.custom_description ?? null,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function unlinkCustomerCommodity(supabase: Supabase, relationId: string) {
  const { data, error } = await supabase
    .from("customer_commodities")
    .update({ status: "ARCHIVED" })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getCustomerDrivers(supabase: Supabase, customerId: string) {
  const { data, error } = await supabase
    .from("customer_drivers")
    .select(
      `
      *,
      driver:drivers(*)
    `,
    )
    .eq("customer_id", customerId)
    .neq("status", "ARCHIVED")
    .order("is_default", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as CustomerDriver[];
}

export async function getCustomerVehicles(supabase: Supabase, customerId: string) {
  const { data, error } = await supabase
    .from("customer_vehicles")
    .select(
      `
      *,
      vehicle:vehicles(*)
    `,
    )
    .eq("customer_id", customerId)
    .neq("status", "ARCHIVED")
    .order("is_default", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as CustomerVehicle[];
}

export async function linkCustomerDriver(
  supabase: Supabase,
  input: { customer_id: string; driver_id: string; is_default?: boolean },
) {
  const { data, error } = await supabase
    .from("customer_drivers")
    .insert({
      customer_id: input.customer_id,
      driver_id: input.driver_id,
      is_default: input.is_default ?? false,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function unlinkCustomerDriver(supabase: Supabase, relationId: string) {
  const { data, error } = await supabase
    .from("customer_drivers")
    .update({ status: "ARCHIVED" })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function setDefaultCustomerDriver(supabase: Supabase, relationId: string) {
  const { data: relation, error: fetchError } = await supabase
    .from("customer_drivers")
    .select("customer_id")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  await supabase
    .from("customer_drivers")
    .update({ is_default: false })
    .eq("customer_id", relation.customer_id)
    .eq("status", "ACTIVE");

  const { data, error } = await supabase
    .from("customer_drivers")
    .update({ is_default: true })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function linkCustomerVehicle(
  supabase: Supabase,
  input: { customer_id: string; vehicle_id: string; is_default?: boolean },
) {
  const { data, error } = await supabase
    .from("customer_vehicles")
    .insert({
      customer_id: input.customer_id,
      vehicle_id: input.vehicle_id,
      is_default: input.is_default ?? false,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function unlinkCustomerVehicle(supabase: Supabase, relationId: string) {
  const { data, error } = await supabase
    .from("customer_vehicles")
    .update({ status: "ARCHIVED" })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function setDefaultCustomerVehicle(supabase: Supabase, relationId: string) {
  const { data: relation, error: fetchError } = await supabase
    .from("customer_vehicles")
    .select("customer_id")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  await supabase
    .from("customer_vehicles")
    .update({ is_default: false })
    .eq("customer_id", relation.customer_id)
    .eq("status", "ACTIVE");

  const { data, error } = await supabase
    .from("customer_vehicles")
    .update({ is_default: true })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}
