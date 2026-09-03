/**
 * Rows to CSV, and CSV to a downloaded file.
 *
 * CSV looks like string joining and is not. Three things go wrong, all of them
 * silently, and all three are handled here so that no project has to find them
 * one at a time:
 *
 * 1. **Separators inside values.** A comma, a quote or a newline in a cell ends
 *    the field early. RFC 4180 says quote the field and double the quotes; this
 *    does that, and only when needed, so an ordinary file stays readable.
 * 2. **Excel and non-ASCII text.** Without a byte-order mark, Excel reads the
 *    file as the system's legacy code page and Vietnamese arrives as mojibake.
 *    One three-byte prefix is the whole fix, and it is why this is not a
 *    one-liner.
 * 3. **Formula injection.** Excel and Sheets treat a cell beginning with `=`,
 *    `+`, `-`, `@`, a tab or a carriage return as a formula. A row of data
 *    someone typed into your app then executes on the machine of whoever opens
 *    the export — that is a real vulnerability, not a formatting nit, and the
 *    export is exactly where it crosses from your app into somebody else's
 *    program.
 *
 * reno ships CSV and not Excel or PDF on purpose: CSV needs no dependency,
 * while the other two mean choosing a library on a project's behalf. Those stay
 * with the project, which is why `onExport` reports a format rather than
 * producing a file for every one of them.
 */

/** One exported column: where the value comes from, and what to call it. */
export type CsvColumn<TRow> = {
  /** Header cell text. */
  label: string;
  /** Pulled per row. Return anything; `formatCsvValue` renders it. */
  value: (row: TRow) => unknown;
};

export type CsvOptions = {
  /** Field separator. `;` is what Excel expects in several locales. */
  delimiter?: string;
  /**
   * Prefix a byte-order mark. On by default: without it Excel misreads
   * anything outside ASCII, which for Vietnamese data means every file.
   */
  bom?: boolean;
};

const BOM = "﻿";

/**
 * Characters that make a spreadsheet treat the cell as a formula.
 *
 * The tab and carriage return are in the list because Excel strips leading
 * whitespace before deciding, so `"\t=cmd"` is still a formula.
 */
const FORMULA_LEAD = /^[=+\-@\t\r]/;

/** Anything that would end a field early if left unquoted. */
const NEEDS_QUOTES = /["\n\r]/;

/**
 * One value as a CSV field.
 *
 * `null` and `undefined` become empty rather than the strings "null" and
 * "undefined" — a missing value is missing, not the word for it. Dates go out
 * as ISO, which is the only format that sorts correctly as text and does not
 * depend on the reader's locale.
 */
export function formatCsvValue(value: unknown, delimiter = ","): string {
  if (value === null || value === undefined) return "";

  let text: string;
  if (value instanceof Date) text = value.toISOString();
  else if (typeof value === "object") text = JSON.stringify(value);
  else text = String(value);

  /*
    Neutralise a formula by prefixing an apostrophe, which spreadsheets read as
    "this is text" and do not display. Prefixing rather than stripping: the
    value a user typed is data, and silently deleting a leading minus sign would
    turn -5 into 5.
  */
  if (FORMULA_LEAD.test(text)) text = `'${text}`;

  const mustQuote = text.includes(delimiter) || NEEDS_QUOTES.test(text);
  return mustQuote ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Rows and columns to a CSV document.
 *
 * CRLF line endings, per RFC 4180 — the format Excel is least surprised by.
 */
export function toCsv<TRow>(
  rows: readonly TRow[],
  columns: readonly CsvColumn<TRow>[],
  { delimiter = ",", bom = true }: CsvOptions = {},
): string {
  const line = (cells: unknown[]) =>
    cells.map((cell) => formatCsvValue(cell, delimiter)).join(delimiter);

  const header = line(columns.map((column) => column.label));
  const body = rows.map((row) => line(columns.map((column) => column.value(row))));

  return (bom ? BOM : "") + [header, ...body].join("\r\n");
}

/**
 * Hand a CSV document to the browser as a download.
 *
 * Separate from `toCsv` so the string can be produced and tested without a DOM,
 * and so a project that uploads the export instead of downloading it does not
 * have to route around a function that insists on a click.
 *
 * The object URL is revoked on the next frame rather than immediately: revoking
 * in the same task cancels the download in some browsers, and never revoking
 * holds the whole file in memory for the life of the tab.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}
