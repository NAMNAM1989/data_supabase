import { z } from "zod";

import { RECORD_STATUSES } from "@/lib/validation/customer";

export function normalizeAirlineIata(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeAwbPrefix(value: string) {
  return value.trim();
}

export const airlineSchema = z.object({
  iata_code: z
    .string()
    .trim()
    .min(1, "Mã IATA là bắt buộc")
    .transform(normalizeAirlineIata)
    .refine((v) => /^[A-Z0-9]{2}$/.test(v), "Mã IATA phải có 2 ký tự"),
  name: z.string().trim().min(1, "Tên hãng bay là bắt buộc"),
  short_name: z.string().trim().optional().or(z.literal("")),
  icao_code: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v.toUpperCase() : ""))
    .refine((v) => !v || /^[A-Z]{3}$/.test(v), "ICAO phải có 3 chữ cái"),
  awb_prefix: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? normalizeAwbPrefix(v) : ""))
    .refine((v) => !v || /^[0-9]{3}$/.test(v), "AWB prefix phải có 3 chữ số"),
  country_code: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v.toUpperCase() : "")),
  is_cargo_only: z.boolean().default(false),
  notes: z.string().trim().optional().or(z.literal("")),
  status: z.enum(RECORD_STATUSES).default("ACTIVE"),
});

export const airlineUpdateSchema = airlineSchema.partial().extend({
  iata_code: airlineSchema.shape.iata_code.optional(),
  name: airlineSchema.shape.name.optional(),
});

export type AirlineInput = z.infer<typeof airlineSchema>;
export type AirlineUpdateInput = z.infer<typeof airlineUpdateSchema>;
