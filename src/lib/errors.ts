import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type AppErrorCode =
  | "VALIDATION"
  | "DUPLICATE"
  | "FOREIGN_KEY"
  | "PERMISSION"
  | "NETWORK"
  | "UNKNOWN";

export class AppError extends Error {
  code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export function mapSupabaseError(error: PostgrestError): AppError {
  if (error.code === "23505") {
    return new AppError("DUPLICATE", "Dữ liệu đã tồn tại");
  }
  if (error.code === "23503") {
    return new AppError("FOREIGN_KEY", "Không thể thực hiện — dữ liệu đang được sử dụng");
  }
  if (error.code === "42501" || error.message.toLowerCase().includes("permission")) {
    return new AppError("PERMISSION", "Bạn không có quyền thực hiện thao tác này");
  }
  return new AppError("UNKNOWN", "Đã xảy ra lỗi. Vui lòng thử lại");
}

export type Supabase = SupabaseClient<Database>;
