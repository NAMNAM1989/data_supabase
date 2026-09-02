"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/master-data/audit";
import {
  createCommodity,
  getCommodityById,
  updateCommodity,
} from "@/lib/master-data/commodities";
import { createClient } from "@/lib/supabase/server";
import { commoditySchema, commodityUpdateSchema } from "@/lib/validation/commodity";
import type { Json } from "@/types/database";

async function requireWrite() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "create")) {
    throw new AppError("PERMISSION", "Bạn không có quyền thực hiện thao tác này");
  }
  return session;
}

export async function createCommodityAction(input: unknown) {
  const session = await requireWrite();
  const parsed = commoditySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const commodity = await createCommodity(supabase, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "commodities",
      recordId: commodity.id,
      newData: commodity as unknown as Json,
    });
    revalidatePath("/commodities");
    return { data: commodity };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo commodity",
    };
  }
}

export async function updateCommodityAction(id: string, input: unknown) {
  const session = await requireWrite();
  const parsed = commodityUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const oldData = await getCommodityById(supabase, id);
    const commodity = await updateCommodity(supabase, id, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "commodities",
      recordId: id,
      oldData: oldData as unknown as Json,
      newData: commodity as unknown as Json,
    });
    revalidatePath("/commodities");
    return { data: commodity };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật commodity",
    };
  }
}
