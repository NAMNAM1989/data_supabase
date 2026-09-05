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

export function mapSupabaseError(error: PostgrestError | { code?: string; message?: string; details?: string; hint?: string }): AppError {
  const code = error?.code;
  const message = error?.message ?? "";
  const details = error?.details ?? "";
  const hint = error?.hint ?? "";

  console.error("[supabase]", {
    code: code || "(none)",
    message: message || "(empty)",
    details: details || undefined,
    hint: hint || undefined,
  });

  if (code === "23505") {
    const blob = `${message} ${details}`;
    if (blob.includes("destinations_iata_code")) {
      return new AppError("DUPLICATE", "Mã IATA đã tồn tại");
    }
    if (blob.includes("commodities_code")) {
      return new AppError("DUPLICATE", "Mã commodity đã tồn tại");
    }
    if (blob.includes("customers_code")) {
      return new AppError("DUPLICATE", "Mã customer đã tồn tại");
    }
    if (blob.includes("parties_code") || blob.includes("parties_tax_code")) {
      return new AppError("DUPLICATE", "Mã party / MST đã tồn tại");
    }
    if (blob.includes("vehicles_plate") || blob.includes("plate_number")) {
      return new AppError("DUPLICATE", "Biển số xe đã tồn tại");
    }
    return new AppError("DUPLICATE", "Dữ liệu đã tồn tại");
  }
  if (code === "23503") {
    return new AppError("FOREIGN_KEY", "Không thể thực hiện — dữ liệu đang được sử dụng");
  }
  if (code === "42501" || message.toLowerCase().includes("permission")) {
    return new AppError("PERMISSION", "Bạn không có quyền thực hiện thao tác này");
  }
  return new AppError("UNKNOWN", "Đã xảy ra lỗi. Vui lòng thử lại");
}

export type Supabase = SupabaseClient<Database>;
