import { describe, expect, it } from "vitest";

import { formatCsvValue, toCsv } from "@/lib/grid-export";

/**
 * CSV looks like string joining and is not. Everything below is a way the naive
 * version breaks, and each one breaks silently — the file opens, it just says
 * something other than what was exported.
 */

type Row = { name: string; note: string; score: number };

const columns = [
  { label: "Tên", value: (row: Row) => row.name },
  { label: "Ghi chú", value: (row: Row) => row.note },
  { label: "Điểm", value: (row: Row) => row.score },
];

describe("a value that would end its own field", () => {
  it("quotes a value containing the delimiter", () => {
    expect(formatCsvValue("Hà Nội, Việt Nam")).toBe('"Hà Nội, Việt Nam"');
  });

  it("doubles the quotes inside a quoted value", () => {
    // The one rule people get wrong: escaping with a backslash produces a file
    // that Excel reads as one long broken field.
    expect(formatCsvValue('Anh ấy nói "xong rồi"')).toBe('"Anh ấy nói ""xong rồi"""');
  });

  it("quotes a value containing a newline", () => {
    expect(formatCsvValue("dòng một\ndòng hai")).toBe('"dòng một\ndòng hai"');
  });

  it("leaves an ordinary value alone", () => {
    // Quoting everything is valid CSV and makes the file unreadable to a human,
    // which is most of what these files are for.
    expect(formatCsvValue("Nguyễn Văn An")).toBe("Nguyễn Văn An");
  });

  it("follows the delimiter it was given", () => {
    // Several Excel locales expect a semicolon, and a comma is then just text.
    expect(formatCsvValue("a,b", ";")).toBe("a,b");
    expect(formatCsvValue("a;b", ";")).toBe('"a;b"');
  });
});

describe("a value that a spreadsheet would execute", () => {
  /**
   * The reason this file exists rather than a one-line join. A cell someone
   * typed into your app runs as a formula on the machine of whoever opens the
   * export — the export is where the data crosses out of your app and into
   * somebody else's program.
   */
  it("neutralises every character that starts a formula", () => {
    for (const payload of [
      "=1+1",
      '=HYPERLINK("http://evil.test","click")',
      "+1234567890",
      "-2+3",
      "@SUM(A1:A9)",
      "\t=cmd",
      "\r=cmd",
    ]) {
      expect(formatCsvValue(payload).replace(/^"/, "").startsWith("'")).toBe(true);
    }
  });

  it("prefixes rather than strips, so the value still says what it said", () => {
    // Deleting the leading character would turn -5 into 5, which is a data
    // corruption fix for a security problem.
    expect(formatCsvValue("-5")).toBe("'-5");
  });

  it("leaves a number alone, because a number is not a formula", () => {
    expect(formatCsvValue(1234)).toBe("1234");
    expect(formatCsvValue(-5)).toBe("'-5");
  });
});

describe("empty and non-string values", () => {
  it("renders a missing value as missing, not as the word for it", () => {
    expect(formatCsvValue(null)).toBe("");
    expect(formatCsvValue(undefined)).toBe("");
  });

  it("writes a date as ISO", () => {
    // The only format that sorts correctly as text and does not depend on the
    // reader's locale.
    expect(formatCsvValue(new Date(Date.UTC(2026, 8, 3)))).toBe("2026-09-03T00:00:00.000Z");
  });
});

describe("the document", () => {
  const rows: Row[] = [
    { name: "Nguyễn Văn An", note: "ổn", score: 87 },
    { name: 'Trần "Bo" Bình', note: "cần theo dõi, gấp", score: 42 },
  ];

  it("starts with a byte-order mark so Excel reads Vietnamese correctly", () => {
    // Without it Excel falls back to the system code page and every accented
    // character arrives as mojibake. One three-byte prefix is the whole fix.
    expect(toCsv(rows, columns).codePointAt(0)).toBe(0xfeff);
  });

  it("can be asked not to, for anything that is not Excel", () => {
    const csv = toCsv(rows, columns, { bom: false });
    expect(csv.codePointAt(0)).not.toBe(0xfeff);
    expect(csv.startsWith("Tên,")).toBe(true);
  });

  it("puts the labels on the first line and a row on each line after", () => {
    const lines = toCsv(rows, columns, { bom: false }).split("\r\n");
    expect(lines[0]).toBe("Tên,Ghi chú,Điểm");
    expect(lines[1]).toBe("Nguyễn Văn An,ổn,87");
    expect(lines[2]).toBe('"Trần ""Bo"" Bình","cần theo dõi, gấp",42');
    expect(lines).toHaveLength(3);
  });

  it("ends its lines the way RFC 4180 says, which is what Excel expects", () => {
    expect(toCsv(rows, columns, { bom: false })).toContain("\r\n");
  });

  it("still writes the header when there are no rows", () => {
    // An empty export with no header is a file nobody can tell apart from a
    // failed one.
    expect(toCsv([], columns, { bom: false })).toBe("Tên,Ghi chú,Điểm");
  });
});
