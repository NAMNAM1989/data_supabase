"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/master-data/audit";
import {
  archiveDriver,
  assignVehicle,
  createDriver,
  restoreDriver,
  setPreferredDriverVehicle,
  unassignVehicle,
  updateDriver,
  updateDriverVehicle,
} from "@/lib/master-data/drivers";
import { hardDeleteByIds } from "@/lib/master-data/hard-delete";
import { createClient } from "@/lib/supabase/server";
import { driverSchema, driverUpdateSchema } from "@/lib/validation/driver";
import {
  assignDriverVehicleSchema,
  updateDriverVehicleSchema,
} from "@/lib/validation/transport-relations";
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

async function requireDelete() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "delete")) {
    throw new AppError("PERMISSION", "Bạn không có quyền xóa");
  }
  return session;
}

export async function createDriverAction(input: unknown) {
  const session = await requireWrite();
  const parsed = driverSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const driver = await createDriver(supabase, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "drivers",
      recordId: driver.id,
      newData: driver as unknown as Json,
    });
    revalidatePath("/drivers");
    return { data: driver };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo driver",
    };
  }
}

export async function updateDriverAction(id: string, input: unknown) {
  const session = await requireWrite();
  const parsed = driverUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const driver = await updateDriver(supabase, id, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "drivers",
      recordId: id,
      newData: driver as unknown as Json,
    });
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    return { data: driver };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật driver",
    };
  }
}

export async function archiveDriverAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const driver = await archiveDriver(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "ARCHIVE",
      tableName: "drivers",
      recordId: id,
      newData: driver as unknown as Json,
    });
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    return { data: driver };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể archive driver",
    };
  }
}

export async function restoreDriverAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const driver = await restoreDriver(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "RESTORE",
      tableName: "drivers",
      recordId: id,
      newData: driver as unknown as Json,
    });
    revalidatePath("/drivers");
    revalidatePath(`/drivers/${id}`);
    return { data: driver };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể restore driver",
    };
  }
}

export async function deleteDriversAction(ids: string[]) {
  const session = await requireDelete();
  const supabase = await createClient();
  try {
    const rows = await hardDeleteByIds(supabase, "drivers", ids);
    for (const row of rows) {
      await writeAuditLog(supabase, {
        actorUserId: session.userId,
        action: "DELETE",
        tableName: "drivers",
        recordId: row.id,
        oldData: row as unknown as Json,
      });
      revalidatePath(`/drivers/${row.id}`);
    }
    revalidatePath("/drivers");
    return { data: { deleted: rows.length } };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể xóa driver",
    };
  }
}

export async function assignVehicleAction(input: unknown) {
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
      error: error instanceof AppError ? error.message : "Không thể gán xe",
    };
  }
}

export async function unassignVehicleAction(
  relationId: string,
  driverId: string,
  vehicleId: string,
) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await unassignVehicle(supabase, relationId);
    revalidatePath("/driver-vehicles");
    revalidatePath(`/drivers/${driverId}`);
    revalidatePath(`/vehicles/${vehicleId}`);
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể gỡ gán xe",
    };
  }
}

export async function setPreferredVehicleAction(relationId: string, driverId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await setPreferredDriverVehicle(supabase, relationId);
    revalidatePath("/driver-vehicles");
    revalidatePath(`/drivers/${driverId}`);
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể đặt xe ưu tiên",
    };
  }
}

export async function updateDriverVehicleAction(input: unknown) {
  const session = await requireWrite();
  const parsed = updateDriverVehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const result = await updateDriverVehicle(supabase, parsed.data.relation_id, {
      driver_id: parsed.data.driver_id,
      vehicle_id: parsed.data.vehicle_id,
      is_preferred: parsed.data.is_preferred,
    });
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "driver_vehicles",
      recordId: parsed.data.relation_id,
      oldData: result.before as unknown as Json,
      newData: result.after as unknown as Json,
    });
    revalidatePath("/driver-vehicles");
    revalidatePath(`/drivers/${result.after.driver_id}`);
    revalidatePath(`/vehicles/${result.after.vehicle_id}`);
    if (result.before.driver_id !== result.after.driver_id) {
      revalidatePath(`/drivers/${result.before.driver_id}`);
    }
    if (result.before.vehicle_id !== result.after.vehicle_id) {
      revalidatePath(`/vehicles/${result.before.vehicle_id}`);
    }
    return { data: result.after };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật assignment",
    };
  }
}
