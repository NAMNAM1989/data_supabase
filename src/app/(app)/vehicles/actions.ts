"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/master-data/audit";
import { assignVehicle } from "@/lib/master-data/drivers";
import {
  archiveVehicle,
  createVehicle,
  restoreVehicle,
  updateVehicle,
} from "@/lib/master-data/vehicles";
import { createClient } from "@/lib/supabase/server";
import { assignDriverVehicleSchema } from "@/lib/validation/transport-relations";
import { vehicleSchema, vehicleUpdateSchema } from "@/lib/validation/vehicle";
import type { Json } from "@/types/database";

async function requireWrite() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "create")) {
    throw new AppError("PERMISSION", "Bạn không có quyền thực hiện thao tác này");
  }
  return session;
}

async function requireArchive() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "archive")) {
    throw new AppError("PERMISSION", "Bạn không có quyền archive/restore");
  }
  return session;
}

export async function createVehicleAction(input: unknown) {
  const session = await requireWrite();
  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const vehicle = await createVehicle(supabase, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "vehicles",
      recordId: vehicle.id,
      newData: vehicle as unknown as Json,
    });
    revalidatePath("/vehicles");
    return { data: vehicle };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo vehicle",
    };
  }
}

export async function updateVehicleAction(id: string, input: unknown) {
  const session = await requireWrite();
  const parsed = vehicleUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const vehicle = await updateVehicle(supabase, id, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "vehicles",
      recordId: id,
      newData: vehicle as unknown as Json,
    });
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    return { data: vehicle };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật vehicle",
    };
  }
}

export async function archiveVehicleAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const vehicle = await archiveVehicle(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "ARCHIVE",
      tableName: "vehicles",
      recordId: id,
      newData: vehicle as unknown as Json,
    });
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    return { data: vehicle };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể archive vehicle",
    };
  }
}

export async function restoreVehicleAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const vehicle = await restoreVehicle(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "RESTORE",
      tableName: "vehicles",
      recordId: id,
      newData: vehicle as unknown as Json,
    });
    revalidatePath("/vehicles");
    revalidatePath(`/vehicles/${id}`);
    return { data: vehicle };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể restore vehicle",
    };
  }
}

export async function assignDriverAction(input: unknown) {
  await requireWrite();
  const parsed = assignDriverVehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const relation = await assignVehicle(supabase, {
      driver_id: parsed.data.driver_id,
      vehicle_id: parsed.data.vehicle_id,
      is_preferred: parsed.data.is_preferred,
      valid_from: parsed.data.valid_from || null,
      valid_to: parsed.data.valid_to || null,
    });
    revalidatePath("/driver-vehicles");
    revalidatePath(`/drivers/${parsed.data.driver_id}`);
    revalidatePath(`/vehicles/${parsed.data.vehicle_id}`);
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể gán tài xế",
    };
  }
}
