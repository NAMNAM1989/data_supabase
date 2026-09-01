import { describe, expect, it } from "vitest";

import { customerSchema } from "@/lib/validation/customer";
import { partySchema } from "@/lib/validation/party";

describe("customerSchema", () => {
  it("normalizes code and validates required fields", () => {
    const result = customerSchema.safeParse({
      code: " cyl ",
      name: "CYL EXPRESS",
      email: "OPS@Example.COM",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("CYL");
      expect(result.data.email).toBe("ops@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = customerSchema.safeParse({
      code: "CYL",
      name: "CYL EXPRESS",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("partySchema", () => {
  it("requires party name", () => {
    const result = partySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("accepts null optional fields from FormData.get()", () => {
    const result = partySchema.safeParse({
      name: "QA Party",
      code: null,
      tax_code: null,
      address: null,
      phone: null,
      email: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tax_code).toBe("");
      expect(result.data.name).toBe("QA Party");
    }
  });
});
