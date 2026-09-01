import { z } from "zod";

import { APP_ROLES } from "@/types/auth";
import { RECORD_STATUSES } from "@/lib/validation/customer";

export const updateProfileSchema = z.object({
  display_name: z.string().trim().optional().or(z.literal("")),
  role: z.enum(APP_ROLES).optional(),
  status: z.enum(RECORD_STATUSES).optional(),
});

export const createUserSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự"),
  display_name: z.string().trim().optional().or(z.literal("")),
  role: z.enum(APP_ROLES).default("VIEWER"),
});

export const selfSettingsSchema = z.object({
  display_name: z.string().trim().min(1, "Tên hiển thị là bắt buộc"),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type SelfSettingsInput = z.infer<typeof selfSettingsSchema>;
