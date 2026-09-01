import { describe, expect, it } from "vitest";

import { createUserSchema, selfSettingsSchema } from "@/lib/validation/user";

describe("user validation", () => {
  it("validates create user", () => {
    const result = createUserSchema.safeParse({
      email: "admin@example.com",
      password: "password1",
      role: "ADMIN",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password", () => {
    const result = createUserSchema.safeParse({
      email: "admin@example.com",
      password: "short",
      role: "VIEWER",
    });
    expect(result.success).toBe(false);
  });

  it("validates self settings", () => {
    const result = selfSettingsSchema.safeParse({ display_name: "Nam Nam Admin" });
    expect(result.success).toBe(true);
  });
});
