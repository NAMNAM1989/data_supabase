"use server";

import { revalidatePath } from "next/cache";

import { canPerform } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { writeAuditLog } from "@/lib/master-data/audit";
import {
  archiveCustomer,
  createCustomer,
  restoreCustomer,
  updateCustomer,
} from "@/lib/master-data/customers";
import { hardDeleteByIds } from "@/lib/master-data/hard-delete";
import { createCommodity } from "@/lib/master-data/commodities";
import { createParty } from "@/lib/master-data/parties";
import {
  linkCustomerCommodity,
  linkCustomerDriver,
  linkCustomerParty,
  linkCustomerVehicle,
  setDefaultCustomerCommodity,
  setDefaultCustomerDriver,
  setDefaultCustomerParty,
  setDefaultCustomerVehicle,
  unlinkCustomerCommodity,
  unlinkCustomerDriver,
  unlinkCustomerParty,
  unlinkCustomerVehicle,
  updateCustomerCommodity,
  updateCustomerDriver,
  updateCustomerParty,
  updateCustomerVehicle,
} from "@/lib/master-data/relations";
import { createClient } from "@/lib/supabase/server";
import { customerSchema, customerUpdateSchema } from "@/lib/validation/customer";
import {
  linkCommoditySchema,
  linkPartySchema,
  updateCommodityRelationSchema,
  updatePartyRelationSchema,
} from "@/lib/validation/relations";
import {
  linkCustomerDriverSchema,
  linkCustomerVehicleSchema,
  updateCustomerDriverSchema,
  updateCustomerVehicleSchema,
} from "@/lib/validation/transport-relations";
import type { Json } from "@/types/database";
import {
  customerEsidProfileUpdateSchema,
} from "@/lib/validation/customer-esid-profile";
import { upsertCustomerEsidProfile } from "@/lib/master-data/customer-esid-profiles";

async function requireWrite() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "create")) {
    throw new AppError("PERMISSION", "Bạn không có quyền thực hiện thao tác này");
  }
  return session;
}

async function requireArchive() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "archive")) {
    throw new AppError("PERMISSION", "Bạn không có quyền archive/restore");
  }
  return session;
}

async function requireDelete() {
  const session = await getSession();
  if (!session?.profile || !canPerform(session.profile.role, "delete")) {
    throw new AppError("PERMISSION", "Bạn không có quyền xóa");
  }
  return session;
}

export async function createCustomerAction(input: unknown) {
  const session = await requireWrite();
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const customer = await createCustomer(supabase, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "INSERT",
      tableName: "customers",
      recordId: customer.id,
      newData: customer as unknown as Json,
    });
    revalidatePath("/customers");
    return { data: customer };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể tạo customer",
    };
  }
}

export async function updateCustomerAction(id: string, input: unknown) {
  const session = await requireWrite();
  const parsed = customerUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const customer = await updateCustomer(supabase, id, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "customers",
      recordId: id,
      newData: customer as unknown as Json,
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { data: customer };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật customer",
    };
  }
}

export async function archiveCustomerAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const customer = await archiveCustomer(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "ARCHIVE",
      tableName: "customers",
      recordId: id,
      newData: customer as unknown as Json,
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { data: customer };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể archive customer",
    };
  }
}

export async function restoreCustomerAction(id: string) {
  const session = await requireArchive();
  const supabase = await createClient();
  try {
    const customer = await restoreCustomer(supabase, id);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "RESTORE",
      tableName: "customers",
      recordId: id,
      newData: customer as unknown as Json,
    });
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { data: customer };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể restore customer",
    };
  }
}

export async function deleteCustomersAction(ids: string[]) {
  const session = await requireDelete();
  const supabase = await createClient();
  try {
    const rows = await hardDeleteByIds(supabase, "customers", ids);
    for (const row of rows) {
      await writeAuditLog(supabase, {
        actorUserId: session.userId,
        action: "DELETE",
        tableName: "customers",
        recordId: row.id,
        oldData: row as unknown as Json,
      });
      revalidatePath(`/customers/${row.id}`);
    }
    revalidatePath("/customers");
    return { data: { deleted: rows.length } };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể xóa customer",
    };
  }
}

