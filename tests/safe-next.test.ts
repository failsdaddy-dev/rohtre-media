import { describe, expect, it } from "vitest";
import { safeNext } from "../src/lib/safe-next";

describe("safeNext (no open redirects after sign-in)", () => {
  it("keeps same-site paths", () => expect(safeNext("/admin/settings")).toBe("/admin/settings"));
  it("rejects other sites", () => {
    expect(safeNext("https://evil.com")).toBe("/admin");
    expect(safeNext("//evil.com")).toBe("/admin");
    expect(safeNext(String.raw`/\evil.com`)).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});
