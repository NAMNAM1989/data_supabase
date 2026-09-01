import type { ImportEntityType } from "@/lib/import/types";

type FieldMapping = Record<string, string[]>;

const FIELD_ALIASES: Record<ImportEntityType, FieldMapping> = {
  customers: {
    code: ["code", "ma", "mã", "customer_code", "ma kh", "mã kh", "mã khách hàng"],
    name: ["name", "ten", "tên", "customer_name", "tên khách hàng"],
    customer_type: ["customer_type", "type", "loai", "loại"],
    tax_code: ["tax_code", "mst", "mã số thuế"],
    phone: ["phone", "sdt", "điện thoại", "dien thoai"],
    email: ["email"],
    address: ["address", "địa chỉ", "dia chi"],
    notes: ["notes", "ghi chú", "ghi chu"],
  },
  parties: {
    name: ["name", "ten", "tên", "party_name"],
    code: ["code", "ma", "mã"],
    tax_code: ["tax_code", "mst"],
    address: ["address", "địa chỉ", "dia chi"],
    phone: ["phone", "sdt"],
    email: ["email"],
    role: ["role", "vai trò", "vai tro"],
    customer_code: ["customer_code", "ma kh", "mã kh"],
  },
  drivers: {
    full_name: ["full_name", "name", "ten", "tên", "ho ten", "họ tên"],
    code: ["code", "ma", "mã"],
    phone: ["phone", "sdt"],
    document_number: ["document_number", "cmnd", "cccd", "cccd/cmnd"],
    license_number: ["license_number", "gplx", "bằng lái"],
    notes: ["notes", "ghi chú"],
  },
  vehicles: {
    plate_number: ["plate_number", "plate", "bien so", "biển số", "bsx"],
    plate_display: ["plate_display", "bien so hien thi"],
    vehicle_type: ["vehicle_type", "loai xe", "loại xe"],
    brand: ["brand", "hang", "hãng"],
    model: ["model"],
    notes: ["notes", "ghi chú"],
  },
  commodities: {
    name: ["name", "ten", "tên"],
    code: ["code", "ma", "mã"],
    english_name: ["english_name", "ten tieng anh"],
    category: ["category", "danh muc", "danh mục"],
    notes: ["notes", "ghi chú"],
  },
};

function normalizeHeader(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function autoMapColumns(entity: ImportEntityType, headers: string[]) {
  const aliases = FIELD_ALIASES[entity];
  const mapping: Record<string, string> = {};

  for (const header of headers) {
    const normalizedHeader = normalizeHeader(header);
    for (const [field, candidates] of Object.entries(aliases)) {
      if (mapping[field]) continue;
      if (candidates.some((candidate) => normalizeHeader(candidate) === normalizedHeader)) {
        mapping[field] = header;
      }
    }
  }

  return mapping;
}

export function applyColumnMapping(
  rows: Record<string, string>[],
  mapping: Record<string, string>,
) {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [field, header] of Object.entries(mapping)) {
      mapped[field] = row[header] ?? "";
    }
    return mapped;
  });
}
