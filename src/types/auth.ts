import type { Database } from "@/types/database";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type RecordStatus = Database["public"]["Enums"]["record_status"];

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export type AuthSession = {
  userId: string;
  email: string | undefined;
  profile: UserProfile | null;
};

export const APP_ROLES = [
  "ADMIN",
  "OPERATOR",
  "VIEWER",
  "INTEGRATION",
] as const satisfies readonly AppRole[];
