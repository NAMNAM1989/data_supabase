"use server";

import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/login";

export type LoginState = {
  error?: string;
  redirectTo?: string;
};

function safeRedirectPath(value: FormDataEntryValue | null | undefined) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw === "/") return "/dashboard";
  return raw;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }

  // Không dùng redirect() với useActionState — gây lỗi
  // "An unexpected response was received from the server".
  return { redirectTo: safeRedirectPath(formData.get("redirect")) };
}
