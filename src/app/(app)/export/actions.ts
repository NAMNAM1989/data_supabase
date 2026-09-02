"use server";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { csvFilename, toCsvWithBom } from "@/lib/csv";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function exportCustomersCsvAction() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "export")) {
    return { error: "Bạn không có quyền export" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, code, name, customer_type, tax_code, phone, email, address, status")
    .order("code");

  if (error) {
    return { error: new AppError("UNKNOWN", "Không thể export customers").message };
  }

  const headers = ["id", "code", "name", "customer_type", "tax_code", "phone", "email", "address", "status"];
  return {
    data: {
      filename: csvFilename("customers"),
      content: toCsvWithBom(headers, data ?? []),
    },
  };
}

export async function exportDriversCsvAction() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "export")) {
    return { error: "Bạn không có quyền export" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("drivers")
    .select("id, code, full_name, phone, document_number, license_number, status")
    .order("full_name");

  if (error) {
    return { error: new AppError("UNKNOWN", "Không thể export drivers").message };
  }

  const headers = ["id", "code", "full_name", "phone", "document_number", "license_number", "status"];
  return {
    data: {
      filename: csvFilename("drivers"),
      content: toCsvWithBom(headers, data ?? []),
    },
  };
}

export async function exportVehiclesCsvAction() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "export")) {
    return { error: "Bạn không có quyền export" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, plate_number, plate_display, vehicle_type, brand, model, status")
    .order("plate_number");

  if (error) {
    return { error: new AppError("UNKNOWN", "Không thể export vehicles").message };
  }

  const headers = ["id", "plate_number", "plate_display", "vehicle_type", "brand", "model", "status"];
  return {
    data: {
      filename: csvFilename("vehicles"),
      content: toCsvWithBom(headers, data ?? []),
    },
  };
}