export async function linkPartyAction(input: unknown) {
  await requireWrite();
  const parsed = linkPartySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    let partyId = parsed.data.party_id;

    if (!partyId && parsed.data.new_party) {
      const party = await createParty(supabase, {
        name: parsed.data.new_party.name,
        code: "",
        tax_code: parsed.data.new_party.tax_code ?? "",
        address: parsed.data.new_party.address ?? "",
        branch_name: "",
        contact_person: parsed.data.new_party.contact_person ?? "",
        contact_phone: parsed.data.new_party.contact_phone ?? "",
        city: "",
        state: "",
        postal_code: "",
        country_code: "",
        country_name: "",
        phone: parsed.data.new_party.phone ?? "",
        fax: "",
        email: parsed.data.new_party.email ?? "",
        handling_instructions: "",
        status: "ACTIVE",
        notes: "",
      });
      partyId = party.id;
    }

    if (!partyId) {
      return { error: "Chọn party hoặc tạo party mới" };
    }

    const relation = await linkCustomerParty(supabase, {
      customer_id: parsed.data.customer_id,
      party_id: partyId,
      role: parsed.data.role,
      destination_id: parsed.data.destination_id,
      account_number: parsed.data.account_number,
      notes: parsed.data.notes,
      is_default: parsed.data.is_default,
    });

    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/customers");
  revalidatePath("/parties");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể liên kết party",
    };
  }
}

export async function unlinkPartyAction(relationId: string, customerId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await unlinkCustomerParty(supabase, relationId);
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể gỡ liên kết party",
    };
  }
}

export async function setDefaultPartyAction(relationId: string, customerId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await setDefaultCustomerParty(supabase, relationId);
    revalidatePath(`/customers/${customerId}`);
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể đặt mặc định",
    };
  }
}

export async function linkCommodityAction(input: unknown) {
  await requireWrite();
  const parsed = linkCommoditySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    let commodityId = parsed.data.commodity_id;

    if (!commodityId && parsed.data.new_commodity) {
      const commodity = await createCommodity(supabase, {
        name: parsed.data.new_commodity.name,
        code: parsed.data.new_commodity.code ?? "",
        english_name: "",
        hs_code: "",
        category: "",
        cargo_type: "GENERAL",
        special_handling_codes: [],
        temperature_range: "",
        un_number: "",
        dg_class: "",
        default_packaging: "CARTON",
        status: "ACTIVE",
        is_dg: false,
        contains_battery: false,
        is_liquid: false,
        notes: "",
      });
      commodityId = commodity.id;
    }

    if (!commodityId) {
      return { error: "Chọn commodity hoặc tạo commodity mới" };
    }

    const relation = await linkCustomerCommodity(supabase, {
      customer_id: parsed.data.customer_id,
      commodity_id: commodityId,
      is_default: parsed.data.is_default,
      custom_description: parsed.data.custom_description,
      package_type: parsed.data.package_type,
      special_instructions: parsed.data.special_instructions,
    });

    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/customers");
    revalidatePath("/commodities");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể liên kết commodity",
    };
  }
}

export async function unlinkCommodityAction(relationId: string, customerId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await unlinkCustomerCommodity(supabase, relationId);
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/customers");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể gỡ liên kết commodity",
    };
  }
}

export async function linkDriverPreferenceAction(input: unknown) {
  await requireWrite();
  const parsed = linkCustomerDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const relation = await linkCustomerDriver(supabase, parsed.data);
    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/drivers");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể thêm driver ưu tiên",
    };
  }
}

export async function unlinkDriverPreferenceAction(relationId: string, customerId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await unlinkCustomerDriver(supabase, relationId);
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/drivers");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể gỡ driver ưu tiên",
    };
  }
}

export async function setDefaultDriverPreferenceAction(relationId: string, customerId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await setDefaultCustomerDriver(supabase, relationId);
    revalidatePath(`/customers/${customerId}`);
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể đặt mặc định",
    };
  }
}

export async function linkVehiclePreferenceAction(input: unknown) {
  await requireWrite();
  const parsed = linkCustomerVehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const relation = await linkCustomerVehicle(supabase, parsed.data);
    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/vehicles");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể thêm vehicle ưu tiên",
    };
  }
}

