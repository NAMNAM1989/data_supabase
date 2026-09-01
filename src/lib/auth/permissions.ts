import type { AppRole } from "@/types/auth";

export type PermissionAction =
  | "read"
  | "create"
  | "update"
  | "archive"
  | "restore"
  | "import"
  | "export"
  | "manage_users"
  | "view_audit"
  | "merge_duplicates";

const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<PermissionAction>> = {
  ADMIN: new Set([
    "read",
    "create",
    "update",
    "archive",
    "restore",
    "import",
    "export",
    "manage_users",
    "view_audit",
    "merge_duplicates",
  ]),
  OPERATOR: new Set(["read", "create", "update", "import", "export"]),
  VIEWER: new Set(["read", "export"]),
  INTEGRATION: new Set(["read"]),
};

export function canPerform(role: AppRole | null | undefined, action: PermissionAction) {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.has(action) ?? false;
}

export function canWrite(role: AppRole | null | undefined) {
  return canPerform(role, "create") || canPerform(role, "update");
}
