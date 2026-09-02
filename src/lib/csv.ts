/** Escape một ô CSV theo RFC 4180. */
export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** Tạo nội dung CSV (không BOM). */
export function toCsv(
  headers: string[],
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
): string {
  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(","));
  }
  return lines.join("\n");
}

/** CSV với UTF-8 BOM để Excel mở tiếng Việt đúng. */
export function toCsvWithBom(
  headers: string[],
  rows: Array<Record<string, string | number | boolean | null | undefined>>,
): string {
  return `\uFEFF${toCsv(headers, rows)}`;
}

/** Tên file dạng `prefix_YYYY-MM-DD_HHmm.csv`. */
export function csvFilename(prefix: string, date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${prefix}_${yyyy}-${mm}-${dd}_${hh}${mi}.csv`;
}
