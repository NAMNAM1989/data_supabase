import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import type { AuthSession } from "@/types/auth";

const DEV_ADMIN_ID = "7d346350-06e5-4e53-9ee8-c2a0d87e6bfa";

export function isDevAuthBypassEnabled() {
  return (
    process.env.NODE_ENV === "development" && process.env.DEV_SKIP_AUTH === "true"
  );
}

export function getDevAuthCredentials() {
  return {
    email: (process.env.DEV_AUTH_EMAIL ?? "namnamlogistics@gmail.com").toLowerCase(),
    password: process.env.DEV_AUTH_PASSWORD ?? "",
  };
}

export async function ensureDevAuthSession(supabase: SupabaseClient<Database>) {
  if (!isDevAuthBypassEnabled()) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return true;

  const { email, password } = getDevAuthCredentials();
  if (!password) {
    console.warn(
      "[dev-auth] DEV_SKIP_AUTH=true nhưng thiếu DEV_AUTH_PASSWORD — UI chạy được, query client có thể lỗi RLS",
    );
    return false;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.warn("[dev-auth] Auto sign-in failed:", error.message);
    return false;
  }

  return true;
}

export function getDevMockSession(): AuthSession {
  const { email } = getDevAuthCredentials();
  const now = new Date().toISOString();

  return {
    userId: DEV_ADMIN_ID,
    email,
    profile: {
      id: DEV_ADMIN_ID,
      display_name: "Dev Admin",
      role: "ADMIN",
      status: "ACTIVE",
      created_at: now,
      updated_at: now,
    },
  };
}
