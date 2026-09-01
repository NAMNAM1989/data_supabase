"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/master-data/audit";
import { updateSelfProfile } from "@/lib/master-data/users";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { selfSettingsSchema } from "@/lib/validation/user";
import type { Json } from "@/types/database";

export async function updateSelfSettingsAction(input: unknown) {
  const session = await getSession();
  if (!session?.profile) {
    return { error: "Bạn cần đăng nhập" };
  }

  const parsed = selfSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const profile = await updateSelfProfile(supabase, session.userId, parsed.data.display_name);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "profiles",
      recordId: session.userId,
      newData: { display_name: parsed.data.display_name } as Json,
    });

    revalidatePath("/settings");
    return { data: profile };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật settings",
    };
  }
}
