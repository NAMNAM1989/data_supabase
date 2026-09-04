"use client";

import { useQuery } from "@tanstack/react-query";

import type { CustomerFilters } from "@/lib/master-data/customers";
import { createClient } from "@/lib/supabase/client";
import {
  getCustomerById,
  getCustomersWithCounts,
} from "@/lib/master-data/customers";
import {
  getCustomerAgents,
  getCustomerCommodities,
  getCustomerConsignees,
  getCustomerDrivers,
  getCustomerNotifies,
  getCustomerShippers,
  getCustomerVehicles,
} from "@/lib/master-data/relations";
import { getCustomerEsidProfile } from "@/lib/master-data/customer-esid-profiles";

export function useCustomers(filters?: CustomerFilters) {
  return useQuery({
    queryKey: ["customers", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomersWithCounts(supabase, filters);
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerById(supabase, id);
    },
    enabled: Boolean(id),
  });
}

export function useCustomerShippers(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "shippers"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerShippers(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}

export function useCustomerConsignees(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "consignees"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerConsignees(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}

export function useCustomerAgents(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "agents"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerAgents(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}

export function useCustomerNotifies(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "notifies"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerNotifies(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}

export function useCustomerEsidProfile(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "esid-profile"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerEsidProfile(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}

export function useCustomerCommodities(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "commodities"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerCommodities(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}

export function useCustomerDrivers(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "drivers"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerDrivers(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}

export function useCustomerVehicles(customerId: string) {
  return useQuery({
    queryKey: ["customer", customerId, "vehicles"],
    queryFn: async () => {
      const supabase = createClient();
      return getCustomerVehicles(supabase, customerId);
    },
    enabled: Boolean(customerId),
  });
}
