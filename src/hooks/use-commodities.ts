"use client";

import { useQuery } from "@tanstack/react-query";

import type { CommodityFilters } from "@/lib/master-data/commodities";
import { getCommodities } from "@/lib/master-data/commodities";
import { createClient } from "@/lib/supabase/client";

export function useCommodities(filters?: CommodityFilters) {
  return useQuery({
    queryKey: ["commodities", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getCommodities(supabase, filters);
    },
  });
}
