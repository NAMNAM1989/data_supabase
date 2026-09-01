import { describe, expect, it } from "vitest";

import { canPerform, canWrite } from "@/lib/auth/permissions";

describe("permissions", () => {
  it("allows admin full access", () => {
    expect(canPerform("ADMIN", "manage_users")).toBe(true);
    expect(canPerform("ADMIN", "merge_duplicates")).toBe(true);
  });

  it("restricts operator", () => {
    expect(canWrite("OPERATOR")).toBe(true);
    expect(canPerform("OPERATOR", "archive")).toBe(false);
    expect(canPerform("OPERATOR", "manage_users")).toBe(false);
  });

  it("restricts viewer to read and export", () => {
    expect(canPerform("VIEWER", "read")).toBe(true);
    expect(canPerform("VIEWER", "export")).toBe(true);
    expect(canWrite("VIEWER")).toBe(false);
  });
});
