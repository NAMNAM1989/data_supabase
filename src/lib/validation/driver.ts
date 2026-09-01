import { z } from "zod";

import { normalizePhone } from "@/lib/normalization";

import { RECORD_STATUSES } from "@/lib/validation/customer";

export const driverSchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  full_name: z.string().trim().min(1, "Tên tài xế là bắt buộc"),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? normalizePhone(v) : "")),
  document_type: z.string().trim().optional().or(z.literal("")),
  document_number: z.string().trim().optional().or(z.literal("")),
  license_number: z.string().trim().optional().or(z.literal("")),
  license_class: z.string().trim().optional().or(z.literal("")),
  license_expiry: z.string().trim().optional().or(z.literal("")),
  status: z.enum(RECORD_STATUSES).default("ACTIVE"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const driverUpdateSchema = driverSchema.partial().extend({
  full_name: driverSchema.shape.full_name.optional(),
});

export type DriverInput = z.infer<typeof driverSchema>;
export type DriverUpdateInput = z.infer<typeof driverUpdateSchema>;
