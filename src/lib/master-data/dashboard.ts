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

const EMPTY_STATS: DashboardStats = {
  totalCustomers: 0,
  totalShippers: 0,
  totalConsignees: 0,
  totalCommodities: 0,
  totalDrivers: 0,
  totalVehicles: 0,
  inactiveRecords: 0,
};

/**
 * Dashboard stats — soft-fail: không throw để tránh crash cả trang (error.tsx).
 * Lỗi PostgREST được log qua mapSupabaseError / console.error.
 */
export async function getDashboardStats(supabase: Supabase): Promise<DashboardStats> {
  try {
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
      supabase
        .from("vehicles")
        .select("*", { count: "exact", head: true })
        .eq("status", "INACTIVE"),
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
      if (result.error) {
        // Log chi tiết rồi trả empty — không ném AppError làm crash SSR
        mapSupabaseError(result.error);
        return EMPTY_STATS;
      }
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
  } catch (error) {
    console.error("[dashboard] getDashboardStats failed:", error);
    return EMPTY_STATS;
  }
}
