import { z } from "zod";

import { normalizePhone } from "@/lib/normalization";
import { optionalText } from "@/lib/validation/helpers";

const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null()])
  .transform((v) => (v === "" || v == null ? null : v));

export const customerEsidProfileSchema = z.object({
  default_agent_party_id: optionalUuid,
  default_notify_party_id: optionalUuid,
  default_origin_id: optionalUuid,
  default_payment_term: optionalText().default("Chuyển khoản/Transfer"),
  declarant_name: optionalText(),
  declarant_phone: optionalText().transform((v) => (v ? normalizePhone(v) : "")),
  declarant_id_number: optionalText(),
  default_is_consol: z.boolean().default(false),
  default_other_handling: z.boolean().default(true),
  notes: optionalText(),
});

export const customerEsidProfileUpdateSchema = customerEsidProfileSchema.partial();

export type CustomerEsidProfileInput = z.infer<typeof customerEsidProfileSchema>;
export type CustomerEsidProfileUpdateInput = z.infer<typeof customerEsidProfileUpdateSchema>;
