import { redirect } from "next/navigation";

import {
  ensureDevAuthSession,
  getDevMockSession,
  isDevAuthBypassEnabled,
} from "@/lib/auth/dev-bypass";
import { createClient } from "@/lib/supabase/server";
import type { AuthSession } from "@/types/auth";

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient();

  if (isDevAuthBypassEnabled()) {
    await ensureDevAuthSession(supabase);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return isDevAuthBypassEnabled() ? getDevMockSession() : null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email,
    profile,
  };
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
