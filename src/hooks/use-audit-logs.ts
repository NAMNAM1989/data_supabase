"use client";

import { useQuery } from "@tanstack/react-query";

import type { AuditLogFilters } from "@/lib/master-data/audit";
import { getAuditLogs } from "@/lib/master-data/audit";
import { createClient } from "@/lib/supabase/client";

export function useAuditLogs(filters?: AuditLogFilters, enabled = true) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      const supabase = createClient();
      return getAuditLogs(supabase, filters);
    },
    enabled: enabled && Boolean(filters),
  });
}
