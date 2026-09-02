import { AppError, mapSupabaseError, type Supabase } from "@/lib/errors";
import type { DriverInput, DriverUpdateInput } from "@/lib/validation/driver";
import type { Tables } from "@/types/database";

export type Driver = Tables<"drivers">;

export type DriverFilters = {
  search?: string;
  status?: Driver["status"];
};

export type DriverVehicle = Tables<"driver_vehicles"> & {
  vehicle: Tables<"vehicles">;
};

export type DriverWithCounts = Driver & {
  vehicleCount: number;
  customerCount: number;
};

export async function getDrivers(supabase: Supabase, filters?: DriverFilters) {
  let query = supabase.from("drivers").select("*").order("full_name", { ascending: true });

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(
      `full_name.ilike.${term},code.ilike.${term},phone.ilike.${term},document_number.ilike.${term}`,
    );
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getDriversWithCounts(
  supabase: Supabase,
  filters?: DriverFilters,
): Promise<DriverWithCounts[]> {
  const drivers = await getDrivers(supabase, filters);
  if (drivers.length === 0) return [];

  const ids = drivers.map((d) => d.id);

  const [vehiclesRes, customersRes] = await Promise.all([
    supabase
      .from("driver_vehicles")
      .select("driver_id")
      .in("driver_id", ids)
      .eq("status", "ACTIVE"),
    supabase
      .from("customer_drivers")
      .select("driver_id")
      .in("driver_id", ids)
      .eq("status", "ACTIVE"),
  ]);

  if (vehiclesRes.error) throw mapSupabaseError(vehiclesRes.error);
  if (customersRes.error) throw mapSupabaseError(customersRes.error);

  const vehicleMap = new Map<string, number>();
  for (const row of vehiclesRes.data ?? []) {
    vehicleMap.set(row.driver_id, (vehicleMap.get(row.driver_id) ?? 0) + 1);
  }

  const customerMap = new Map<string, number>();
  for (const row of customersRes.data ?? []) {
    customerMap.set(row.driver_id, (customerMap.get(row.driver_id) ?? 0) + 1);
  }

  return drivers.map((driver) => ({
    ...driver,
    vehicleCount: vehicleMap.get(driver.id) ?? 0,
    customerCount: customerMap.get(driver.id) ?? 0,
  }));
}

export async function getDriverById(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getDriverVehicles(supabase: Supabase, driverId: string) {
  const { data, error } = await supabase
    .from("driver_vehicles")
    .select(
      `
      *,
      vehicle:vehicles(*)
    `,
    )
    .eq("driver_id", driverId)
    .neq("status", "ARCHIVED")
    .order("is_preferred", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return (data ?? []) as DriverVehicle[];
}

export async function getDriverCustomers(supabase: Supabase, driverId: string) {
  const { data, error } = await supabase
    .from("customer_drivers")
    .select(
      `
      id,
      is_default,
      status,
      customer:customers(id, code, name)
    `,
    )
    .eq("driver_id", driverId)
    .eq("status", "ACTIVE")
    .order("is_default", { ascending: false });

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createDriver(supabase: Supabase, input: DriverInput) {
  const { data, error } = await supabase
    .from("drivers")
    .insert({
      code: input.code || null,
      full_name: input.full_name,
      phone: input.phone || null,
      document_type: input.document_type || null,
      document_number: input.document_number || null,
      license_number: input.license_number || null,
      license_class: input.license_class || null,
      license_expiry: input.license_expiry || null,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateDriver(supabase: Supabase, id: string, input: DriverUpdateInput) {
  const { data, error } = await supabase
    .from("drivers")
    .update({
      ...input,
      code: input.code === "" ? null : input.code,
      phone: input.phone === "" ? null : input.phone,
      document_type: input.document_type === "" ? null : input.document_type,
      document_number: input.document_number === "" ? null : input.document_number,
      license_number: input.license_number === "" ? null : input.license_number,
      license_class: input.license_class === "" ? null : input.license_class,
      license_expiry: input.license_expiry === "" ? null : input.license_expiry,
      notes: input.notes === "" ? null : input.notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function archiveDriver(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("drivers")
    .update({ status: "ARCHIVED" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function restoreDriver(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("drivers")
    .update({ status: "ACTIVE" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function assignVehicle(
  supabase: Supabase,
  input: {
    driver_id: string;
    vehicle_id: string;
    is_preferred?: boolean;
    valid_from?: string | null;
    valid_to?: string | null;
  },
) {
  const { data, error } = await supabase
    .from("driver_vehicles")
    .insert({
      driver_id: input.driver_id,
      vehicle_id: input.vehicle_id,
      is_preferred: input.is_preferred ?? false,
      valid_from: input.valid_from || null,
      valid_to: input.valid_to || null,
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function unassignVehicle(supabase: Supabase, relationId: string) {
  const { data, error } = await supabase
    .from("driver_vehicles")
    .update({ status: "ARCHIVED" })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function setPreferredDriverVehicle(supabase: Supabase, relationId: string) {
  const { data: relation, error: fetchError } = await supabase
    .from("driver_vehicles")
    .select("driver_id")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  await supabase
    .from("driver_vehicles")
    .update({ is_preferred: false })
    .eq("driver_id", relation.driver_id)
    .eq("status", "ACTIVE");

  const { data, error } = await supabase
    .from("driver_vehicles")
    .update({ is_preferred: true })
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function updateDriverVehicle(
  supabase: Supabase,
  relationId: string,
  input: {
    driver_id?: string;
    vehicle_id?: string;
    is_preferred?: boolean;
  },
) {
  const { data: current, error: fetchError } = await supabase
    .from("driver_vehicles")
    .select("*")
    .eq("id", relationId)
    .single();

  if (fetchError) throw mapSupabaseError(fetchError);

  const nextDriverId = input.driver_id ?? current.driver_id;
  const nextVehicleId = input.vehicle_id ?? current.vehicle_id;

  if (nextDriverId !== current.driver_id || nextVehicleId !== current.vehicle_id) {
    const { data: dup } = await supabase
      .from("driver_vehicles")
      .select("id")
      .eq("driver_id", nextDriverId)
      .eq("vehicle_id", nextVehicleId)
      .neq("status", "ARCHIVED")
      .neq("id", relationId)
      .maybeSingle();

    if (dup) {
      throw new AppError("DUPLICATE", "Assignment driver ↔ vehicle đã tồn tại");
    }
  }

  if (input.is_preferred === true) {
    await supabase
      .from("driver_vehicles")
      .update({ is_preferred: false })
      .eq("driver_id", nextDriverId)
      .eq("status", "ACTIVE")
      .neq("id", relationId);
  }

  const patch: {
    driver_id?: string;
    vehicle_id?: string;
    is_preferred?: boolean;
  } = {};
  if (input.driver_id !== undefined) patch.driver_id = input.driver_id;
  if (input.vehicle_id !== undefined) patch.vehicle_id = input.vehicle_id;
  if (input.is_preferred !== undefined) patch.is_preferred = input.is_preferred;

  const { data, error } = await supabase
    .from("driver_vehicles")
    .update(patch)
    .eq("id", relationId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return { before: current, after: data };
}
