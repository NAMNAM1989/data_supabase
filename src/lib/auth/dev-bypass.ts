import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

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

/**
 * Auto sign-in for local QA when DEV_SKIP_AUTH=true.
 * Returns true only when a real Supabase session (JWT cookies) exists.
 * Never fabricates a mock ADMIN profile — that caused empty RLS reads.
 */
export async function ensureDevAuthSession(supabase: SupabaseClient<Database>) {
  if (!isDevAuthBypassEnabled()) return false;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return true;

  const { email, password } = getDevAuthCredentials();
  if (!password) {
    console.error(
      "[dev-auth] DEV_SKIP_AUTH=true nhưng thiếu DEV_AUTH_PASSWORD — bắt buộc password để có JWT thật",
    );
    return false;
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error("[dev-auth] Auto sign-in failed:", error.message);
    return false;
  }

  return true;
}
