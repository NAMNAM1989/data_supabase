import { z } from "zod";

import { RECORD_STATUSES } from "@/lib/validation/customer";

export function normalizeIataCode(value: string) {
  return value.trim().toUpperCase();
}

export const destinationSchema = z.object({
  iata_code: z
    .string()
    .trim()
    .min(1, "Mã IATA là bắt buộc")
    .transform(normalizeIataCode)
    .refine((v) => /^[A-Z0-9]{3}$/.test(v), "Mã IATA phải có 3 ký tự"),
  city_name: z.string().trim().optional().or(z.literal("")),
  country_code: z.string().trim().optional().or(z.literal("")),
  country_name: z.string().trim().optional().or(z.literal("")),
  region: z.string().trim().optional().or(z.literal("")),
  timezone: z.string().trim().optional().or(z.literal("")),
  status: z.enum(RECORD_STATUSES).default("ACTIVE"),
});

export const destinationUpdateSchema = destinationSchema.partial().extend({
  iata_code: destinationSchema.shape.iata_code.optional(),
});

export type DestinationInput = z.infer<typeof destinationSchema>;
export type DestinationUpdateInput = z.infer<typeof destinationUpdateSchema>;
