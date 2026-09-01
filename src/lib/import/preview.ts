import { normalizeCustomerCode, normalizePlateNumber } from "@/lib/normalization";
import type { ImportEntityType, ImportPreviewRow, ImportRowAction } from "@/lib/import/types";

export type ExistingKeys = {
  customerCodes?: Set<string>;
  partyNames?: Set<string>;
  driverDocuments?: Set<string>;
  driverCodes?: Set<string>;
  vehiclePlates?: Set<string>;
  commodityCodes?: Set<string>;
  commodityNames?: Set<string>;
};

export type ExistingMatch = {
  id: string;
  label: string;
};

export type ExistingMatches = {
  customersByCode?: Map<string, ExistingMatch>;
  driversByDocument?: Map<string, ExistingMatch>;
  driversByCode?: Map<string, ExistingMatch>;
  vehiclesByPlate?: Map<string, ExistingMatch>;
  commoditiesByCode?: Map<string, ExistingMatch>;
};

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
        if (!data.name?.trim()) {
          return { ...preview, status: "error", action: "skip", message: "Thiếu tên party" };
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

export function setRowAction(row: ImportPreviewRow, action: ImportRowAction): ImportPreviewRow {
  return { ...row, action };
}
