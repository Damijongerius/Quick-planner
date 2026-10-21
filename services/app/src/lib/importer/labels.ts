import type { ItemStatus } from "./types";

const LABEL: Record<ItemStatus, string> = { TODO: "To do", IN_PROGRESS: "In progress", REVIEW: "In review", DONE: "Done" };

export function statusLabel(status: string | undefined): string {
  if (!status) return "";
  return LABEL[status as ItemStatus] ?? status;
}
