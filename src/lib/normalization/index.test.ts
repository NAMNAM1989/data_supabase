import { describe, expect, it } from "vitest";

import {
  normalizeCustomerCode,
  normalizeEmail,
  normalizePhone,
  normalizePlateNumber,
} from "@/lib/normalization";

describe("normalization", () => {
  it("normalizes customer code", () => {
    expect(normalizeCustomerCode(" cyl ")).toBe("CYL");
  });

  it("normalizes plate number", () => {
    expect(normalizePlateNumber("51c-123.45")).toBe("51C12345");
  });

  it("normalizes email", () => {
    expect(normalizeEmail(" User@Example.COM ")).toBe("user@example.com");
  });

  it("normalizes phone whitespace", () => {
    expect(normalizePhone("0901  234  567")).toBe("0901 234 567");
  });
});
