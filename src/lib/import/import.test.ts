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
});
