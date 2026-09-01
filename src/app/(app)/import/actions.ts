"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { buildImportPreview, summarizePreview } from "@/lib/import/preview";
import type { ImportCommitResult, ImportEntityType } from "@/lib/import/types";
import { writeAuditLog } from "@/lib/master-data/audit";
import { createCommodity, updateCommodity } from "@/lib/master-data/commodities";
import { createCustomer, updateCustomer } from "@/lib/master-data/customers";
import { createDriver, updateDriver } from "@/lib/master-data/drivers";
import { createParty } from "@/lib/master-data/parties";
import { createVehicle, updateVehicle } from "@/lib/master-data/vehicles";
import { AppError } from "@/lib/errors";
import { normalizeCustomerCode, normalizePlateNumber } from "@/lib/normalization";
import { createClient } from "@/lib/supabase/server";
import { CUSTOMER_TYPES } from "@/lib/validation/customer";
import type { Json } from "@/types/database";

async function requireImport() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "import")) {
    throw new AppError("PERMISSION", "Bạn không có quyền import");
  }
  return session;
}

const previewSchema = z.object({
  entity: z.enum(["customers", "parties", "drivers", "vehicles", "commodities"]),
  rows: z.array(z.record(z.string(), z.string())),
});

async function loadExistingMatches(entity: ImportEntityType) {
  const supabase = await createClient();
  const matches: Parameters<typeof buildImportPreview>[2] = {};

  if (entity === "customers" || entity === "parties") {
    const { data } = await supabase.from("customers").select("id, code, name");
    matches.customersByCode = new Map(
      (data ?? []).map((row) => [normalizeCustomerCode(row.code), { id: row.id, label: `${row.code} — ${row.name}` }]),
    );
  }

  if (entity === "drivers") {
    const { data } = await supabase.from("drivers").select("id, code, full_name, document_number");
    matches.driversByDocument = new Map(
      (data ?? [])
        .filter((row) => row.document_number)
        .map((row) => [row.document_number!, { id: row.id, label: row.full_name }]),
    );
    matches.driversByCode = new Map(
      (data ?? [])
        .filter((row) => row.code)
        .map((row) => [row.code!, { id: row.id, label: row.full_name }]),
    );
  }

  if (entity === "vehicles") {
    const { data } = await supabase.from("vehicles").select("id, plate_number, plate_display");
    matches.vehiclesByPlate = new Map(
      (data ?? []).map((row) => [
        normalizePlateNumber(row.plate_number),
        { id: row.id, label: row.plate_display ?? row.plate_number },
      ]),
    );
  }

  if (entity === "commodities") {
    const { data } = await supabase.from("commodities").select("id, code, name");
    matches.commoditiesByCode = new Map(
      (data ?? [])
        .filter((row) => row.code)
        .map((row) => [row.code!.toUpperCase(), { id: row.id, label: row.name }]),
    );
  }

  return matches;
}

export async function previewImportAction(input: unknown) {
  try {
    await requireImport();
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "Không có quyền" };
  }

  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    const existing = await loadExistingMatches(parsed.data.entity);
    const rows = buildImportPreview(parsed.data.entity, parsed.data.rows, existing);
    const summary = summarizePreview(rows);
    return {
      data: {
        entity: parsed.data.entity,
        ...summary,
        rows,
      },
    };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo preview",
    };
  }
}

const commitSchema = z.object({
  entity: z.enum(["customers", "parties", "drivers", "vehicles", "commodities"]),
  rows: z.array(
    z.object({
      rowNumber: z.number(),
      action: z.enum(["create", "skip", "update"]),
      data: z.record(z.string(), z.string()),
      matchId: z.string().uuid().optional(),
    }),
  ),
});

