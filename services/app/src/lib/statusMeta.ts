export const STATUS_META: Record<string, { label: string; color: string }> = {
  TODO: { label: "To do", color: "var(--faint)" },
  IN_PROGRESS: { label: "In progress", color: "var(--info)" },
  REVIEW: { label: "In review", color: "var(--warning)" },
  DONE: { label: "Done", color: "var(--success)" },
};

export const STATUS_ORDER = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;

export function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, color: "var(--faint)" };
}

export const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({ value, label: STATUS_META[value].label, color: STATUS_META[value].color }));

export function formatShortDate(value: string | Date | null | undefined): string {
  if (!value) return "";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** History stores raw status codes ("IN_PROGRESS", "DONE (Auto)"); show them the way the UI does. */
export function prettyHistoryValue(value: string): string {
  const auto = value.endsWith(" (Auto)");
  const code = auto ? value.slice(0, -" (Auto)".length) : value;
  const meta = STATUS_META[code];
  return meta ? `${meta.label}${auto ? " (auto)" : ""}` : value;
}
