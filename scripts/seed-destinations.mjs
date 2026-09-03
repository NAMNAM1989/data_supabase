/**
 * Tổng hợp + upsert danh sách destinations (IATA) cho NAM NAM DATA.
 *
 * Nguồn tổng hợp:
 * - Destinations đã có trong DB (restore ARCHIVED hữu ích)
 * - TECS OPS: TPE, BKK, SIN, KUL, SGN, HAN, HKG, MNL, SYD…
 * - Customers: CDG (SUNNY CDG), LHR (SUNNY LHR), CGK (MR JUNG), SGN…
 * - Parties: Hong Kong → HKG, Selangor/Klang → KUL
 * - Tuyến cargo phổ biến từ SGN (Asia / EU / ME / ANZ)
 *
 * Usage: node --env-file=.env.local scripts/seed-destinations.mjs
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** @type {Array<{iata_code:string, city_name:string, country_code:string, country_name:string, region:string, timezone:string}>} */
const DESTINATIONS = [
  // —— Việt Nam ——
  { iata_code: "SGN", city_name: "Ho Chi Minh City", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "HAN", city_name: "Hanoi", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "DAD", city_name: "Da Nang", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "HPH", city_name: "Hai Phong", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "VCA", city_name: "Can Tho", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "CXR", city_name: "Nha Trang", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "PQC", city_name: "Phu Quoc", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "VII", city_name: "Vinh", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "HUI", city_name: "Hue", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "DLI", city_name: "Da Lat", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "UIH", city_name: "Quy Nhon", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  { iata_code: "VDO", city_name: "Van Don", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },

  // —— Đông / Đông Nam Á (tuyến TECS / rate phổ biến) ——
  { iata_code: "HKG", city_name: "Hong Kong", country_code: "HK", country_name: "Hong Kong", region: "Asia", timezone: "Asia/Hong_Kong" },
  { iata_code: "MFM", city_name: "Macau", country_code: "MO", country_name: "Macau", region: "Asia", timezone: "Asia/Macau" },
  { iata_code: "TPE", city_name: "Taipei", country_code: "TW", country_name: "Taiwan", region: "Asia", timezone: "Asia/Taipei" },
  { iata_code: "KHH", city_name: "Kaohsiung", country_code: "TW", country_name: "Taiwan", region: "Asia", timezone: "Asia/Taipei" },
  { iata_code: "SIN", city_name: "Singapore", country_code: "SG", country_name: "Singapore", region: "Asia", timezone: "Asia/Singapore" },
  { iata_code: "KUL", city_name: "Kuala Lumpur", country_code: "MY", country_name: "Malaysia", region: "Asia", timezone: "Asia/Kuala_Lumpur" },
  { iata_code: "PEN", city_name: "Penang", country_code: "MY", country_name: "Malaysia", region: "Asia", timezone: "Asia/Kuala_Lumpur" },
  { iata_code: "JHB", city_name: "Johor Bahru", country_code: "MY", country_name: "Malaysia", region: "Asia", timezone: "Asia/Kuala_Lumpur" },
  { iata_code: "BKK", city_name: "Bangkok", country_code: "TH", country_name: "Thailand", region: "Asia", timezone: "Asia/Bangkok" },
  { iata_code: "DMK", city_name: "Bangkok Don Mueang", country_code: "TH", country_name: "Thailand", region: "Asia", timezone: "Asia/Bangkok" },
  { iata_code: "CNX", city_name: "Chiang Mai", country_code: "TH", country_name: "Thailand", region: "Asia", timezone: "Asia/Bangkok" },
  { iata_code: "HKT", city_name: "Phuket", country_code: "TH", country_name: "Thailand", region: "Asia", timezone: "Asia/Bangkok" },
  { iata_code: "MNL", city_name: "Manila", country_code: "PH", country_name: "Philippines", region: "Asia", timezone: "Asia/Manila" },
  { iata_code: "CEB", city_name: "Cebu", country_code: "PH", country_name: "Philippines", region: "Asia", timezone: "Asia/Manila" },
  { iata_code: "CGK", city_name: "Jakarta", country_code: "ID", country_name: "Indonesia", region: "Asia", timezone: "Asia/Jakarta" },
  { iata_code: "DPS", city_name: "Denpasar", country_code: "ID", country_name: "Indonesia", region: "Asia", timezone: "Asia/Makassar" },
  { iata_code: "SUB", city_name: "Surabaya", country_code: "ID", country_name: "Indonesia", region: "Asia", timezone: "Asia/Jakarta" },
  { iata_code: "PNH", city_name: "Phnom Penh", country_code: "KH", country_name: "Cambodia", region: "Asia", timezone: "Asia/Phnom_Penh" },
  { iata_code: "REP", city_name: "Siem Reap", country_code: "KH", country_name: "Cambodia", region: "Asia", timezone: "Asia/Phnom_Penh" },
  { iata_code: "VTE", city_name: "Vientiane", country_code: "LA", country_name: "Laos", region: "Asia", timezone: "Asia/Vientiane" },
  { iata_code: "RGN", city_name: "Yangon", country_code: "MM", country_name: "Myanmar", region: "Asia", timezone: "Asia/Yangon" },
  { iata_code: "BWN", city_name: "Bandar Seri Begawan", country_code: "BN", country_name: "Brunei", region: "Asia", timezone: "Asia/Brunei" },

  // —— Đông Bắc Á ——
  { iata_code: "ICN", city_name: "Seoul Incheon", country_code: "KR", country_name: "South Korea", region: "Asia", timezone: "Asia/Seoul" },
  { iata_code: "GMP", city_name: "Seoul Gimpo", country_code: "KR", country_name: "South Korea", region: "Asia", timezone: "Asia/Seoul" },
  { iata_code: "PUS", city_name: "Busan", country_code: "KR", country_name: "South Korea", region: "Asia", timezone: "Asia/Seoul" },
  { iata_code: "NRT", city_name: "Tokyo Narita", country_code: "JP", country_name: "Japan", region: "Asia", timezone: "Asia/Tokyo" },
  { iata_code: "HND", city_name: "Tokyo Haneda", country_code: "JP", country_name: "Japan", region: "Asia", timezone: "Asia/Tokyo" },
  { iata_code: "KIX", city_name: "Osaka", country_code: "JP", country_name: "Japan", region: "Asia", timezone: "Asia/Tokyo" },
  { iata_code: "NGO", city_name: "Nagoya", country_code: "JP", country_name: "Japan", region: "Asia", timezone: "Asia/Tokyo" },
  { iata_code: "FUK", city_name: "Fukuoka", country_code: "JP", country_name: "Japan", region: "Asia", timezone: "Asia/Tokyo" },
  { iata_code: "PVG", city_name: "Shanghai Pudong", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "SHA", city_name: "Shanghai Hongqiao", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "PEK", city_name: "Beijing Capital", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "PKX", city_name: "Beijing Daxing", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "CAN", city_name: "Guangzhou", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "SZX", city_name: "Shenzhen", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "CKG", city_name: "Chongqing", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "CTU", city_name: "Chengdu", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "XMN", city_name: "Xiamen", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "HGH", city_name: "Hangzhou", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "NKG", city_name: "Nanjing", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "WUH", city_name: "Wuhan", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },
  { iata_code: "XIY", city_name: "Xian", country_code: "CN", country_name: "China", region: "Asia", timezone: "Asia/Shanghai" },

  // —— Nam Á ——
  { iata_code: "DEL", city_name: "New Delhi", country_code: "IN", country_name: "India", region: "Asia", timezone: "Asia/Kolkata" },
  { iata_code: "BOM", city_name: "Mumbai", country_code: "IN", country_name: "India", region: "Asia", timezone: "Asia/Kolkata" },
  { iata_code: "BLR", city_name: "Bengaluru", country_code: "IN", country_name: "India", region: "Asia", timezone: "Asia/Kolkata" },
  { iata_code: "MAA", city_name: "Chennai", country_code: "IN", country_name: "India", region: "Asia", timezone: "Asia/Kolkata" },
  { iata_code: "DAC", city_name: "Dhaka", country_code: "BD", country_name: "Bangladesh", region: "Asia", timezone: "Asia/Dhaka" },
  { iata_code: "CMB", city_name: "Colombo", country_code: "LK", country_name: "Sri Lanka", region: "Asia", timezone: "Asia/Colombo" },

  // —— Trung Đông ——
  { iata_code: "DXB", city_name: "Dubai", country_code: "AE", country_name: "United Arab Emirates", region: "Middle East", timezone: "Asia/Dubai" },
  { iata_code: "AUH", city_name: "Abu Dhabi", country_code: "AE", country_name: "United Arab Emirates", region: "Middle East", timezone: "Asia/Dubai" },
  { iata_code: "DOH", city_name: "Doha", country_code: "QA", country_name: "Qatar", region: "Middle East", timezone: "Asia/Qatar" },
  { iata_code: "BAH", city_name: "Bahrain", country_code: "BH", country_name: "Bahrain", region: "Middle East", timezone: "Asia/Bahrain" },
  { iata_code: "RUH", city_name: "Riyadh", country_code: "SA", country_name: "Saudi Arabia", region: "Middle East", timezone: "Asia/Riyadh" },
  { iata_code: "JED", city_name: "Jeddah", country_code: "SA", country_name: "Saudi Arabia", region: "Middle East", timezone: "Asia/Riyadh" },
  { iata_code: "KWI", city_name: "Kuwait", country_code: "KW", country_name: "Kuwait", region: "Middle East", timezone: "Asia/Kuwait" },
  { iata_code: "MCT", city_name: "Muscat", country_code: "OM", country_name: "Oman", region: "Middle East", timezone: "Asia/Muscat" },
  { iata_code: "IST", city_name: "Istanbul", country_code: "TR", country_name: "Turkey", region: "Europe", timezone: "Europe/Istanbul" },

  // —— Châu Âu (gợi ý từ SUNNY CDG / LHR) ——
  { iata_code: "CDG", city_name: "Paris Charles de Gaulle", country_code: "FR", country_name: "France", region: "Europe", timezone: "Europe/Paris" },
  { iata_code: "LHR", city_name: "London Heathrow", country_code: "GB", country_name: "United Kingdom", region: "Europe", timezone: "Europe/London" },
  { iata_code: "LGW", city_name: "London Gatwick", country_code: "GB", country_name: "United Kingdom", region: "Europe", timezone: "Europe/London" },
  { iata_code: "FRA", city_name: "Frankfurt", country_code: "DE", country_name: "Germany", region: "Europe", timezone: "Europe/Berlin" },
  { iata_code: "MUC", city_name: "Munich", country_code: "DE", country_name: "Germany", region: "Europe", timezone: "Europe/Berlin" },
  { iata_code: "AMS", city_name: "Amsterdam", country_code: "NL", country_name: "Netherlands", region: "Europe", timezone: "Europe/Amsterdam" },
  { iata_code: "BRU", city_name: "Brussels", country_code: "BE", country_name: "Belgium", region: "Europe", timezone: "Europe/Brussels" },
  { iata_code: "VIE", city_name: "Vienna", country_code: "AT", country_name: "Austria", region: "Europe", timezone: "Europe/Vienna" },
  { iata_code: "ZRH", city_name: "Zurich", country_code: "CH", country_name: "Switzerland", region: "Europe", timezone: "Europe/Zurich" },
  { iata_code: "MXP", city_name: "Milan Malpensa", country_code: "IT", country_name: "Italy", region: "Europe", timezone: "Europe/Rome" },
  { iata_code: "FCO", city_name: "Rome Fiumicino", country_code: "IT", country_name: "Italy", region: "Europe", timezone: "Europe/Rome" },
  { iata_code: "MAD", city_name: "Madrid", country_code: "ES", country_name: "Spain", region: "Europe", timezone: "Europe/Madrid" },
  { iata_code: "BCN", city_name: "Barcelona", country_code: "ES", country_name: "Spain", region: "Europe", timezone: "Europe/Madrid" },
  { iata_code: "CPH", city_name: "Copenhagen", country_code: "DK", country_name: "Denmark", region: "Europe", timezone: "Europe/Copenhagen" },
  { iata_code: "ARN", city_name: "Stockholm", country_code: "SE", country_name: "Sweden", region: "Europe", timezone: "Europe/Stockholm" },
  { iata_code: "HEL", city_name: "Helsinki", country_code: "FI", country_name: "Finland", region: "Europe", timezone: "Europe/Helsinki" },
  { iata_code: "WAW", city_name: "Warsaw", country_code: "PL", country_name: "Poland", region: "Europe", timezone: "Europe/Warsaw" },
  { iata_code: "PRG", city_name: "Prague", country_code: "CZ", country_name: "Czech Republic", region: "Europe", timezone: "Europe/Prague" },
  { iata_code: "BUD", city_name: "Budapest", country_code: "HU", country_name: "Hungary", region: "Europe", timezone: "Europe/Budapest" },

  // —— Châu Úc / New Zealand ——
  { iata_code: "SYD", city_name: "Sydney", country_code: "AU", country_name: "Australia", region: "Oceania", timezone: "Australia/Sydney" },
  { iata_code: "MEL", city_name: "Melbourne", country_code: "AU", country_name: "Australia", region: "Oceania", timezone: "Australia/Melbourne" },
  { iata_code: "BNE", city_name: "Brisbane", country_code: "AU", country_name: "Australia", region: "Oceania", timezone: "Australia/Brisbane" },
  { iata_code: "PER", city_name: "Perth", country_code: "AU", country_name: "Australia", region: "Oceania", timezone: "Australia/Perth" },
  { iata_code: "AKL", city_name: "Auckland", country_code: "NZ", country_name: "New Zealand", region: "Oceania", timezone: "Pacific/Auckland" },

  // —— Bắc Mỹ ——
  { iata_code: "LAX", city_name: "Los Angeles", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/Los_Angeles" },
  { iata_code: "SFO", city_name: "San Francisco", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/Los_Angeles" },
  { iata_code: "SEA", city_name: "Seattle", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/Los_Angeles" },
  { iata_code: "JFK", city_name: "New York JFK", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/New_York" },
  { iata_code: "EWR", city_name: "Newark", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/New_York" },
  { iata_code: "ORD", city_name: "Chicago O'Hare", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/Chicago" },
  { iata_code: "DFW", city_name: "Dallas Fort Worth", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/Chicago" },
  { iata_code: "ATL", city_name: "Atlanta", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/New_York" },
  { iata_code: "MIA", city_name: "Miami", country_code: "US", country_name: "United States", region: "Americas", timezone: "America/New_York" },
  { iata_code: "YVR", city_name: "Vancouver", country_code: "CA", country_name: "Canada", region: "Americas", timezone: "America/Vancouver" },
  { iata_code: "YYZ", city_name: "Toronto", country_code: "CA", country_name: "Canada", region: "Americas", timezone: "America/Toronto" },
];

/** Party name → IATA (suy từ địa chỉ / thị trường) */
const PARTY_DESTINATION_HINTS = [
  { partyName: "AIR GLOBAL LIMITED", iata: "HKG" },
  { partyName: "KGN EXPRESS", iata: "KUL" },
];

function fail(label, error) {
  console.error(`FAIL ${label}:`, error?.message ?? error);
  process.exit(1);
}

async function upsertDestination(row) {
  const payload = {
    iata_code: row.iata_code,
    city_name: row.city_name,
    country_code: row.country_code,
    country_name: row.country_name,
    region: row.region,
    timezone: row.timezone,
    status: "ACTIVE",
  };

  const { data: existing, error: findError } = await supabase
    .from("destinations")
    .select("id, iata_code, status")
    .eq("iata_code", row.iata_code)
    .maybeSingle();
  if (findError) fail(`find ${row.iata_code}`, findError);

  if (existing) {
    const { data, error } = await supabase
      .from("destinations")
      .update(payload)
      .eq("id", existing.id)
      .select("id, iata_code, status")
      .single();
    if (error) fail(`update ${row.iata_code}`, error);
    return { action: existing.status === "ARCHIVED" ? "restored" : "updated", row: data };
  }

  const { data, error } = await supabase
    .from("destinations")
    .insert(payload)
    .select("id, iata_code, status")
    .single();
  if (error) fail(`insert ${row.iata_code}`, error);
  return { action: "created", row: data };
}

async function linkPartyDestinations(destByIata) {
  const linked = [];

  for (const hint of PARTY_DESTINATION_HINTS) {
    const dest = destByIata.get(hint.iata);
    if (!dest) continue;

    const { data: parties, error: partyError } = await supabase
      .from("parties")
      .select("id, name")
      .ilike("name", hint.partyName)
      .neq("status", "ARCHIVED");
    if (partyError) fail(`party ${hint.partyName}`, partyError);

    for (const party of parties ?? []) {
      const { data: relations, error: relError } = await supabase
        .from("customer_parties")
        .select("id, role, destination_id")
        .eq("party_id", party.id)
        .eq("role", "CONSIGNEE")
        .eq("status", "ACTIVE");
      if (relError) fail(`customer_parties ${party.name}`, relError);

      for (const rel of relations ?? []) {
        if (rel.destination_id === dest.id) continue;
        const { error } = await supabase
          .from("customer_parties")
          .update({ destination_id: dest.id })
          .eq("id", rel.id);
        if (error) fail(`link ${party.name}→${hint.iata}`, error);
        linked.push({ party: party.name, iata: hint.iata });
      }
    }
  }

  return linked;
}

const summary = { created: [], updated: [], restored: [] };
const destByIata = new Map();

for (const dest of DESTINATIONS) {
  const result = await upsertDestination(dest);
  summary[result.action].push(result.row.iata_code);
  destByIata.set(result.row.iata_code, result.row);
}

const linked = await linkPartyDestinations(destByIata);

const { count, error: countError } = await supabase
  .from("destinations")
  .select("*", { count: "exact", head: true })
  .eq("status", "ACTIVE");
if (countError) fail("count", countError);

console.log(
  JSON.stringify(
    {
      ok: true,
      seedTotal: DESTINATIONS.length,
      activeInDb: count,
      created: summary.created.length,
      updated: summary.updated.length,
      restored: summary.restored.length,
      createdCodes: summary.created,
      restoredCodes: summary.restored,
      partyLinks: linked,
    },
    null,
    2,
  ),
);
