/**
 * Seed 5 bộ mẫu test cho NAM NAM DATA (local / shared Supabase).
 * Usage: node --env-file=.env.local scripts/seed-test-samples.mjs
 *
 * Prefix: QA-SAMPLE — dễ tìm và xóa sau khi test.
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

const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
const TAG = `QA-SAMPLE-${stamp}`;

const samples = [
  {
    key: "01",
    customer: {
      code: `${TAG}-C01`,
      name: `${TAG} Khách hàng Alpha`,
      customer_type: "DIRECT_SHIPPER",
      tax_code: "0101234567",
      phone: "0901000001",
      email: "alpha.sample@example.com",
      address: "123 Nguyễn Huệ, Q1, TP.HCM",
    },
    shipper: { name: `${TAG} Shipper Alpha`, code: `${TAG}-P-S01`, address: "Kho Alpha, Bình Dương" },
    consignee: { name: `${TAG} Consignee Alpha`, code: `${TAG}-P-C01`, address: "Cảng Sài Gòn" },
    commodity: { code: `${TAG}-G01`, name: `${TAG} Hàng may mặc`, english_name: "Garments", category: "Textile" },
    driver: { code: `${TAG}-D01`, full_name: `${TAG} Tài xế An`, phone: "0911000001", license_number: "B2-ALPHA-01" },
    vehicle: { plate_number: `${TAG}-51A00001`, plate_display: "51A-000.01", vehicle_type: "Truck", brand: "Hino", model: "500" },
    destination: { iata_code: "SGN", city_name: "Ho Chi Minh City", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  },
  {
    key: "02",
    customer: {
      code: `${TAG}-C02`,
      name: `${TAG} Khách hàng Beta`,
      customer_type: "FORWARDER",
      tax_code: "0201234567",
      phone: "0901000002",
      email: "beta.sample@example.com",
      address: "45 Lê Lợi, Hà Nội",
    },
    shipper: { name: `${TAG} Shipper Beta`, code: `${TAG}-P-S02`, address: "KCN Bắc Ninh" },
    consignee: { name: `${TAG} Consignee Beta`, code: `${TAG}-P-C02`, address: "Nội Bài" },
    commodity: { code: `${TAG}-G02`, name: `${TAG} Linh kiện điện tử`, english_name: "Electronics", category: "Electronics" },
    driver: { code: `${TAG}-D02`, full_name: `${TAG} Tài xế Bình`, phone: "0911000002", license_number: "B2-BETA-02" },
    vehicle: { plate_number: `${TAG}-29A00002`, plate_display: "29A-000.02", vehicle_type: "Van", brand: "Ford", model: "Transit" },
    destination: { iata_code: "HAN", city_name: "Hanoi", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  },
  {
    key: "03",
    customer: {
      code: `${TAG}-C03`,
      name: `${TAG} Khách hàng Gamma`,
      customer_type: "AGENT",
      tax_code: "0301234567",
      phone: "0901000003",
      email: "gamma.sample@example.com",
      address: "88 Trần Phú, Đà Nẵng",
    },
    shipper: { name: `${TAG} Shipper Gamma`, code: `${TAG}-P-S03`, address: "KCN Hòa Khánh" },
    consignee: { name: `${TAG} Consignee Gamma`, code: `${TAG}-P-C03`, address: "Cảng Đà Nẵng" },
    commodity: { code: `${TAG}-G03`, name: `${TAG} Thực phẩm đông lạnh`, english_name: "Frozen food", category: "Food" },
    driver: { code: `${TAG}-D03`, full_name: `${TAG} Tài xế Cường`, phone: "0911000003", license_number: "B2-GAMMA-03" },
    vehicle: { plate_number: `${TAG}-43A00003`, plate_display: "43A-000.03", vehicle_type: "Reefer", brand: "Isuzu", model: "NMR" },
    destination: { iata_code: "DAD", city_name: "Da Nang", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  },
  {
    key: "04",
    customer: {
      code: `${TAG}-C04`,
      name: `${TAG} Khách hàng Delta`,
      customer_type: "DIRECT_SHIPPER",
      tax_code: "0401234567",
      phone: "0901000004",
      email: "delta.sample@example.com",
      address: "12 Hai Bà Trưng, Cần Thơ",
    },
    shipper: { name: `${TAG} Shipper Delta`, code: `${TAG}-P-S04`, address: "KCN Trà Nóc" },
    consignee: { name: `${TAG} Consignee Delta`, code: `${TAG}-P-C04`, address: "Cảng Cái Cui" },
    commodity: { code: `${TAG}-G04`, name: `${TAG} Gạo xuất khẩu, loại A`, english_name: "Rice grade A", category: "Agriculture" },
    driver: { code: `${TAG}-D04`, full_name: `${TAG} Tài xế Dũng`, phone: "0911000004", license_number: "B2-DELTA-04" },
    vehicle: { plate_number: `${TAG}-65A00004`, plate_display: "65A-000.04", vehicle_type: "Truck", brand: "Hyundai", model: "HD120" },
    destination: { iata_code: "VCA", city_name: "Can Tho", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  },
  {
    key: "05",
    customer: {
      code: `${TAG}-C05`,
      name: `${TAG} Khách hàng Epsilon`,
      customer_type: "FORWARDER",
      tax_code: "0501234567",
      phone: "0901000005",
      email: "epsilon.sample@example.com",
      address: "99 Nguyễn Văn Linh, Hải Phòng",
    },
    shipper: { name: `${TAG} Shipper Epsilon`, code: `${TAG}-P-S05`, address: "KCN Đình Vũ" },
    consignee: { name: `${TAG} Consignee Epsilon`, code: `${TAG}-P-C05`, address: "Cảng Hải Phòng" },
    commodity: { code: `${TAG}-G05`, name: `${TAG} Hóa chất không nguy hiểm`, english_name: "Non-DG chemicals", category: "Chemical" },
    driver: { code: `${TAG}-D05`, full_name: `${TAG} Tài xế Em`, phone: "0911000005", license_number: "B2-EPS-05" },
    vehicle: { plate_number: `${TAG}-15A00005`, plate_display: "15A-000.05", vehicle_type: "Container", brand: "Howo", model: "A7" },
    destination: { iata_code: "HPH", city_name: "Hai Phong", country_code: "VN", country_name: "Vietnam", region: "Asia", timezone: "Asia/Ho_Chi_Minh" },
  },
];

function fail(label, error) {
  console.error(`FAIL ${label}:`, error?.message ?? error);
  process.exit(1);
}

async function upsertBy(table, matchColumn, row, conflict) {
  // Prefer find-then-insert/update to avoid unique conflicts on codes.
  const { data: existing, error: findError } = await supabase
    .from(table)
    .select("*")
    .eq(matchColumn, row[matchColumn])
    .maybeSingle();
  if (findError) fail(`${table}.find`, findError);

  if (existing) {
    const { data, error } = await supabase
      .from(table)
      .update({ ...row, status: "ACTIVE" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) fail(`${table}.update`, error);
    return data;
  }

  const { data, error } = await supabase
    .from(table)
    .insert({ ...row, status: "ACTIVE" })
    .select()
    .single();
  if (error) fail(`${table}.insert${conflict ? `:${conflict}` : ""}`, error);
  return data;
}

async function linkParty(customerId, partyId, role, destinationId, isDefault) {
  const { data: existing } = await supabase
    .from("customer_parties")
    .select("*")
    .eq("customer_id", customerId)
    .eq("party_id", partyId)
    .eq("role", role)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("customer_parties")
      .update({
        destination_id: destinationId,
        is_default: isDefault,
        status: "ACTIVE",
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) fail("customer_parties.update", error);
    return data;
  }

  const { data, error } = await supabase
    .from("customer_parties")
    .insert({
      customer_id: customerId,
      party_id: partyId,
      role,
      destination_id: destinationId,
      is_default: isDefault,
      status: "ACTIVE",
    })
    .select()
    .single();
  if (error) fail("customer_parties.insert", error);
  return data;
}

async function linkCommodity(customerId, commodityId, description, isDefault) {
  const { data: existing } = await supabase
    .from("customer_commodities")
    .select("*")
    .eq("customer_id", customerId)
    .eq("commodity_id", commodityId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("customer_commodities")
      .update({
        custom_description: description,
        is_default: isDefault,
        status: "ACTIVE",
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) fail("customer_commodities.update", error);
    return data;
  }

  const { data, error } = await supabase
    .from("customer_commodities")
    .insert({
      customer_id: customerId,
      commodity_id: commodityId,
      custom_description: description,
      is_default: isDefault,
      status: "ACTIVE",
    })
    .select()
    .single();
  if (error) fail("customer_commodities.insert", error);
  return data;
}

async function linkDriver(customerId, driverId, isDefault) {
  const { data: existing } = await supabase
    .from("customer_drivers")
    .select("*")
    .eq("customer_id", customerId)
    .eq("driver_id", driverId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("customer_drivers")
      .update({ is_default: isDefault, status: "ACTIVE" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) fail("customer_drivers.update", error);
    return data;
  }

  const { data, error } = await supabase
    .from("customer_drivers")
    .insert({
      customer_id: customerId,
      driver_id: driverId,
      is_default: isDefault,
      status: "ACTIVE",
    })
    .select()
    .single();
  if (error) fail("customer_drivers.insert", error);
  return data;
}

async function linkVehicle(customerId, vehicleId, isDefault) {
  const { data: existing } = await supabase
    .from("customer_vehicles")
    .select("*")
    .eq("customer_id", customerId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("customer_vehicles")
      .update({ is_default: isDefault, status: "ACTIVE" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) fail("customer_vehicles.update", error);
    return data;
  }

  const { data, error } = await supabase
    .from("customer_vehicles")
    .insert({
      customer_id: customerId,
      vehicle_id: vehicleId,
      is_default: isDefault,
      status: "ACTIVE",
    })
    .select()
    .single();
  if (error) fail("customer_vehicles.insert", error);
  return data;
}

async function linkDriverVehicle(driverId, vehicleId, isPreferred) {
  const { data: existing } = await supabase
    .from("driver_vehicles")
    .select("*")
    .eq("driver_id", driverId)
    .eq("vehicle_id", vehicleId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("driver_vehicles")
      .update({ is_preferred: isPreferred, status: "ACTIVE" })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) fail("driver_vehicles.update", error);
    return data;
  }

  const { data, error } = await supabase
    .from("driver_vehicles")
    .insert({
      driver_id: driverId,
      vehicle_id: vehicleId,
      is_preferred: isPreferred,
      status: "ACTIVE",
    })
    .select()
    .single();
  if (error) fail("driver_vehicles.insert", error);
  return data;
}

const summary = [];

for (const sample of samples) {
  const destination = await upsertBy("destinations", "iata_code", {
    iata_code: sample.destination.iata_code,
    city_name: sample.destination.city_name,
    country_code: sample.destination.country_code,
    country_name: sample.destination.country_name,
    region: sample.destination.region,
    timezone: sample.destination.timezone,
  });

  const customer = await upsertBy("customers", "code", sample.customer);
  const shipper = await upsertBy("parties", "code", sample.shipper);
  const consignee = await upsertBy("parties", "code", sample.consignee);
  const commodity = await upsertBy("commodities", "code", {
    ...sample.commodity,
    is_dg: false,
    contains_battery: false,
    is_liquid: false,
  });
  const driver = await upsertBy("drivers", "code", sample.driver);
  const vehicle = await upsertBy("vehicles", "plate_number", sample.vehicle);

  await linkParty(customer.id, shipper.id, "SHIPPER", null, true);
  await linkParty(customer.id, consignee.id, "CONSIGNEE", destination.id, true);
  await linkCommodity(
    customer.id,
    commodity.id,
    `Mô tả riêng mẫu ${sample.key}: ${sample.commodity.name}`,
    true,
  );
  await linkDriver(customer.id, driver.id, true);
  await linkVehicle(customer.id, vehicle.id, true);
  await linkDriverVehicle(driver.id, vehicle.id, true);

  summary.push({
    key: sample.key,
    customer: customer.code,
    shipper: shipper.code,
    consignee: consignee.code,
    commodity: commodity.code,
    driver: driver.full_name,
    vehicle: vehicle.plate_display ?? vehicle.plate_number,
    destination: destination.iata_code,
  });
}

console.log(JSON.stringify({ ok: true, tag: TAG, count: summary.length, samples: summary }, null, 2));
console.log(`\nTìm trong app bằng search: "${TAG}"`);
console.log("Test gợi ý:");
console.log("1. Customers → Sửa / mở detail → tab Shippers, Consignees, Commodities, Drivers, Vehicles");
console.log("2. Commodities → Sửa mã/tên");
console.log("3. Driver ↔ Vehicle → Sửa assignment");
console.log("4. Destinations → Sửa IATA (SGN/HAN/...)");
console.log("5. Export CSV / Duplicate Center search theo TAG");
