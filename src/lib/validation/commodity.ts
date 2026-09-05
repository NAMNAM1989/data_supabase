import { z } from "zod";

import { RECORD_STATUSES } from "@/lib/validation/customer";

export const CARGO_TYPES = [
  "GENERAL",
  "PERISHABLE",
  "DANGEROUS_GOODS",
  "VALUABLE",
  "VULNERABLE",
  "LIVE_ANIMALS",
  "HEAVY_OUTSIZED",
  "PHARMA",
  "EXPRESS",
  "OTHER",
] as const;

export const DEFAULT_PACKAGINGS = [
  "CARTON",
  "WOODEN_CRATE",
  "PALLET",
  "PLASTIC_BOX",
  "DRUM",
  "BAG",
  "UNPACKED",
  "OTHER",
] as const;

export const commoditySchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Tên hàng là bắt buộc"),
  english_name: z.string().trim().optional().or(z.literal("")),
  hs_code: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
  cargo_type: z.enum(CARGO_TYPES).default("GENERAL"),
  special_handling_codes: z.array(z.string().trim().toUpperCase()).default([]),
  temperature_range: z.string().trim().optional().or(z.literal("")),
  un_number: z.string().trim().optional().or(z.literal("")),
  dg_class: z.string().trim().optional().or(z.literal("")),
  default_packaging: z.enum(DEFAULT_PACKAGINGS).default("CARTON"),
  is_dg: z.boolean().default(false),
  contains_battery: z.boolean().default(false),
  is_liquid: z.boolean().default(false),
  status: z.enum(RECORD_STATUSES).default("ACTIVE"),
  notes: z.string().trim().optional().or(z.literal("")),
});

export const commodityUpdateSchema = commoditySchema.partial().extend({
  name: commoditySchema.shape.name.optional(),
});

export type CommodityInput = z.infer<typeof commoditySchema>;
export type CommodityUpdateInput = z.infer<typeof commodityUpdateSchema>;
