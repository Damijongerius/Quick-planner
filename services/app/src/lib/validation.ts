// Pure input validation. No database, auth or framework imports, so it is trivially testable.
import { MAX_NAME_LENGTH, MAX_TITLE_LENGTH, isNodeStatus } from "./constants";
import { UserError } from "./errors";

export function cleanTitle(value: unknown, label = "Title", max = MAX_TITLE_LENGTH): string {
  if (typeof value !== "string") throw new UserError(`${label} is required`);
  const trimmed = value.trim();
  if (!trimmed) throw new UserError(`${label} is required`);
  if (trimmed.length > max) throw new UserError(`${label} must be at most ${max} characters`);
  return trimmed;
}

export function cleanName(value: unknown, label = "Name"): string {
  return cleanTitle(value, label, MAX_NAME_LENGTH);
}

export function assertNodeStatus(status: unknown): asserts status is string {
  if (!isNodeStatus(status)) throw new UserError(`Invalid status: ${String(status)}`);
}

/** undefined = "not provided", null/"" = "clear it", otherwise a valid Date. */
export function parseDate(value: string | Date | null | undefined, label: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new UserError(`Invalid ${label}`);
  return date;
}

export type FieldRow = { name: string; type: string; required: boolean; options: unknown };

/**
 * Validates custom-field values against the node type's field definitions and
 * returns the sanitized content. Content is keyed by field name. Values for
 * unknown fields are dropped (fields may have been deleted since), numeric
 * strings from <input type="number"> are coerced. When `partial` is true
 * (updates) missing required fields are tolerated.
 */
export function sanitizeContent(
  fields: FieldRow[],
  content: Record<string, unknown> | undefined | null,
  { partial = false }: { partial?: boolean } = {}
): Record<string, unknown> {
  const values = content ?? {};
  const byName = new Map(fields.map((f) => [f.name, f]));
  const clean: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(values)) {
    const field = byName.get(key);
    if (!field) continue;
    if (raw === null || raw === undefined || raw === "") {
      clean[key] = raw;
      continue;
    }
    let value = raw;

    switch (field.type) {
      case "NUMBER": {
        const num = typeof value === "string" ? Number(value) : value;
        if (typeof num !== "number" || !Number.isFinite(num)) throw new UserError(`Field "${key}" must be a number`);
        value = num;
        break;
      }
      case "CHECKBOX":
        if (typeof value !== "boolean") throw new UserError(`Field "${key}" must be true or false`);
        break;
      case "DATE":
        if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) throw new UserError(`Field "${key}" must be a valid date`);
        break;
      case "SELECT": {
        const allowed = Array.isArray(field.options)
          ? field.options.map((o) => (typeof o === "object" && o !== null ? (o as { value?: unknown }).value : o))
          : [];
        if (allowed.length > 0 && !allowed.includes(value)) throw new UserError(`Field "${key}" has an invalid option`);
        break;
      }
      default:
        if (typeof value !== "string") throw new UserError(`Field "${key}" must be text`);
    }
    clean[key] = value;
  }

  if (!partial) {
    for (const field of fields) {
      if (!field.required) continue;
      const value = clean[field.name];
      if (value === undefined || value === null || value === "") throw new UserError(`Field "${field.name}" is required`);
    }
  }
  return clean;
}
