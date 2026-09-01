/**
 * Bootstrap first ADMIN user + profile for NAM NAM DATA.
 * Usage: node scripts/bootstrap-admin.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, BOOTSTRAP_ADMIN_NAME
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const email = (process.env.BOOTSTRAP_ADMIN_EMAIL ?? "namnamlogistics@gmail.com").toLowerCase();
const displayName = process.env.BOOTSTRAP_ADMIN_NAME ?? "NAM NAM Admin";
const password =
  process.env.BOOTSTRAP_ADMIN_PASSWORD ?? randomBytes(12).toString("base64url") + "Aa1!";

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: existing } = await admin.auth.admin.listUsers({ perPage: 200 });
const found = existing?.users?.find((u) => u.email?.toLowerCase() === email);

let userId = found?.id;

if (!userId) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });

  if (error) {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }

  userId = data.user.id;
  console.log("Created auth user:", email);
} else {
  console.log("Auth user already exists:", email);
}

const { data: profile, error: profileError } = await admin
  .from("profiles")
  .upsert(
    {
      id: userId,
      display_name: displayName,
      role: "ADMIN",
      status: "ACTIVE",
    },
    { onConflict: "id" },
  )
  .select()
  .single();

if (profileError) {
  console.error("profile upsert failed:", profileError.message);
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  email,
  password: found ? "(unchanged — user existed)" : password,
  userId,
  profile,
}, null, 2));
