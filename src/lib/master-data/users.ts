import { AppError, mapSupabaseError, type Supabase } from "@/lib/errors";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UpdateProfileInput } from "@/lib/validation/user";
import type { Tables } from "@/types/database";

export type Profile = Tables<"profiles">;

export type UserWithProfile = {
  id: string;
  email: string;
  createdAt: string;
  profile: Profile | null;
};

export async function listUsersWithProfiles(): Promise<UserWithProfile[]> {
  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (authError) {
    throw new AppError("UNKNOWN", authError.message);
  }

  const { data: profiles, error: profileError } = await admin.from("profiles").select("*");
  if (profileError) throw mapSupabaseError(profileError);

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (authData.users ?? []).map((user) => ({
    id: user.id,
    email: user.email ?? "",
    createdAt: user.created_at,
    profile: profileMap.get(user.id) ?? null,
  }));
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .update({
      display_name: input.display_name === "" ? null : input.display_name,
      role: input.role,
      status: input.status,
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function ensureProfile(
  userId: string,
  input: { display_name?: string | null; role?: Profile["role"] },
) {
  const admin = createAdminClient();

  const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from("profiles")
    .insert({
      id: userId,
      display_name: input.display_name ?? null,
      role: input.role ?? "VIEWER",
      status: "ACTIVE",
    })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}

export async function createAuthUser(input: {
  email: string;
  password: string;
  display_name?: string;
  role: Profile["role"];
}) {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.display_name ?? null,
    },
  });

  if (error) {
    throw new AppError("UNKNOWN", error.message);
  }

  if (!data.user) {
    throw new AppError("UNKNOWN", "Không thể tạo user");
  }

  await ensureProfile(data.user.id, {
    display_name: input.display_name ?? null,
    role: input.role,
  });

  return data.user;
}

export async function updateSelfProfile(supabase: Supabase, userId: string, displayName: string) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: displayName })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}
