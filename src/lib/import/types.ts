export type ImportEntityType = "customers" | "parties" | "drivers" | "vehicles" | "commodities";

export type ImportRowStatus = "valid" | "warning" | "error" | "duplicate";

export type ImportRowAction = "create" | "skip" | "update";

export type ParsedSpreadsheet = {
  headers: string[];
  rows: Record<string, string>[];
};

export type ImportPreviewRow = {
  rowNumber: number;
  status: ImportRowStatus;
  action: ImportRowAction;
  data: Record<string, string>;
  message?: string;
  matchId?: string;
  matchLabel?: string;
};

export type ImportPreviewSummary = {
  entity: ImportEntityType;
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  duplicates: number;
  rows: ImportPreviewRow[];
};

export type ImportCommitResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ rowNumber: number; message: string }>;
};
