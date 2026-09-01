import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { VehicleInput, VehicleUpdateInput } from "@/lib/validation/vehicle";
import type { Tables } from "@/types/database";

export type Vehicle = Tables<"vehicles">;

export type VehicleFilters = {
  search?: string;
  status?: Vehicle["status"];
};

export type VehicleDriver = Tables<"driver_vehicles"> & {
  driver: Tables<"drivers">;
};

export type VehicleWithCounts = Vehicle & {
  driverCount: number;
  customerCount: number;
};

export async function getVehicles(supabase: Supabase, filters?: VehicleFilters) {
  let query = supabase.from("vehicles").select("*").order("plate_number", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `plate_number.ilike.${term},plate_display.ilike.${term},brand.ilike.${term},model.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getVehiclesWithCounts(
  supabase: Supabase,
  filters?: VehicleFilters,
): Promise<VehicleWithCounts[]> {
  const vehicles = await getVehicles(supabase, filters);
  if (vehicles.length === 0) return [];

  const ids = vehicles.map((v) => v.id);

  const [driversRes, customersRes] = await Promise.all([
    supabase
      .from("driver_vehicles")
      .select("vehicle_id")
      .in("vehicle_id", ids)
      .eq("status", "ACTIVE"),
    supabase
      .from("customer_vehicles")
      .select("vehicle_id")
      .in("vehicle_id", ids)
      .eq("status", "ACTIVE"),
  ]);

  if (driversRes.error) throw mapSupabaseError(driversRes.error);
  if (customersRes.error) throw mapSupabaseError(customersRes.error);

  const driverMap = new Map<string, number>();
  for (const row of driversRes.data ?? []) {
    driverMap.set(row.vehicle_id, (driverMap.get(row.vehicle_id) ?? 0) + 1);
  }

  const customerMap = new Map<string, number>();
  for (const row of customersRes.data ?? []) {
    customerMap.set(row.vehicle_id, (customerMap.get(row.vehicle_id) ?? 0) + 1);
  }

  return vehicles.map((vehicle) => ({
    ...vehicle,
    driverCount: driverMap.get(vehicle.id) ?? 0,
    customerCount: customerMap.get(vehicle.id) ?? 0,
  }));
}

export async function getVehicleById(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getVehicleDrivers(supabase: Supabase, vehicleId: string) {
  const { data, error } = await supabase
    .from("driver_vehicles")
    .select(
      `
      *,
      driver:drivers(*)
    `,
    )
    .eq("vehicle_id", vehicleId)
    .neq("status", "ARCHIVED")
    .order("is_preferred", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as VehicleDriver[];
}

export async function getVehicleCustomers(supabase: Supabase, vehicleId: string) {
  const { data, error } = await supabase
    .from("customer_vehicles")
    .select(
      `
      id,
      is_default,
      status,
      customer:customers(id, code, name)
    `,
    )
    .eq("vehicle_id", vehicleId)
    .eq("status", "ACTIVE")
    .order("is_default", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createVehicle(supabase: Supabase, input: VehicleInput) {
  const { data, error } = await supabase
    .from("vehicles")
    .insert({
      plate_number: input.plate_number,
      plate_display: input.plate_display || null,
      vehicle_type: input.vehicle_type || null,
      brand: input.brand || null,
      model: input.model || null,
      payload_kg: input.payload_kg,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateVehicle(supabase: Supabase, id: string, input: VehicleUpdateInput) {
  const { data, error } = await supabase
    .from("vehicles")
    .update({
      ...input,
      plate_display: input.plate_display === "" ? null : input.plate_display,
      vehicle_type: input.vehicle_type === "" ? null : input.vehicle_type,
      brand: input.brand === "" ? null : input.brand,
      model: input.model === "" ? null : input.model,
      notes: input.notes === "" ? null : input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function archiveVehicle(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .update({ status: "ARCHIVED" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function restoreVehicle(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .update({ status: "ACTIVE" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getAllDriverVehicles(supabase: Supabase) {
  const { data, error } = await supabase
    .from("driver_vehicles")
    .select(
      `
      *,
      driver:drivers(id, full_name, code),
      vehicle:vehicles(id, plate_number, plate_display)
    `,
    )
    .neq("status", "ARCHIVED")
    .order("created_at", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return data;
}
