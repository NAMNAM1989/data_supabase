"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/master-data/audit";
import {
  archiveParty,
  createParty,
  restoreParty,
  updateParty,
} from "@/lib/master-data/parties";
import { createClient } from "@/lib/supabase/server";
import { partySchema, partyUpdateSchema } from "@/lib/validation/party";
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

export async function createPartyAction(input: unknown) {
  const session = await requireWrite();
  const parsed = partySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const party = await createParty(supabase, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "parties",
      recordId: party.id,
      newData: party as unknown as Json,
    });
    revalidatePath("/parties");
    return { data: party };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo party",
    };
  }
}

export async function updatePartyAction(id: string, input: unknown) {
  const session = await requireWrite();
  const parsed = partyUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const party = await updateParty(supabase, id, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "parties",
      recordId: id,
      newData: party as unknown as Json,
    });
    revalidatePath("/parties");
    revalidatePath(`/parties/${id}`);
    return { data: party };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật party",
    };
  }
}

export async function archivePartyAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const party = await archiveParty(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "ARCHIVE",
      tableName: "parties",
      recordId: id,
      newData: party as unknown as Json,
    });
    revalidatePath("/parties");
    revalidatePath(`/parties/${id}`);
    return { data: party };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể archive party",
    };
  }
}

export async function restorePartyAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const party = await restoreParty(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "RESTORE",
      tableName: "parties",
      recordId: id,
      newData: party as unknown as Json,
    });
    revalidatePath("/parties");
    revalidatePath(`/parties/${id}`);
    return { data: party };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể restore party",
    };
  }
}
