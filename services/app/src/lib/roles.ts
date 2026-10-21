/**
 * Project roles. The owner is `Project.userId`; everyone else is a ProjectMember.
 *  - OWNER : everything, including members, archive and delete
 *  - EDITOR: create / change / delete project content
 *  - VIEWER: read everything and comment, but not change content
 */
export type ProjectRole = "OWNER" | "EDITOR" | "VIEWER";

export const INVITABLE_ROLES = ["EDITOR", "VIEWER"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const ROLE_LABEL: Record<ProjectRole, string> = { OWNER: "Owner", EDITOR: "Editor", VIEWER: "Viewer" };
export const ROLE_HINT: Record<ProjectRole, string> = {
  OWNER: "Full control, including members and deleting the project.",
  EDITOR: "Can create and change items, sprints and settings.",
  VIEWER: "Can view everything and comment, but not change anything.",
};

export function isProjectRole(value: unknown): value is ProjectRole {
  return value === "OWNER" || value === "EDITOR" || value === "VIEWER";
}

export function isInvitableRole(value: unknown): value is InvitableRole {
  return value === "EDITOR" || value === "VIEWER";
}

export function canEdit(role: ProjectRole): boolean {
  return role === "OWNER" || role === "EDITOR";
}

export function canManage(role: ProjectRole): boolean {
  return role === "OWNER";
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lower-cased, trimmed email, or null when it doesn't look like one. */
export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}
