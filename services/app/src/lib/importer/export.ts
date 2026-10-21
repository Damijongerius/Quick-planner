import { toCsv } from "./csv";
import { statusLabel } from "./labels";
import type { OwnExport } from "./formats";
import type { ImportItem } from "./types";

/** The file a person can open in a spreadsheet, and that this app's importer reads back. */
export function exportToCsv(data: Pick<OwnExport, "items">): string {
  const items = data.items ?? [];
  const fieldNames: string[] = [];
  for (const item of items) for (const name of Object.keys(item.fields ?? {})) if (!fieldNames.includes(name)) fieldNames.push(name);

  const header = ["ID", "Type", "Title", "Description", "Status", "Parent ID", "Assignee", "Sprint", "Start date", "Due date", "Completed on", "Blocked by", "Archived", ...fieldNames];
  const rows = items.map((i: ImportItem) => [
    i.ref,
    i.type ?? "",
    i.title,
    i.description ?? "",
    statusLabel(i.status ?? i.rawStatus),
    i.parentRef ?? "",
    i.assignee ?? "",
    i.sprint ?? "",
    i.startDate ?? "",
    i.endDate ?? "",
    i.completedAt ?? "",
    (i.blockedBy ?? []).join("; "),
    i.archived ? "yes" : "",
    ...fieldNames.map((n) => i.fields?.[n] ?? ""),
  ]);
  return toCsv([header, ...rows]);
}

export function exportToJson(data: OwnExport): string {
  return JSON.stringify(data, null, 2);
}
