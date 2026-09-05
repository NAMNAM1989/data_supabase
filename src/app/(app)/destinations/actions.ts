"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/master-data/audit";
import {
  archiveDestination,
  createDestination,
  restoreDestination,
  updateDestination,
} from "@/lib/master-data/destinations";
import { hardDeleteByIds } from "@/lib/master-data/hard-delete";
import { createClient } from "@/lib/supabase/server";
import { destinationSchema, destinationUpdateSchema } from "@/lib/validation/destination";
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

export async function createDestinationAction(input: unknown) {
  const session = await requireWrite();
  const parsed = destinationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const destination = await createDestination(supabase, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "destinations",
      recordId: destination.id,
      newData: destination as unknown as Json,
    });
    revalidatePath("/destinations");
    return { data: destination };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo destination",
    };
  }
}

export async function updateDestinationAction(id: string, input: unknown) {
  const session = await requireWrite();
  const parsed = destinationUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const destination = await updateDestination(supabase, id, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "destinations",
      recordId: id,
      newData: destination as unknown as Json,
    });
    revalidatePath("/destinations");
    return { data: destination };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật destination",
    };
  }
}

export async function archiveDestinationAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const destination = await archiveDestination(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "ARCHIVE",
      tableName: "destinations",
      recordId: id,
      newData: destination as unknown as Json,
    });
    revalidatePath("/destinations");
    return { data: destination };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể archive destination",
    };
  }
}

export async function restoreDestinationAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const destination = await restoreDestination(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "RESTORE",
      tableName: "destinations",
      recordId: id,
      newData: destination as unknown as Json,
    });
    revalidatePath("/destinations");
    return { data: destination };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể restore destination",
    };
  }
}

export async function deleteDestinationsAction(ids: string[]) {
  const session = await requireDelete();
  const supabase = await createClient();
  try {
    const rows = await hardDeleteByIds(supabase, "destinations", ids);
    for (const row of rows) {
      await writeAuditLog(supabase, {
        actorUserId: session.userId,
        action: "DELETE",
        tableName: "destinations",
        recordId: row.id,
        oldData: row as unknown as Json,
      });
    }
    revalidatePath("/destinations");
    return { data: { deleted: rows.length } };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể xóa destination",
    };
  }
}
