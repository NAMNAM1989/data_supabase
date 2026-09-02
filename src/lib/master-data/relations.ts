import { AppError, mapSupabaseError, type Supabase } from "@/lib/errors";
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

export async function updateCustomerParty(
  supabase: Supabase,
  relationId: string,
  input: {
    party_id?: string;
    destination_id?: string | null;
    is_default?: boolean;
  },
) {
  const { data: current, error: fetchError } = await supabase
    .from("customer_parties")
    .select("*")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  const nextPartyId = input.party_id ?? current.party_id;
  if (nextPartyId !== current.party_id) {
    const { data: dup } = await supabase
      .from("customer_parties")
      .select("id")
      .eq("customer_id", current.customer_id)
      .eq("party_id", nextPartyId)
      .eq("role", current.role)
      .neq("status", "ARCHIVED")
      .neq("id", relationId)
      .maybeSingle();

    if (dup) {
      throw new AppError("DUPLICATE", "Quan hệ party này đã tồn tại");
    }
  }

  if (input.is_default === true) {
    await supabase
      .from("customer_parties")
      .update({ is_default: false })
      .eq("customer_id", current.customer_id)
      .eq("role", current.role)
      .neq("id", relationId);
  }

  const patch: {
    party_id?: string;
    destination_id?: string | null;
    is_default?: boolean;
  } = {};
  if (input.party_id !== undefined) patch.party_id = input.party_id;
  if (input.destination_id !== undefined) patch.destination_id = input.destination_id;
  if (input.is_default !== undefined) patch.is_default = input.is_default;

  const { data, error } = await supabase
    .from("customer_parties")
    .update(patch)
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return { before: current, after: data };
}

export async function updateCustomerCommodity(
  supabase: Supabase,
  relationId: string,
  input: {
    commodity_id?: string;
    custom_description?: string | null;
    is_default?: boolean;
  },
) {
  const { data: current, error: fetchError } = await supabase
    .from("customer_commodities")
    .select("*")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  const nextCommodityId = input.commodity_id ?? current.commodity_id;
  if (nextCommodityId !== current.commodity_id) {
    const { data: dup } = await supabase
      .from("customer_commodities")
      .select("id")
      .eq("customer_id", current.customer_id)
      .eq("commodity_id", nextCommodityId)
      .neq("status", "ARCHIVED")
      .neq("id", relationId)
      .maybeSingle();

    if (dup) {
      throw new AppError("DUPLICATE", "Quan hệ commodity này đã tồn tại");
    }
  }

  if (input.is_default === true) {
    await supabase
      .from("customer_commodities")
      .update({ is_default: false })
      .eq("customer_id", current.customer_id)
      .neq("id", relationId);
  }

  const patch: {
    commodity_id?: string;
    custom_description?: string | null;
    is_default?: boolean;
  } = {};
  if (input.commodity_id !== undefined) patch.commodity_id = input.commodity_id;
  if (input.custom_description !== undefined) {
    patch.custom_description = input.custom_description;
  }
  if (input.is_default !== undefined) patch.is_default = input.is_default;

  const { data, error } = await supabase
    .from("customer_commodities")
    .update(patch)
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return { before: current, after: data };
}

export async function setDefaultCustomerCommodity(supabase: Supabase, relationId: string) {
  const { data: relation, error: fetchError } = await supabase
    .from("customer_commodities")
    .select("customer_id")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  await supabase
    .from("customer_commodities")
    .update({ is_default: false })
    .eq("customer_id", relation.customer_id)
    .eq("status", "ACTIVE");

  const { data, error } = await supabase
    .from("customer_commodities")
    .update({ is_default: true })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateCustomerDriver(
  supabase: Supabase,
  relationId: string,
  input: { driver_id?: string; is_default?: boolean },
) {
  const { data: current, error: fetchError } = await supabase
    .from("customer_drivers")
    .select("*")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  const nextDriverId = input.driver_id ?? current.driver_id;
  if (nextDriverId !== current.driver_id) {
    const { data: dup } = await supabase
      .from("customer_drivers")
      .select("id")
      .eq("customer_id", current.customer_id)
      .eq("driver_id", nextDriverId)
      .neq("status", "ARCHIVED")
      .neq("id", relationId)
      .maybeSingle();

    if (dup) {
      throw new AppError("DUPLICATE", "Driver ưu tiên này đã tồn tại");
    }
  }

  if (input.is_default === true) {
    await supabase
      .from("customer_drivers")
      .update({ is_default: false })
      .eq("customer_id", current.customer_id)
      .eq("status", "ACTIVE")
      .neq("id", relationId);
  }

  const patch: { driver_id?: string; is_default?: boolean } = {};
  if (input.driver_id !== undefined) patch.driver_id = input.driver_id;
  if (input.is_default !== undefined) patch.is_default = input.is_default;

  const { data, error } = await supabase
    .from("customer_drivers")
    .update(patch)
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return { before: current, after: data };
}

export async function updateCustomerVehicle(
  supabase: Supabase,
  relationId: string,
  input: { vehicle_id?: string; is_default?: boolean },
) {
  const { data: current, error: fetchError } = await supabase
    .from("customer_vehicles")
    .select("*")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  const nextVehicleId = input.vehicle_id ?? current.vehicle_id;
  if (nextVehicleId !== current.vehicle_id) {
    const { data: dup } = await supabase
      .from("customer_vehicles")
      .select("id")
      .eq("customer_id", current.customer_id)
      .eq("vehicle_id", nextVehicleId)
      .neq("status", "ARCHIVED")
      .neq("id", relationId)
      .maybeSingle();

    if (dup) {
      throw new AppError("DUPLICATE", "Vehicle ưu tiên này đã tồn tại");
    }
  }

  if (input.is_default === true) {
    await supabase
      .from("customer_vehicles")
      .update({ is_default: false })
      .eq("customer_id", current.customer_id)
      .eq("status", "ACTIVE")
      .neq("id", relationId);
  }

  const patch: { vehicle_id?: string; is_default?: boolean } = {};
  if (input.vehicle_id !== undefined) patch.vehicle_id = input.vehicle_id;
  if (input.is_default !== undefined) patch.is_default = input.is_default;

  const { data, error } = await supabase
    .from("customer_vehicles")
    .update(patch)
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return { before: current, after: data };
}
