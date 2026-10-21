// CSV for the lead export (R23). Every cell is quoted, and cells that start
// with = + - @ (or a tab/return) get a leading apostrophe, so a lead typed as
// "=HYPERLINK(...)" can't run as a formula in Excel or Google Sheets.

export function csvCell(value: unknown): string {
  let s = value == null ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const lines = [columns.map(csvCell).join(","), ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(","))];
  return `﻿${lines.join("\r\n")}\r\n`; // BOM so Excel opens UTF-8 (₹, names) correctly
}
