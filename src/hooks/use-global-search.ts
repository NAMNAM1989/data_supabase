"use client";

import { useQuery } from "@tanstack/react-query";

import { globalSearch } from "@/lib/search/global-search";
import { createClient } from "@/lib/supabase/client";

export function useGlobalSearch(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {
      const supabase = createClient();
      return globalSearch(supabase, query);
    },
    enabled: enabled && query.trim().length >= 2,
    staleTime: 30_000,
  });
}
