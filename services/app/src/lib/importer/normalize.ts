import type { ItemStatus } from "./types";

const DONE = /^(done|closed|resolved|complete|completed|finished|shipped|released|fixed|deployed|live|merged|accepted)$/;
const REVIEW = /(review|testing|qa|verif|validate|approval|uat)/;
const PROGRESS = /(progress|doing|started|active|wip|develop|implement|working|building|ongoing|underway)/;
const TODO = /^(to ?do|todo|backlog|open|new|planned|ready|unstarted|triage|icebox|selected for development|not started|queued|inbox|later|someday|ideas?|reopened|to be done)$/;
const DROPPED = /(cancel|duplicate|won'?t|wont|rejected|obsolete|declined|abandon|invalid)/;

/** Best guess at which of our four statuses a free-text status from another tool means. Null = no idea. */
export function guessStatus(raw: string | undefined | null): ItemStatus | null {
  const s = (raw ?? "").trim().toLowerCase();
  if (!s) return null;
  if (DROPPED.test(s)) return "DONE";
  if (TODO.test(s)) return "TODO";
  if (REVIEW.test(s)) return "REVIEW";
  if (/^in ?progress$/.test(s) || PROGRESS.test(s)) return "IN_PROGRESS";
  if (DONE.test(s) || /^(done|complete)/.test(s)) return "DONE";
  if (TODO.test(s)) return "TODO";
  return null;
}

/** "Canceled", "Won't do", "Duplicate"…: finished without being done; imported as archived. */
export function isDropped(raw: string | undefined | null): boolean {
  return DROPPED.test((raw ?? "").trim().toLowerCase());
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function iso(y: number, m: number, d: number): string | undefined {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2200) return undefined;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCMonth() !== m - 1) return undefined;
  return date.toISOString().slice(0, 10);
}

/**
 * Turns the date formats exports actually contain into YYYY-MM-DD, or undefined when it isn't a date.
 * Ambiguous 03/04/2026 is read month-first unless the first number can't be a month.
 */
export function parseLooseDate(raw: string | number | undefined | null): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;

  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s].*)?$/.exec(s);
  if (m) return iso(+m[1], +m[2], +m[3]);

  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:\s.*)?$/.exec(s);
  if (m) {
    const a = +m[1], b = +m[2];
    let y = +m[3];
    if (y < 100) y += 2000;
    return a > 12 ? iso(y, b, a) : iso(y, a, b);
  }

  // 21/Oct/26 9:12 AM, 21-Oct-2026, 21 October 2026
  m = /^(\d{1,2})[\s/.-]([A-Za-z]{3,9})[\s/.,-]+(\d{2,4})(?:\s.*)?$/.exec(s);
  if (m) {
    const mon = MONTHS.indexOf(m[2].slice(0, 3).toLowerCase()) + 1;
    let y = +m[3];
    if (y < 100) y += 2000;
    return mon ? iso(y, mon, +m[1]) : undefined;
  }

  // Oct 21, 2026 · October 21 2026 · Thu Oct 21 2026 10:00:00 GMT
  m = /^(?:[A-Za-z]{3,9},?\s+)?([A-Za-z]{3,9})\s+(\d{1,2}),?\s+(\d{4})/.exec(s);
  if (m) {
    const mon = MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) + 1;
    return mon ? iso(+m[3], mon, +m[2]) : undefined;
  }
  return undefined;
}

/** Numbers as people write them: "5", "3.5", "3,5", " 8 pts". Undefined when there is no number. */
export function parseLooseNumber(raw: string | number | undefined | null): number | undefined {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : undefined;
  const s = (raw ?? "").trim().replace(",", ".");
  const m = /^-?\d+(\.\d+)?/.exec(s);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : undefined;
}

export function clip(value: string | undefined | null, max: number): string | undefined {
  const s = (value ?? "").trim();
  if (!s) return undefined;
  return s.length > max ? s.slice(0, max) : s;
}
