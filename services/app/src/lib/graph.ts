// Pure graph traversal over caller-supplied edge lookups (one call per level, so a deep tree
// costs one query per level, not per node). Visited sets make every walk safe on cyclic data.

/** True if `target` can be reached from `start` (or they are the same node). */
export async function isReachable(
  start: string,
  target: string,
  next: (ids: string[]) => Promise<string[]>
): Promise<boolean> {
  if (start === target) return true;
  const seen = new Set<string>([start]);
  let frontier = [start];
  while (frontier.length > 0) {
    const found: string[] = [];
    for (const id of await next(frontier)) {
      if (id === target) return true;
      if (!seen.has(id)) {
        seen.add(id);
        found.push(id);
      }
    }
    frontier = found;
  }
  return false;
}

/**
 * Breadth-first collection of everything below `rootId` (excluding it).
 * `include` decides whether a child, and therefore its whole subtree, is followed.
 */
export async function collectDescendants<T extends { id: string }>(
  rootId: string,
  getChildren: (parentIds: string[]) => Promise<T[]>,
  include: (child: T) => boolean = () => true
): Promise<string[]> {
  const seen = new Set<string>([rootId]);
  const result: string[] = [];
  let frontier = [rootId];
  while (frontier.length > 0) {
    const found: string[] = [];
    for (const child of await getChildren(frontier)) {
      if (seen.has(child.id) || !include(child)) continue;
      seen.add(child.id);
      result.push(child.id);
      found.push(child.id);
    }
    frontier = found;
  }
  return result;
}
