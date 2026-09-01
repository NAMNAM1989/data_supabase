"use client";

import { useQuery } from "@tanstack/react-query";

import type { DriverFilters } from "@/lib/master-data/drivers";
import {
  getDriverById,
  getDriverCustomers,
  getDriversWithCounts,
  getDriverVehicles,
} from "@/lib/master-data/drivers";
import { createClient } from "@/lib/supabase/client";

export function useDrivers(filters?: DriverFilters) {
  return useQuery({
    queryKey: ["drivers", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getDriversWithCounts(supabase, filters);
    },
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ["driver", id],
    queryFn: async () => {
      const supabase = createClient();
      return getDriverById(supabase, id);
    },
    enabled: Boolean(id),
  });
}

export function useDriverVehicles(driverId: string) {
  return useQuery({
    queryKey: ["driver", driverId, "vehicles"],
    queryFn: async () => {
      const supabase = createClient();
      return getDriverVehicles(supabase, driverId);
    },
    enabled: Boolean(driverId),
  });
}

export function useDriverCustomers(driverId: string) {
  return useQuery({
    queryKey: ["driver", driverId, "customers"],
    queryFn: async () => {
      const supabase = createClient();
      return getDriverCustomers(supabase, driverId);
    },
    enabled: Boolean(driverId),
  });
}
