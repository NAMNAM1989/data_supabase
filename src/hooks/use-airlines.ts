"use client";

import { useQuery } from "@tanstack/react-query";

import type { AirlineFilters } from "@/lib/master-data/airlines";
import { getAirlines } from "@/lib/master-data/airlines";
import { createClient } from "@/lib/supabase/client";

export function useAirlines(filters?: AirlineFilters) {
  return useQuery({
    queryKey: ["airlines", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getAirlines(supabase, filters);
    },
  });
}
