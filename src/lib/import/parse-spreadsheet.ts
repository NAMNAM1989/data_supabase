import * as XLSX from "xlsx";

import type { ParsedSpreadsheet } from "@/lib/import/types";

export function parseSpreadsheet(buffer: ArrayBuffer): ParsedSpreadsheet {
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim());
  const rows = matrix.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (!header) return;
      record[header] = String(cells[index] ?? "").trim();
    });
    return record;
  });

  return {
    headers,
    rows: rows.filter((row) => Object.values(row).some((value) => value.trim() !== "")),
  };
}

export function parseCsvText(text: string): ParsedSpreadsheet {
  const encoder = new TextEncoder();
  return parseSpreadsheet(encoder.encode(text).buffer);
}
