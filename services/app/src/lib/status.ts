/**
 * Status a parent should move to given its children, or null when it should stay as is.
 *  - every child DONE                          -> DONE
 *  - a DONE parent with an unfinished child    -> IN_PROGRESS (reopened)
 *  - a TODO parent with any started child      -> IN_PROGRESS
 * `childStatuses` must already exclude archived children.
 */
export function deriveParentStatus(parentStatus: string, childStatuses: string[]): string | null {
  if (childStatuses.length === 0) return null;
  if (childStatuses.every((s) => s === "DONE")) return parentStatus === "DONE" ? null : "DONE";
  if (parentStatus === "DONE") return "IN_PROGRESS";
  if (parentStatus === "TODO" && childStatuses.some((s) => s !== "TODO")) return "IN_PROGRESS";
  return null;
}

/**
 * `completedAt` should be the moment an item last became DONE, and empty otherwise.
 * Returns the value to store, or `undefined` to leave the column alone (status didn't cross the DONE line).
 */
export function completedAtFor(oldStatus: string | null, newStatus: string, now: Date = new Date()): Date | null | undefined {
  const wasDone = oldStatus === "DONE";
  const isDone = newStatus === "DONE";
  if (isDone && !wasDone) return now;
  if (!isDone && wasDone) return null;
  return undefined;
}
