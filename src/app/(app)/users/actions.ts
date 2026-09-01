"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/master-data/audit";
import {
  createAuthUser,
  listUsersWithProfiles,
  updateProfile,
} from "@/lib/master-data/users";
import { AppError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { createUserSchema, updateProfileSchema } from "@/lib/validation/user";
import type { Json } from "@/types/database";

async function requireManageUsers() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "manage_users")) {
    throw new AppError("PERMISSION", "Chỉ ADMIN mới quản lý users");
  }
  return session;
}

export async function listUsersAction() {
  try {
    await requireManageUsers();
    const users = await listUsersWithProfiles();
    return { data: users };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tải users",
    };
  }
}

export async function createUserAction(input: unknown) {
  let session;
  try {
    session = await requireManageUsers();
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "Không có quyền" };
  }

  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    const user = await createAuthUser({
      email: parsed.data.email,
      password: parsed.data.password,
      display_name: parsed.data.display_name,
      role: parsed.data.role,
    });

    const supabase = await createClient();
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "profiles",
      recordId: user.id,
      newData: {
        email: parsed.data.email,
        role: parsed.data.role,
        display_name: parsed.data.display_name ?? null,
      } as Json,
    });

    revalidatePath("/users");
    return { data: { id: user.id, email: user.email } };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo user",
    };
  }
}

export async function updateUserAction(userId: string, input: unknown) {
  let session;
  try {
    session = await requireManageUsers();
  } catch (error) {
    return { error: error instanceof AppError ? error.message : "Không có quyền" };
  }

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  if (userId === session.userId && parsed.data.role && parsed.data.role !== session.profile?.role) {
    return { error: "Không thể tự đổi role của chính mình" };
  }

  if (userId === session.userId && parsed.data.status && parsed.data.status !== "ACTIVE") {
    return { error: "Không thể tự vô hiệu hóa tài khoản của chính mình" };
  }

  try {
    const profile = await updateProfile(userId, parsed.data);

    const supabase = await createClient();
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "profiles",
      recordId: userId,
      newData: profile as unknown as Json,
    });

    revalidatePath("/users");
    revalidatePath("/settings");
    return { data: profile };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật user",
    };
  }
}
