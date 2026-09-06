/**
 * Seed airlines master từ ops_aircargo/data/airlines.json + AWB prefix map.
 *
 * Usage: node --env-file=.env.local scripts/seed-airlines.mjs
 *
 * Optional: AIRLINES_JSON=path/to/airlines.json
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** IATA numeric cargo AWB prefix (3 digits) — VN/Asia + common carriers */
const AWB_PREFIX_BY_IATA = {
  CI: "297",
  VN: "738",
  SQ: "618",
  MH: "232",
  TG: "217",
  CX: "160",
  BR: "695",
  OZ: "988",
  KE: "180",
  JL: "131",
  NH: "205",
  CZ: "784",
  CA: "999",
  MU: "781",
  MF: "731",
  HX: "851",
  AK: "807",
  "5J": "203",
  PR: "079",
  QR: "157",
  EK: "176",
  EY: "607",
  TK: "235",
  LH: "020",
  AF: "057",
  KL: "074",
  BA: "125",
  QF: "081",
  UA: "016",
  DL: "006",
  AA: "001",
  CV: "172",
  KZ: "933",
};

const ICAO_BY_IATA = {
  CI: "CAL",
  VN: "HVN",
  VJ: "VJC",
  QH: "BAV",
  VU: "VAG",
  SQ: "SIA",
  MH: "MAS",
  TG: "THA",
  CX: "CPA",
  BR: "EVA",
  OZ: "AAR",
  KE: "KAL",
  JL: "JAL",
  NH: "ANA",
  CZ: "CSN",
  CA: "CCA",
  MU: "CES",
  MF: "CXA",
  HX: "CRK",
  AK: "AXM",
  FD: "AIQ",
  "5J": "CEB",
  PR: "PAL",
  QR: "QTR",
  EK: "UAE",
  EY: "ETD",
  TK: "THY",
  LH: "DLH",
  AF: "AFR",
  KL: "KLM",
  BA: "BAW",
  QF: "QFA",
  UA: "UAL",
  DL: "DAL",
  AA: "AAL",
  CV: "CLX",
  KZ: "NCA",
};

const COUNTRY_BY_IATA = {
  CI: "TW",
  VN: "VN",
  VJ: "VN",
  QH: "VN",
  VU: "VN",
  SQ: "SG",
  MH: "MY",
  TG: "TH",
  CX: "HK",
  BR: "TW",
  OZ: "KR",
  KE: "KR",
  JL: "JP",
  NH: "JP",
  CZ: "CN",
  CA: "CN",
  MU: "CN",
  MF: "CN",
  HX: "HK",
  AK: "MY",
  FD: "TH",
  "5J": "PH",
  PR: "PH",
  QR: "QA",
  EK: "AE",
  EY: "AE",
  TK: "TR",
  LH: "DE",
  AF: "FR",
  KL: "NL",
  BA: "GB",
  QF: "AU",
  UA: "US",
  DL: "US",
  AA: "US",
  CV: "LU",
  KZ: "JP",
};

const CARGO_ONLY = new Set(["CV", "KZ"]);

const defaultJsonPath = resolve(
  process.env.AIRLINES_JSON ||
    resolve(process.cwd(), "../ops_aircargo/data/airlines.json"),
);

function loadOpsAirlines() {
  if (!existsSync(defaultJsonPath)) {
    console.error(`Airlines JSON not found: ${defaultJsonPath}`);
    process.exit(1);
  }
  const raw = JSON.parse(readFileSync(defaultJsonPath, "utf8"));
  if (!Array.isArray(raw)) {
    console.error("airlines.json must be an array");
    process.exit(1);
  }
  return raw;
}

function fail(label, error) {
  console.error(label, error);
  process.exit(1);
}

function toRow(item) {
  const iata = String(item.prefix ?? item.iata_code ?? "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z0-9]{2}$/.test(iata)) {
    fail("invalid iata", { iata, item });
  }
  const name = String(item.name ?? "").trim();
  if (!name) fail("missing name", item);

  return {
    iata_code: iata,
    name,
    short_name: item.short_name?.trim() || iata,
    icao_code: ICAO_BY_IATA[iata] ?? null,
    awb_prefix: AWB_PREFIX_BY_IATA[iata] ?? null,
    country_code: COUNTRY_BY_IATA[iata] ?? null,
    is_cargo_only: CARGO_ONLY.has(iata),
    status: "ACTIVE",
  };
}

async function upsertAirline(row) {
  const { data: existing, error: findError } = await supabase
    .from("airlines")
    .select("id, iata_code, status")
    .eq("iata_code", row.iata_code)
    .maybeSingle();
  if (findError) fail(`find ${row.iata_code}`, findError);

  const payload = {
    ...row,
    // Keep existing awb_prefix if seed has null but DB already has a value
  };

  if (existing) {
    if (!payload.awb_prefix) {
      const { data: full } = await supabase
        .from("airlines")
        .select("awb_prefix")
        .eq("id", existing.id)
        .maybeSingle();
      if (full?.awb_prefix) payload.awb_prefix = full.awb_prefix;
    }

    const { data, error } = await supabase
      .from("airlines")
      .update(payload)
      .eq("id", existing.id)
      .select("id, iata_code, status, awb_prefix")
      .single();
    if (error) fail(`update ${row.iata_code}`, error);
    return { action: existing.status === "ARCHIVED" ? "restored" : "updated", row: data };
  }

  const { data, error } = await supabase
    .from("airlines")
    .insert(payload)
    .select("id, iata_code, status, awb_prefix")
    .single();
  if (error) fail(`insert ${row.iata_code}`, error);
  return { action: "created", row: data };
}

const ops = loadOpsAirlines();
const rows = ops.map(toRow);
const summary = { created: [], updated: [], restored: [] };
const withAwb = [];

for (const row of rows) {
  const result = await upsertAirline(row);
  summary[result.action].push(result.row.iata_code);
  if (result.row.awb_prefix) withAwb.push(`${result.row.iata_code}:${result.row.awb_prefix}`);
}

const { count, error: countError } = await supabase
  .from("airlines")
  .select("*", { count: "exact", head: true })
  .eq("status", "ACTIVE");
if (countError) fail("count", countError);

console.log(
  JSON.stringify(
    {
      ok: true,
      source: defaultJsonPath,
      seedTotal: rows.length,
      activeInDb: count,
      created: summary.created.length,
      updated: summary.updated.length,
      restored: summary.restored.length,
      createdCodes: summary.created,
      restoredCodes: summary.restored,
      awbPrefixes: withAwb,
    },
    null,
    2,
  ),
);
