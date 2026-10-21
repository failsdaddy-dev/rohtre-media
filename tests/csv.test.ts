import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "../src/lib/csv";

describe("lead CSV export (R23)", () => {
  it("quotes every cell and doubles quotes", () => {
    expect(csvCell('Say "hi", ok')).toBe('"Say ""hi"", ok"');
    expect(csvCell(null)).toBe('""');
    expect(csvCell(true)).toBe('"true"');
  });

  it("neutralises spreadsheet formulas", () => {
    for (const v of ['=HYPERLINK("x")', "+1+1", "-2", "@SUM(A1)", "\tx"])
      expect(csvCell(v).startsWith(`"'`)).toBe(true);
    expect(csvCell("+91 96957 47475")).toBe(`"'+91 96957 47475"`);
    expect(csvCell("plain")).toBe('"plain"');
  });

  it("writes a BOM, a header row and CRLF lines in column order", () => {
    const out = toCsv([{ b: 2, a: "x" }], ["a", "b"]);
    expect(out.charCodeAt(0)).toBe(0xfeff);
    expect(out.slice(1)).toBe('"a","b"\r\n"x","2"\r\n');
  });
});
