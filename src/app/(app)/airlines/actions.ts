"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import {
  archiveAirline,
  createAirline,
  restoreAirline,
  updateAirline,
} from "@/lib/master-data/airlines";
import { writeAuditLog } from "@/lib/master-data/audit";
import { hardDeleteByIds } from "@/lib/master-data/hard-delete";
import { createClient } from "@/lib/supabase/server";
import { airlineSchema, airlineUpdateSchema } from "@/lib/validation/airline";
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

export async function createAirlineAction(input: unknown) {
  const session = await requireWrite();
  const parsed = airlineSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const airline = await createAirline(supabase, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "airlines",
      recordId: airline.id,
      newData: airline as unknown as Json,
    });
    revalidatePath("/airlines");
    return { data: airline };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo airline",
    };
  }
}

export async function updateAirlineAction(id: string, input: unknown) {
  const session = await requireWrite();
  const parsed = airlineUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const airline = await updateAirline(supabase, id, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "airlines",
      recordId: id,
      newData: airline as unknown as Json,
    });
    revalidatePath("/airlines");
    return { data: airline };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật airline",
    };
  }
}

export async function archiveAirlineAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const airline = await archiveAirline(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "ARCHIVE",
      tableName: "airlines",
      recordId: id,
      newData: airline as unknown as Json,
    });
    revalidatePath("/airlines");
    return { data: airline };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể archive airline",
    };
  }
}

export async function restoreAirlineAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const airline = await restoreAirline(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "RESTORE",
      tableName: "airlines",
      recordId: id,
      newData: airline as unknown as Json,
    });
    revalidatePath("/airlines");
    return { data: airline };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể restore airline",
    };
  }
}

export async function deleteAirlinesAction(ids: string[]) {
  const session = await requireDelete();
  const supabase = await createClient();
  try {
    const rows = await hardDeleteByIds(supabase, "airlines", ids);
    for (const row of rows) {
      await writeAuditLog(supabase, {
        actorUserId: session.userId,
        action: "DELETE",
        tableName: "airlines",
        recordId: row.id,
        oldData: row as unknown as Json,
      });
    }
    revalidatePath("/airlines");
    return { data: { deleted: rows.length } };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể xóa airline",
    };
  }
}
