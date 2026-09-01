"use client";

import { useQuery } from "@tanstack/react-query";

import type { VehicleFilters } from "@/lib/master-data/vehicles";
import {
  getAllDriverVehicles,
  getVehicleById,
  getVehicleCustomers,
  getVehicleDrivers,
  getVehiclesWithCounts,
} from "@/lib/master-data/vehicles";
import { createClient } from "@/lib/supabase/client";

export function useVehicles(filters?: VehicleFilters) {
  return useQuery({
    queryKey: ["vehicles", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getVehiclesWithCounts(supabase, filters);
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      const supabase = createClient();
      return getVehicleById(supabase, id);
    },
    enabled: Boolean(id),
  });
}

export function useVehicleDrivers(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicle", vehicleId, "drivers"],
    queryFn: async () => {
      const supabase = createClient();
      return getVehicleDrivers(supabase, vehicleId);
    },
    enabled: Boolean(vehicleId),
  });
}

export function useVehicleCustomers(vehicleId: string) {
  return useQuery({
    queryKey: ["vehicle", vehicleId, "customers"],
    queryFn: async () => {
      const supabase = createClient();
      return getVehicleCustomers(supabase, vehicleId);
    },
    enabled: Boolean(vehicleId),
  });
}

export function useDriverVehicleAssignments() {
  return useQuery({
    queryKey: ["driver-vehicles"],
    queryFn: async () => {
      const supabase = createClient();
      return getAllDriverVehicles(supabase);
    },
  });
}
