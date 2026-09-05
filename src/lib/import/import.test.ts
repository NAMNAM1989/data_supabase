import { describe, expect, it } from "vitest";

import { autoMapColumns } from "@/lib/import/column-mapping";
import { buildImportPreview, summarizePreview } from "@/lib/import/preview";
import { stringSimilarity } from "@/lib/text/similarity";

describe("stringSimilarity", () => {
  it("returns 1 for identical strings", () => {
    expect(stringSimilarity("ABC Taiwan", "abc taiwan")).toBe(1);
  });

  it("returns lower score for different strings", () => {
    expect(stringSimilarity("ABC Taiwan", "XYZ Vietnam")).toBeLessThan(0.5);
  });
});

describe("autoMapColumns", () => {
  it("maps Vietnamese customer headers", () => {
    const mapping = autoMapColumns("customers", ["Mã KH", "Tên khách hàng", "Email"]);
    expect(mapping.code).toBe("Mã KH");
    expect(mapping.name).toBe("Tên khách hàng");
    expect(mapping.email).toBe("Email");
  });

  it("maps Vietnamese logistics party headers", () => {
    const mapping = autoMapColumns("parties", ["Tên công ty", "Mã đối tác", "Mã số thuế", "Địa chỉ", "Người liên hệ"]);
    expect(mapping.name).toBe("Tên công ty");
    expect(mapping.code).toBe("Mã đối tác");
    expect(mapping.tax_code).toBe("Mã số thuế");
    expect(mapping.address).toBe("Địa chỉ");
    expect(mapping.contact_person).toBe("Người liên hệ");
  });

  it("maps air cargo commodity headers", () => {
    const mapping = autoMapColumns("commodities", ["Tên hàng", "Mã hàng", "Tên tiếng anh", "Mã HS"]);
    expect(mapping.name).toBe("Tên hàng");
    expect(mapping.code).toBe("Mã hàng");
    expect(mapping.english_name).toBe("Tên tiếng anh");
    expect(mapping.hs_code).toBe("Mã HS");
  });
});

describe("buildImportPreview", () => {
  it("flags duplicate customer code in batch", () => {
    const rows = buildImportPreview(
      "customers",
      [
        { code: "CYL", name: "Customer A" },
        { code: "CYL", name: "Customer B" },
      ],
      {},
    );

    expect(rows[1].status).toBe("duplicate");
    expect(summarizePreview(rows).duplicates).toBe(1);
  });

  it("flags existing vehicle plate", () => {
    const rows = buildImportPreview(
      "vehicles",
      [{ plate_number: "51C-123.45" }],
      {
        vehiclesByPlate: new Map([["51C12345", { id: "v1", label: "51C-123.45" }]]),
      },
    );

    expect(rows[0].status).toBe("duplicate");
    expect(rows[0].matchId).toBe("v1");
  });

  it("flags existing party by code and name", () => {
    const rows = buildImportPreview(
      "parties",
      [
        { name: "ABC Corp", code: "P01" },
        { name: "Existing Name", code: "" },
      ],
      {
        partiesByCode: new Map([["P01", { id: "p1", label: "ABC Corp" }]]),
        partiesByName: new Map([["existing name", { id: "p2", label: "Existing Name" }]]),
      },
    );

    expect(rows[0].action).toBe("update");
    expect(rows[0].matchId).toBe("p1");
    expect(rows[1].action).toBe("update");
    expect(rows[1].matchId).toBe("p2");
  });
});
