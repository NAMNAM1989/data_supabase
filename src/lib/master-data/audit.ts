import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type { Json, Tables } from "@/types/database";

export type AuditLog = Tables<"audit_logs">;

export type AuditLogFilters = {
  action?: string;
  tableName?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type AuditLogWithActor = AuditLog & {
  actorEmail?: string | null;
  actorName?: string | null;
};

export type WriteAuditLogInput = {
  actorUserId?: string | null;
  action: string;
  tableName: string;
  recordId?: string | null;
  oldData?: Json | null;
  newData?: Json | null;
  appName?: string;
};

export async function getAuditLogs(supabase: Supabase, filters?: AuditLogFilters) {
  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.action) {
    query = query.eq("action", filters.action);
  }
  if (filters?.tableName) {
    query = query.eq("table_name", filters.tableName);
  }
  if (filters?.search) {
    const term = `%${filters.search.trim()}%`;
    query = query.or(`action.ilike.${term},table_name.ilike.${term},app_name.ilike.${term}`);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 25) - 1);
  }

  const { data, error } = await query;
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function getRecentAuditLogs(supabase: Supabase, limit = 10) {
  return getAuditLogs(supabase, { limit });
}

/**
 * Writes an audit row. Soft-fails by default so primary mutations are not rolled back
 * when audit RLS/network fails. Pass `{ throwOnError: true }` for strict callers.
 */
export async function writeAuditLog(
  supabase: Supabase,
  input: WriteAuditLogInput,
  options?: { throwOnError?: boolean },
) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_user_id: input.actorUserId ?? null,
    app_name: input.appName ?? "NAM_NAM_DATA",
    action: input.action,
    table_name: input.tableName,
    record_id: input.recordId ?? null,
    old_data: input.oldData ?? null,
    new_data: input.newData ?? null,
  });

  if (error) {
    console.error("[audit] write failed:", error.message);
    if (options?.throwOnError) throw mapSupabaseError(error);
    return false;
  }

  return true;
}