export async function commitImportAction(input: unknown) {
  let session;
  try {
    session = await requireImport();
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "Không có quyền" };
  }

  const parsed = commitSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const result: ImportCommitResult = { created: 0, updated: 0, skipped: 0, errors: [] };

  for (const row of parsed.data.rows) {
    if (row.action === "skip") {
      result.skipped += 1;
      continue;
    }

    try {
      if (parsed.data.entity === "customers") {
        const payload = {
          code: row.data.code,
          name: row.data.name,
          short_name: "",
          customer_type: CUSTOMER_TYPES.includes(row.data.customer_type as (typeof CUSTOMER_TYPES)[number])
            ? (row.data.customer_type as (typeof CUSTOMER_TYPES)[number])
            : "OTHER",
          tax_code: row.data.tax_code,
          phone: row.data.phone,
          email: row.data.email,
          address: row.data.address,
          notes: row.data.notes,
          status: "ACTIVE" as const,
        };

        if (row.action === "update" && row.matchId) {
          const updated = await updateCustomer(supabase, row.matchId, payload);
          await writeAuditLog(supabase, {
            actorUserId: session.userId,
            action: "IMPORT",
            tableName: "customers",
            recordId: row.matchId,
            newData: updated as unknown as Json,
          });
          result.updated += 1;
        } else {
          const created = await createCustomer(supabase, payload);
          await writeAuditLog(supabase, {
            actorUserId: session.userId,
            action: "IMPORT",
            tableName: "customers",
            recordId: created.id,
            newData: created as unknown as Json,
          });
          result.created += 1;
        }
      }

      if (parsed.data.entity === "parties") {
        const created = await createParty(supabase, {
          name: row.data.name,
          code: row.data.code,
          tax_code: row.data.tax_code,
          address: row.data.address,
          city: "",
          state: "",
          postal_code: "",
          country_code: "",
          phone: row.data.phone,
          email: row.data.email,
          status: "ACTIVE",
          notes: "",
        });
        await writeAuditLog(supabase, {
          actorUserId: session.userId,
          action: "IMPORT",
          tableName: "parties",
          recordId: created.id,
          newData: created as unknown as Json,
        });
        result.created += 1;
      }

      if (parsed.data.entity === "drivers") {
        const payload = {
          full_name: row.data.full_name,
          code: row.data.code,
          phone: row.data.phone,
          document_number: row.data.document_number,
          license_number: row.data.license_number,
          notes: row.data.notes,
          status: "ACTIVE" as const,
        };

        if (row.action === "update" && row.matchId) {
          const updated = await updateDriver(supabase, row.matchId, payload);
          await writeAuditLog(supabase, {
            actorUserId: session.userId,
            action: "IMPORT",
            tableName: "drivers",
            recordId: row.matchId,
            newData: updated as unknown as Json,
          });
          result.updated += 1;
        } else {
          const created = await createDriver(supabase, payload);
          await writeAuditLog(supabase, {
            actorUserId: session.userId,
            action: "IMPORT",
            tableName: "drivers",
            recordId: created.id,
            newData: created as unknown as Json,
          });
          result.created += 1;
        }
      }

      if (parsed.data.entity === "vehicles") {
        const payload = {
          plate_number: row.data.plate_number,
          plate_display: row.data.plate_display,
          vehicle_type: row.data.vehicle_type,
          brand: row.data.brand,
          model: row.data.model,
          payload_kg: null,
          notes: row.data.notes,
          status: "ACTIVE" as const,
        };

        if (row.action === "update" && row.matchId) {
          const updated = await updateVehicle(supabase, row.matchId, payload);
          await writeAuditLog(supabase, {
            actorUserId: session.userId,
            action: "IMPORT",
            tableName: "vehicles",
            recordId: row.matchId,
            newData: updated as unknown as Json,
          });
          result.updated += 1;
        } else {
          const created = await createVehicle(supabase, payload);
          await writeAuditLog(supabase, {
            actorUserId: session.userId,
            action: "IMPORT",
            tableName: "vehicles",
            recordId: created.id,
            newData: created as unknown as Json,
          });
          result.created += 1;
        }
      }

      if (parsed.data.entity === "commodities") {
        const payload = {
          name: row.data.name,
          code: row.data.code,
          english_name: row.data.english_name,
          category: row.data.category,
          notes: row.data.notes,
          status: "ACTIVE" as const,
          is_dg: false,
          contains_battery: false,
          is_liquid: false,
        };

        if (row.action === "update" && row.matchId) {
          await updateCommodity(supabase, row.matchId, payload);
          result.updated += 1;
        } else {
          const created = await createCommodity(supabase, payload);
          await writeAuditLog(supabase, {
            actorUserId: session.userId,
            action: "IMPORT",
            tableName: "commodities",
            recordId: created.id,
            newData: created as unknown as Json,
          });
          result.created += 1;
        }
      }
    } catch (error) {
      result.errors.push({
        rowNumber: row.rowNumber,
        message: error instanceof AppError ? error.message : "Lỗi không xác định",
      });
    }
  }

  revalidatePath("/import");
  revalidatePath("/dashboard");
  revalidatePath(`/${parsed.data.entity}`);

  return { data: result };
}
