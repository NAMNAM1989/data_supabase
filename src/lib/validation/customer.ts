import { z } from "zod";

import { normalizeCustomerCode, normalizeEmail, normalizePhone } from "@/lib/normalization";
import { optionalText, requiredText } from "@/lib/validation/helpers";

export const CUSTOMER_TYPES = [
  "FORWARDER",
  "DIRECT_SHIPPER",
  "AGENT",
  "OTHER",
] as const;

export const RECORD_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const customerSchema = z.object({
  code: requiredText("Mã khách hàng là bắt buộc").transform(normalizeCustomerCode),
  name: requiredText("Tên khách hàng là bắt buộc"),
  short_name: optionalText(),
  customer_type: z.enum(CUSTOMER_TYPES).optional().nullable(),
  tax_code: optionalText(),
  address: optionalText(),
  phone: optionalText().transform((v) => (v ? normalizePhone(v) : "")),
  email: optionalText()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Email không hợp lệ")
    .transform((v) => (v ? normalizeEmail(v) : "")),
  status: z.enum(RECORD_STATUSES).default("ACTIVE"),
  notes: optionalText(),
});

export const customerUpdateSchema = customerSchema.partial().extend({
  code: customerSchema.shape.code.optional(),
  name: customerSchema.shape.name.optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;
