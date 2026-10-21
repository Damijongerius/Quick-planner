import type { Node } from "./types";

export interface DependencyEdge {
  /** The item that has to finish first. */
  from: string;
  /** The item that waits for it. */
  to: string;
  /** The waiting item is scheduled to start before (or on the day) the blocker ends. */
  conflict: boolean;
}

/** Calendar day as a sortable number (local time), so "same day" compares equal regardless of the hour. */
function dayNumber(value: string | Date): number {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** A dependent item must start the day after its blocker ends. */
export function isScheduleConflict(blocker: Pick<Node, "endDate">, blocked: Pick<Node, "startDate" | "createdAt">): boolean {
  if (!blocker.endDate) return false;
  const start = blocked.startDate ?? blocked.createdAt;
  return dayNumber(start) <= dayNumber(blocker.endDate);
}

/** Every "blocked by" link between active items, flagged when the dates don't work. */
export function dependencyEdges(nodes: Node[]): DependencyEdge[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: DependencyEdge[] = [];
  for (const node of nodes) {
    if (node.isArchived) continue;
    for (const link of node.blockedBy ?? []) {
      const blocker = byId.get(link.blockingNode.id) ?? link.blockingNode;
      if (blocker.isArchived) continue;
      edges.push({ from: blocker.id, to: node.id, conflict: isScheduleConflict(blocker, node) });
    }
  }
  return edges;
}
