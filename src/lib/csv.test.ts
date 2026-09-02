import { describe, expect, it } from "vitest";

import { csvFilename, escapeCsvCell, toCsv, toCsvWithBom } from "@/lib/csv";

describe("escapeCsvCell", () => {
  it("giữ nguyên ô đơn giản", () => {
    expect(escapeCsvCell("ABC")).toBe("ABC");
  });

  it("escape dấu phẩy, ngoặc kép và xuống dòng", () => {
    expect(escapeCsvCell("a,b")).toBe('"a,b"');
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
    expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("xử lý null/undefined", () => {
    expect(escapeCsvCell(null)).toBe("");
    expect(escapeCsvCell(undefined)).toBe("");
  });
});

describe("toCsv / toCsvWithBom", () => {
  it("xuất tiếng Việt và ô phức tạp đúng", () => {
    const headers = ["code", "name", "note"];
    const rows = [
      { code: "KH01", name: "Công ty Nam Nam", note: "Ghi chú, có dấu phẩy" },
      { code: "KH02", name: 'Hàng "đặc biệt"', note: "dòng1\ndòng2" },
    ];
    const csv = toCsv(headers, rows);
    expect(csv).toContain("Công ty Nam Nam");
    expect(csv).toContain('"Ghi chú, có dấu phẩy"');
    expect(csv).toContain('"Hàng ""đặc biệt"""');
    expect(csv).toContain('"dòng1\ndòng2"');
  });

  it("thêm UTF-8 BOM", () => {
    const withBom = toCsvWithBom(["a"], [{ a: "x" }]);
    expect(withBom.charCodeAt(0)).toBe(0xfeff);
    expect(withBom.slice(1)).toBe("a\nx");
  });
});

describe("csvFilename", () => {
  it("có prefix và timestamp", () => {
    const name = csvFilename("customers", new Date("2026-09-02T08:05:00"));
    expect(name).toBe("customers_2026-09-02_0805.csv");
  });
});
