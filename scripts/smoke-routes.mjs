import { createClient } from "@supabase/supabase-js";

const base = process.env.SMOKE_BASE_URL ?? "https://datasupabase-production.up.railway.app";
const email = process.env.SMOKE_EMAIL;
const password = process.env.SMOKE_PASSWORD;

if (!email || !password) {
  console.error("Set SMOKE_EMAIL and SMOKE_PASSWORD before running smoke-routes.");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  process.exit(1);
}

const routes = [
  "/dashboard",
  "/customers",
  "/parties",
  "/commodities",
  "/drivers",
  "/vehicles",
  "/driver-vehicles",
  "/destinations",
  "/import",
  "/export",
  "/duplicates",
  "/audit-logs",
  "/users",
  "/settings",
];

const supa = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

const { data, error } = await supa.auth.signInWithPassword({ email, password });
if (error) {
  console.error("AUTH_FAIL", error.message);
  process.exit(1);
}

const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];
const cookieName = `sb-${projectRef}-auth-token`;
const cookieValue = encodeURIComponent(
  JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    expires_in: data.session.expires_in,
    token_type: "bearer",
    user: data.user,
  }),
);

let failed = 0;
for (const route of routes) {
  const res = await fetch(`${base}${route}`, {
    headers: { cookie: `${cookieName}=${cookieValue}` },
    redirect: "manual",
  });
  const ok = res.status === 200;
  if (!ok) failed += 1;
  console.log(`${ok ? "OK" : "FAIL"} ${route} -> ${res.status}`);
}

process.exit(failed > 0 ? 1 : 0);
