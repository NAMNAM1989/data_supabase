"use client";

import { useQuery } from "@tanstack/react-query";

import type { PartyFilters } from "@/lib/master-data/parties";
import { getPartiesWithUsage, getPartyById, getPartyCustomers } from "@/lib/master-data/parties";
import { createClient } from "@/lib/supabase/client";

export function useParties(filters?: PartyFilters) {
  return useQuery({
    queryKey: ["parties", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getPartiesWithUsage(supabase, filters);
    },
  });
}

export function useParty(id: string) {
  return useQuery({
    queryKey: ["party", id],
    queryFn: async () => {
      const supabase = createClient();
      return getPartyById(supabase, id);
    },
    enabled: Boolean(id),
  });
}

export function usePartyCustomers(partyId: string) {
  return useQuery({
    queryKey: ["party", partyId, "customers"],
    queryFn: async () => {
      const supabase = createClient();
      return getPartyCustomers(supabase, partyId);
    },
    enabled: Boolean(partyId),
  });
}
