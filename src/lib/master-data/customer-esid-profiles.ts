import { mapSupabaseError, type Supabase } from "@/lib/errors";
import type {
  CustomerEsidProfileInput,
  CustomerEsidProfileUpdateInput,
} from "@/lib/validation/customer-esid-profile";
import type { Tables } from "@/types/database";

export type CustomerEsidProfile = Tables<"customer_esid_profiles">;

function emptyToNull(value?: string | null) {
  if (value == null || value === "") return null;
  return value;
}

export async function getCustomerEsidProfile(supabase: Supabase, customerId: string) {
  const { data, error } = await supabase
    .from("customer_esid_profiles")
    .select("*")
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw mapSupabaseError(error);
  return data;
}

export async function upsertCustomerEsidProfile(
  supabase: Supabase,
  customerId: string,
  input: CustomerEsidProfileInput | CustomerEsidProfileUpdateInput,
) {
  const payload = {
    customer_id: customerId,
    default_agent_party_id: emptyToNull(input.default_agent_party_id),
    default_notify_party_id: emptyToNull(input.default_notify_party_id),
    default_origin_id: emptyToNull(input.default_origin_id),
    default_payment_term: input.default_payment_term || "Chuyển khoản/Transfer",
    declarant_name: emptyToNull(input.declarant_name),
    declarant_phone: emptyToNull(input.declarant_phone),
    declarant_id_number: emptyToNull(input.declarant_id_number),
    default_is_consol: input.default_is_consol ?? false,
    default_other_handling: input.default_other_handling ?? true,
    notes: emptyToNull(input.notes),
  };

  const { data, error } = await supabase
    .from("customer_esid_profiles")
    .upsert(payload, { onConflict: "customer_id" })
    .select()
    .single();

  if (error) throw mapSupabaseError(error);
  return data;
}
