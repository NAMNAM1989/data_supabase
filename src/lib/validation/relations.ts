import { z } from "zod";

export const linkPartySchema = z.object({
  customer_id: z.string().uuid(),
  party_id: z.string().uuid().optional(),
  role: z.enum(["SHIPPER", "CONSIGNEE"]),
  destination_id: z.string().uuid().optional().nullable(),
  is_default: z.boolean().default(false),
  new_party: z
    .object({
      name: z.string().trim().min(1),
      address: z.string().trim().optional(),
      phone: z.string().trim().optional(),
      email: z.string().trim().optional(),
    })
    .optional(),
});

export const linkCommoditySchema = z.object({
  customer_id: z.string().uuid(),
  commodity_id: z.string().uuid().optional(),
  is_default: z.boolean().default(false),
  custom_description: z.string().trim().optional(),
  new_commodity: z
    .object({
      name: z.string().trim().min(1),
      code: z.string().trim().optional(),
    })
    .optional(),
});

export type LinkPartyInput = z.infer<typeof linkPartySchema>;
export type LinkCommodityInput = z.infer<typeof linkCommoditySchema>;
