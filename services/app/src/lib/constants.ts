export const NODE_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
export type NodeStatus = (typeof NODE_STATUSES)[number];

export const SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED"] as const;

export const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "CHECKBOX", "SELECT"] as const;

export const MAX_TITLE_LENGTH = 200;
export const MAX_NAME_LENGTH = 120;

export function isNodeStatus(value: unknown): value is NodeStatus {
  return typeof value === "string" && (NODE_STATUSES as readonly string[]).includes(value);
}
