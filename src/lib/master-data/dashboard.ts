import { mapSupabaseError, type Supabase } from "@/lib/errors";

export type DashboardStats = {
  totalCustomers: number;
  totalShippers: number;
  totalConsignees: number;
  totalCommodities: number;
  totalDrivers: number;
  totalVehicles: number;
  inactiveRecords: number;
};

export async function getDashboardStats(supabase: Supabase): Promise<DashboardStats> {
  const [
    customers,
    shippers,
    consignees,
    commodities,
    drivers,
    vehicles,
    inactiveCustomers,
    inactiveDrivers,
    inactiveVehicles,
  ] = await Promise.all([
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase
      .from("customer_parties")
      .select("*", { count: "exact", head: true })
      .eq("role", "SHIPPER")
      .eq("status", "ACTIVE"),
    supabase
      .from("customer_parties")
      .select("*", { count: "exact", head: true })
      .eq("role", "CONSIGNEE")
      .eq("status", "ACTIVE"),
    supabase.from("commodities").select("*", { count: "exact", head: true }),
    supabase.from("drivers").select("*", { count: "exact", head: true }),
    supabase.from("vehicles").select("*", { count: "exact", head: true }),
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("status", "INACTIVE"),
    supabase.from("drivers").select("*", { count: "exact", head: true }).eq("status", "INACTIVE"),
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "INACTIVE"),
  ]);

  const results = [
    customers,
    shippers,
    consignees,
    commodities,
    drivers,
    vehicles,
    inactiveCustomers,
    inactiveDrivers,
    inactiveVehicles,
  ];

  for (const result of results) {
    if (result.error) throw mapSupabaseError(result.error);
  }

  return {
    totalCustomers: customers.count ?? 0,
    totalShippers: shippers.count ?? 0,
    totalConsignees: consignees.count ?? 0,
    totalCommodities: commodities.count ?? 0,
    totalDrivers: drivers.count ?? 0,
    totalVehicles: vehicles.count ?? 0,
    inactiveRecords:
      (inactiveCustomers.count ?? 0) +
      (inactiveDrivers.count ?? 0) +
      (inactiveVehicles.count ?? 0),
  };
}
