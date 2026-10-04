const FORMULA_START = /^[=+\-@\t\r]/;
const PLAIN_NUMBER_OR_PHONE = /^[+-]?[0-9][0-9 ()-]*$/;

/**
 * One CSV cell. Customer-supplied text ends up in these exports, and Excel /
 * Google Sheets execute cells that start with = + - @ — so a customer named
 * `=HYPERLINK(...)` could attack whoever opens the file. Prefixing such cells
 * with an apostrophe makes spreadsheets treat them as plain text. Plain numbers
 * and phone numbers (e.g. "+91 98765 43210") are left alone.
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_START.test(s) && !PLAIN_NUMBER_OR_PHONE.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.split('"').join('""')}"` : s;
}

export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
