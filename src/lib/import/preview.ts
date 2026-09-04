import { normalizeCustomerCode, normalizePlateNumber } from "@/lib/normalization";
import type { ImportEntityType, ImportPreviewRow } from "@/lib/import/types";

export type ExistingMatch = {
  id: string;
  label: string;
};

export type ExistingMatches = {
  customersByCode?: Map<string, ExistingMatch>;
  partiesByCode?: Map<string, ExistingMatch>;
  partiesByName?: Map<string, ExistingMatch>;
  driversByDocument?: Map<string, ExistingMatch>;
  driversByCode?: Map<string, ExistingMatch>;
  vehiclesByPlate?: Map<string, ExistingMatch>;
  commoditiesByCode?: Map<string, ExistingMatch>;
};

function normalizePartyName(value: string) {
  return value.trim().toLowerCase();
}

function rowBase(rowNumber: number, data: Record<string, string>): ImportPreviewRow {
  return {
    rowNumber,
    status: "valid",
    action: "create",
    data,
  };
}

export function buildImportPreview(
  entity: ImportEntityType,
  rows: Record<string, string>[],
  existing: ExistingMatches,
): ImportPreviewRow[] {
  const batchCodes = new Set<string>();
  const batchPartyKeys = new Set<string>();

  return rows.map((data, index) => {
    const rowNumber = index + 2;
    const preview = rowBase(rowNumber, data);

    switch (entity) {
      case "customers": {
        const code = normalizeCustomerCode(data.code ?? "");
        if (!code) {
          return { ...preview, status: "error", action: "skip", message: "Thiếu mã customer" };
        }
        if (!data.name?.trim()) {
          return { ...preview, status: "error", action: "skip", message: "Thiếu tên customer" };
        }
        if (batchCodes.has(code)) {
          return {
            ...preview,
            status: "duplicate",
            action: "skip",
            message: "Trùng mã trong file import",
          };
        }
        batchCodes.add(code);
        const match = existing.customersByCode?.get(code);
        if (match) {
          return {
            ...preview,
            status: "duplicate",
            action: "update",
            message: "Customer đã tồn tại",
            matchId: match.id,
            matchLabel: match.label,
          };
        }
        return preview;
      }
      case "parties": {
        const name = data.name?.trim() ?? "";
        if (!name) {
          return { ...preview, status: "error", action: "skip", message: "Thiếu tên party" };
        }

        const code = (data.code ?? "").trim().toUpperCase();
        const batchKey = code ? `code:${code}` : `name:${normalizePartyName(name)}`;
        if (batchPartyKeys.has(batchKey)) {
          return {
            ...preview,
            status: "duplicate",
            action: "skip",
            message: "Trùng party trong file import",
          };
        }
        batchPartyKeys.add(batchKey);

        const codeMatch = code ? existing.partiesByCode?.get(code) : undefined;
        const nameMatch = existing.partiesByName?.get(normalizePartyName(name));
        const match = codeMatch ?? nameMatch;
        if (match) {
          return {
            ...preview,
            status: "duplicate",
            action: "update",
            message: codeMatch ? "Party đã tồn tại (code)" : "Party đã tồn tại (tên)",
            matchId: match.id,
            matchLabel: match.label,
          };
        }

        const customerCode = normalizeCustomerCode(data.customer_code ?? "");
        const role = (data.role ?? "").trim().toUpperCase();
        if (customerCode || role) {
          if (!customerCode) {
            return {
              ...preview,
              status: "warning",
              action: "create",
              message: "Có role nhưng thiếu customer_code — sẽ tạo party không gắn customer",
            };
          }
          if (!["SHIPPER", "CONSIGNEE", "AGENT", "NOTIFY"].includes(role)) {
            return {
              ...preview,
              status: "warning",
              action: "create",
              message: "role không hợp lệ — sẽ tạo party không gắn customer",
            };
          }
          const customer = existing.customersByCode?.get(customerCode);
          if (!customer) {
            return {
              ...preview,
              status: "warning",
              action: "create",
              message: `Không tìm thấy customer ${customerCode} — sẽ tạo party không gắn`,
            };
          }
        }

        return preview;
      }
      case "drivers": {
        if (!data.full_name?.trim()) {
          return { ...preview, status: "error", action: "skip", message: "Thiếu tên tài xế" };
        }
        const document = data.document_number?.trim();
        if (document) {
          const match = existing.driversByDocument?.get(document);
          if (match) {
            return {
              ...preview,
              status: "duplicate",
              action: "update",
              message: "Driver đã tồn tại (CMND/CCCD)",
              matchId: match.id,
              matchLabel: match.label,
            };
          }
        }
        const code = data.code?.trim();
        if (code) {
          const match = existing.driversByCode?.get(code);
          if (match) {
            return {
              ...preview,
              status: "duplicate",
              action: "update",
              message: "Driver đã tồn tại (code)",
              matchId: match.id,
              matchLabel: match.label,
            };
          }
        }
        return preview;
      }
      case "vehicles": {
        const plate = normalizePlateNumber(data.plate_number ?? "");
        if (!plate) {
          return { ...preview, status: "error", action: "skip", message: "Thiếu biển số" };
        }
        const match = existing.vehiclesByPlate?.get(plate);
        if (match) {
          return {
            ...preview,
            status: "duplicate",
            action: "update",
            message: "Vehicle đã tồn tại",
            matchId: match.id,
            matchLabel: match.label,
          };
        }
        return preview;
      }
      case "commodities": {
        if (!data.name?.trim()) {
          return { ...preview, status: "error", action: "skip", message: "Thiếu tên commodity" };
        }
        const code = data.code?.trim().toUpperCase();
        if (code) {
          const match = existing.commoditiesByCode?.get(code);
          if (match) {
            return {
              ...preview,
              status: "duplicate",
              action: "update",
              message: "Commodity đã tồn tại",
              matchId: match.id,
              matchLabel: match.label,
            };
          }
        }
        return preview;
      }
      default:
        return preview;
    }
  });
}

export function summarizePreview(rows: ImportPreviewRow[]) {
  return {
    total: rows.length,
    valid: rows.filter((row) => row.status === "valid").length,
    warnings: rows.filter((row) => row.status === "warning").length,
    errors: rows.filter((row) => row.status === "error").length,
    duplicates: rows.filter((row) => row.status === "duplicate").length,
  };
}
