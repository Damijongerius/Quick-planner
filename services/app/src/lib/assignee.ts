/** Filter values for "who is this assigned to": everyone, me, nobody, or a specific person's id. */
export type AssigneeFilter = "all" | "me" | "none" | (string & {});

export function matchesAssignee(assigneeId: string | null | undefined, filter: AssigneeFilter, currentUserId: string): boolean {
  switch (filter) {
    case "all": return true;
    case "me": return assigneeId === currentUserId;
    case "none": return !assigneeId;
    default: return assigneeId === filter;
  }
}
