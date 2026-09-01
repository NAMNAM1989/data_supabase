import { z } from "zod";

import { normalizePlateNumber } from "@/lib/normalization";

import { RECORD_STATUSES } from "@/lib/validation/customer";

export const vehicleSchema = z.object({
  plate_number: z
    .string()
    .trim()
    .min(1, "Biển số là bắt buộc")
    .transform(normalizePlateNumber),
  plate_display: z.string().trim().optional().or(z.literal("")),
  vehicle_type: z.string().trim().optional().or(z.literal("")),
  brand: z.string().trim().optional().or(z.literal("")),
  model: z.string().trim().optional().or(z.literal("")),
  payload_kg: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return null;
      const n = typeof v === "number" ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    }),
  status: z.enum(RECORD_STATUSES).default("ACTIVE"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const vehicleUpdateSchema = vehicleSchema.partial().extend({
  plate_number: vehicleSchema.shape.plate_number.optional(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>;
