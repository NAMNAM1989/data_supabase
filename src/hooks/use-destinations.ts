"use client";

import { useQuery } from "@tanstack/react-query";

import type { DestinationFilters } from "@/lib/master-data/destinations";
import { getDestinations } from "@/lib/master-data/destinations";
import { createClient } from "@/lib/supabase/client";

export function useDestinations(filters?: DestinationFilters) {
  return useQuery({
    queryKey: ["destinations", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getDestinations(supabase, filters);
    },
  });
}
