/** Reads CSV the way spreadsheets write it: quoted cells, doubled quotes, line breaks inside quotes, BOM, any of , ; tab. */
export function parseCsv(input: string, delimiter?: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const sep = delimiter ?? detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += c;
      continue;
    }
    if (c === '"' && cell === "") quoted = true;
    else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length > 0) { row.push(cell); rows.push(row); }
  // Spreadsheets love trailing blank lines.
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

/** Picks the separator that splits the first line into the most columns (outside quotes). */
export function detectDelimiter(text: string): string {
  const firstLine = text.replace(/^﻿/, "").split(/\r?\n/, 1)[0] ?? "";
  let best = ",";
  let bestCount = 0;
  for (const candidate of [",", ";", "\t"]) {
    let count = 0;
    let quoted = false;
    for (const c of firstLine) {
      if (c === '"') quoted = !quoted;
      else if (c === candidate && !quoted) count++;
    }
    if (count > bestCount) { best = candidate; bestCount = count; }
  }
  return best;
}

/** Cells that start with = + @ (or a minus followed by a letter) are run as formulas by spreadsheets. */
function guardFormula(value: string): string {
  return /^[=+@\t\r]/.test(value) || /^-[^\d.\s]/.test(value) ? `'${value}` : value;
}

export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  const cell = (v: string | number | boolean | null | undefined) => {
    const s = v === null || v === undefined ? "" : typeof v === "string" ? guardFormula(v) : String(v);
    return /[",\n\r;\t]/.test(s) || s.startsWith(" ") || s.endsWith(" ") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Undo `guardFormula` when reading our own export back in. */
export function unguardFormula(value: string): string {
  return /^'[=+@\t\r-]/.test(value) ? value.slice(1) : value;
}
