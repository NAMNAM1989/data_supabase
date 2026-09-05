import * as XLSX from "xlsx";

import type { ParsedSpreadsheet } from "@/lib/import/types";

const MAX_SHEETS = 1;
const MAX_ROWS = 20_000;

function matrixToParsed(matrix: (string | number | boolean | null)[][]): ParsedSpreadsheet {
  if (matrix.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = (matrix[0] ?? []).map((cell) => String(cell ?? "").trim());
  const body = matrix.slice(1, MAX_ROWS + 1);
  const rows = body.map((cells) => {
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

/**
 * Parse .xlsx/.xls. Caller must enforce file size limits (see import UI).
 * Prefer CSV via parseCsvText when possible to avoid SheetJS for untrusted Excel.
 */
export function parseSpreadsheet(buffer: ArrayBuffer): ParsedSpreadsheet {
  const workbook = XLSX.read(buffer, {
    type: "array",
    bookSheets: false,
    bookProps: false,
    cellDates: false,
    cellNF: false,
    cellStyles: false,
    sheetRows: MAX_ROWS + 1,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName || workbook.SheetNames.length > MAX_SHEETS) {
    // Still allow first sheet only even if workbook has more sheets
  }
  if (!sheetName) {
    return { headers: [], rows: [] };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  return matrixToParsed(matrix);
}

/** Parse CSV without SheetJS (preferred for untrusted text uploads). */
export function parseCsvText(text: string): ParsedSpreadsheet {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const matrix = lines.slice(0, MAX_ROWS + 1).map((line) => parseCsvLine(line));
  return matrixToParsed(matrix);
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current);
  return cells;
}
