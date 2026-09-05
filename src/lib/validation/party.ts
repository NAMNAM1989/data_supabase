import { z } from "zod";

import { normalizeEmail, normalizePhone } from "@/lib/normalization";
import { RECORD_STATUSES } from "@/lib/validation/customer";
import { optionalText, requiredText } from "@/lib/validation/helpers";

export const partySchema = z.object({
  code: optionalText(),
  name: requiredText("Tên party là bắt buộc"),
  tax_code: optionalText(),
  address: optionalText(),
  branch_name: optionalText(),
  contact_person: optionalText(),
  contact_phone: optionalText().transform((v) => (v ? normalizePhone(v) : "")),
  city: optionalText(),
  state: optionalText(),
  postal_code: optionalText(),
  country_code: optionalText(),
  country_name: optionalText(),
  phone: optionalText().transform((v) => (v ? normalizePhone(v) : "")),
  fax: optionalText(),
  email: optionalText()
    .refine((v) => !v || z.string().email().safeParse(v).success, "Email không hợp lệ")
    .transform((v) => (v ? normalizeEmail(v) : "")),
  handling_instructions: optionalText(),
  status: z.enum(RECORD_STATUSES).default("ACTIVE"),
  notes: optionalText(),
});

export const partyUpdateSchema = partySchema.partial().extend({
  name: requiredText("Tên party là bắt buộc").optional(),
});

export type PartyInput = z.infer<typeof partySchema>;
export type PartyUpdateInput = z.infer<typeof partyUpdateSchema>;
