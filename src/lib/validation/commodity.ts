import { z } from "zod";

import { RECORD_STATUSES } from "@/lib/validation/customer";

export const commoditySchema = z.object({
  code: z.string().trim().optional().or(z.literal("")),
  name: z.string().trim().min(1, "Tên hàng là bắt buộc"),
  english_name: z.string().trim().optional().or(z.literal("")),
  hs_code: z.string().trim().optional().or(z.literal("")),
  category: z.string().trim().optional().or(z.literal("")),
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
