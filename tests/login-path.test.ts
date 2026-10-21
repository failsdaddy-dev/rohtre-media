import { describe, expect, it } from "vitest";
import { secretLoginPath } from "../src/lib/login-path";

describe("secret admin sign-in address", () => {
  it("accepts a long plain path", () => {
    expect(secretLoginPath("/rohtre-team-entry-2026")).toBe("/rohtre-team-entry-2026");
    expect(secretLoginPath("  /abcdefghijkl  ")).toBe("/abcdefghijkl");
  });

  it("falls back to plain /login when unset, short or unsafe", () => {
    for (const v of [
      undefined,
      "",
      "/login",
      "/short",
      "no-slash-at-start",
      "/has/slash-inside-x",
      "/bad chars here!",
    ]) {
      expect(secretLoginPath(v)).toBeNull();
    }
  });
});