export async function unlinkVehiclePreferenceAction(relationId: string, customerId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await unlinkCustomerVehicle(supabase, relationId);
    revalidatePath(`/customers/${customerId}`);
    revalidatePath("/vehicles");
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể gỡ vehicle ưu tiên",
    };
  }
}

export async function setDefaultVehiclePreferenceAction(relationId: string, customerId: string) {
  await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await setDefaultCustomerVehicle(supabase, relationId);
    revalidatePath(`/customers/${customerId}`);
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể đặt mặc định",
    };
  }
}

export async function updatePartyRelationAction(input: unknown) {
  const session = await requireWrite();
  const parsed = updatePartyRelationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const result = await updateCustomerParty(supabase, parsed.data.relation_id, {
      party_id: parsed.data.party_id,
      destination_id: parsed.data.destination_id ?? null,
      account_number: parsed.data.account_number ?? null,
      notes: parsed.data.notes ?? null,
      is_default: parsed.data.is_default,
    });
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "customer_parties",
      recordId: parsed.data.relation_id,
      oldData: result.before as unknown as Json,
      newData: result.after as unknown as Json,
    });
    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/parties");
    return { data: result.after };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật quan hệ party",
    };
  }
}

export async function updateCommodityRelationAction(input: unknown) {
  const session = await requireWrite();
  const parsed = updateCommodityRelationSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const result = await updateCustomerCommodity(supabase, parsed.data.relation_id, {
      commodity_id: parsed.data.commodity_id,
      custom_description: parsed.data.custom_description ?? null,
      package_type: parsed.data.package_type ?? null,
      special_instructions: parsed.data.special_instructions ?? null,
      is_default: parsed.data.is_default,
    });
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "customer_commodities",
      recordId: parsed.data.relation_id,
      oldData: result.before as unknown as Json,
      newData: result.after as unknown as Json,
    });
    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/commodities");
    return { data: result.after };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật quan hệ commodity",
    };
  }
}

export async function setDefaultCommodityAction(relationId: string, customerId: string) {
  const session = await requireWrite();
  const supabase = await createClient();
  try {
    const relation = await setDefaultCustomerCommodity(supabase, relationId);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "customer_commodities",
      recordId: relationId,
      newData: relation as unknown as Json,
    });
    revalidatePath(`/customers/${customerId}`);
    return { data: relation };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể đặt mặc định",
    };
  }
}

export async function updateDriverPreferenceAction(input: unknown) {
  const session = await requireWrite();
  const parsed = updateCustomerDriverSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const result = await updateCustomerDriver(supabase, parsed.data.relation_id, {
      driver_id: parsed.data.driver_id,
      is_default: parsed.data.is_default,
    });
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "customer_drivers",
      recordId: parsed.data.relation_id,
      oldData: result.before as unknown as Json,
      newData: result.after as unknown as Json,
    });
    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/drivers");
    return { data: result.after };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật driver ưu tiên",
    };
  }
}

export async function updateVehiclePreferenceAction(input: unknown) {
  const session = await requireWrite();
  const parsed = updateCustomerVehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const result = await updateCustomerVehicle(supabase, parsed.data.relation_id, {
      vehicle_id: parsed.data.vehicle_id,
      is_default: parsed.data.is_default,
    });
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPDATE",
      tableName: "customer_vehicles",
      recordId: parsed.data.relation_id,
      oldData: result.before as unknown as Json,
      newData: result.after as unknown as Json,
    });
    revalidatePath(`/customers/${parsed.data.customer_id}`);
    revalidatePath("/vehicles");
    return { data: result.after };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể cập nhật vehicle ưu tiên",
    };
  }
}

export async function upsertCustomerEsidProfileAction(customerId: string, input: unknown) {
  const session = await requireWrite();
  const parsed = customerEsidProfileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dữ liệu ESID không hợp lệ" };
  }

  const supabase = await createClient();
  try {
    const profile = await upsertCustomerEsidProfile(supabase, customerId, parsed.data);
    await writeAuditLog(supabase, {
      actorUserId: session.userId,
      action: "UPSERT",
      tableName: "customer_esid_profiles",
      recordId: customerId,
      newData: profile as unknown as Json,
    });
    revalidatePath(`/customers/${customerId}`);
    return { data: profile };
  } catch (error) {
    return {
      error: error instanceof AppError ? error.message : "Không thể lưu hồ sơ ESID",
    };
  }
}
