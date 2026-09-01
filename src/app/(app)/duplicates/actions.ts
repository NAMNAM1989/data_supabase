"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { scanDuplicateGroups } from "@/lib/duplicates/scan";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";

export async function scanDuplicatesAction() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "read")) {
    return { error: "Bạn không có quyền xem duplicate center" };
  }

  const supabase = await createClient();
  try {
    const groups = await scanDuplicateGroups(supabase);
    return { data: groups };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể quét duplicates",
    };
  }
}

const dismissSchema = z.object({
  entity: z.string(),
  matchKey: z.string(),
});

export async function dismissDuplicateGroupAction(input: unknown) {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "merge_duplicates")) {
    return { error: "Chỉ ADMIN mới có thể dismiss duplicate group" };
  }

  const parsed = dismissSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Dữ liệu không hợp lệ" };
  }

  // V1: dismiss is client-side only; server acknowledges for future persistence
  revalidatePath("/duplicates");
  return { data: { dismissed: true, ...parsed.data } };
}
