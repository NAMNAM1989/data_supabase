import { describe, expect, it } from "vitest";

import { destinationSchema, normalizeIataCode } from "@/lib/validation/destination";

describe("destination validation", () => {
  it("normalizes IATA code", () => {
    expect(normalizeIataCode(" sgn ")).toBe("SGN");
  });

  it("accepts valid destination", () => {
    const result = destinationSchema.safeParse({
      iata_code: "sgn",
      city_name: "Ho Chi Minh City",
      country_code: "VN",
      country_name: "Vietnam",
      status: "ACTIVE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.iata_code).toBe("SGN");
    }
  });

  it("rejects invalid IATA length", () => {
    const result = destinationSchema.safeParse({
      iata_code: "SG",
      status: "ACTIVE",
    });
    expect(result.success).toBe(false);
  });
});
