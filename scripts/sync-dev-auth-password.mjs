import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = loadEnv(".env.local");
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;
const email = (env.DEV_AUTH_EMAIL || "").toLowerCase();
const password = env.DEV_AUTH_PASSWORD || "";

console.log(
  JSON.stringify({
    url_ok: Boolean(url),
    anon_ok: Boolean(anon),
    service_ok: Boolean(service),
    email,
    password_len: password.length,
  }),
);

const pub = createClient(url, anon, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: before, error: beforeErr } = await pub.auth.signInWithPassword({
  email,
  password,
});
console.log(
  "before_login",
  beforeErr ? `FAIL:${beforeErr.message}` : `OK user=${before.user?.id}`,
);

if (!beforeErr) {
  await pub.auth.signOut();
  process.exit(0);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 50,
});
if (listErr) {
  console.log("list_users_FAIL", listErr.message);
  process.exit(1);
}
const user = listed.users.find((u) => (u.email || "").toLowerCase() === email);
if (!user) {
  console.log("user_not_found");
  process.exit(1);
}
console.log("found_user", user.id, `confirmed=${Boolean(user.email_confirmed_at)}`);

const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});
if (updErr) {
  console.log("reset_FAIL", updErr.message);
  process.exit(1);
}
console.log("reset_OK");

const { data: after, error: afterErr } = await pub.auth.signInWithPassword({
  email,
  password,
});
console.log(
  "after_login",
  afterErr ? `FAIL:${afterErr.message}` : `OK user=${after.user?.id}`,
);
