/** Manual ordering helpers (pure). Items carry a numeric `position`; lower sorts first, ties fall back to creation time. */
export const POSITION_STEP = 1024;

type Ranked = { position?: number | null; createdAt: string | Date };

export function byRank<T extends Ranked>(a: T, b: T): number {
  const pa = a.position ?? 0;
  const pb = b.position ?? 0;
  if (pa !== pb) return pa - pb;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

/** Returns `ids` with the item at `from` moved to `to` (indexes into the same list). */
export function moveInList<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || from >= items.length || to < 0 || to >= items.length) return items.slice();
  const next = items.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Positions to store so that `orderedIds` end up in exactly that order, starting at `base`. */
export function assignPositions(orderedIds: string[], base = 0): Map<string, number> {
  return new Map(orderedIds.map((id, index) => [id, base + index * POSITION_STEP]));
}

/** The order a list takes when `dragId` is dropped at `destIndex` (an index in the list as it looks after the drop). */
export function placeInList(currentIds: string[], dragId: string, destIndex: number): string[] {
  const without = currentIds.filter((id) => id !== dragId);
  const index = Math.max(0, Math.min(destIndex, without.length));
  without.splice(index, 0, dragId);
  return without;
}
