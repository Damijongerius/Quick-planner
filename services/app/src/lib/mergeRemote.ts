/**
 * Reconciling an item you have open with a teammate's change to it.
 *
 *   baseline = the values as last known from the server (what we loaded, or last saved/merged)
 *   local    = what is in the form right now
 *   remote   = what the server has now
 *
 * Per field:
 *   - they didn't change it                -> nothing
 *   - they changed it, you didn't touch it -> take theirs, silently
 *   - you both changed it to the same value -> converged, nothing to resolve
 *   - you both changed it differently       -> conflict: keep yours until you choose
 * Nothing is ever overwritten without the person editing it deciding.
 */
export type Fields = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  content: Record<string, unknown>;
};

export type Conflict = { key: string; label: string; mine: string; theirs: string };

const SCALARS = ["title", "description", "startDate", "endDate"] as const;
const LABELS: Record<(typeof SCALARS)[number], string> = { title: "Title", description: "Description", startDate: "Start date", endDate: "End date" };

/** "" / null / undefined are all "empty", and 5 equals "5" (number inputs hand back strings). */
export function norm(value: unknown): string {
  return value === undefined || value === null ? "" : String(value);
}

export const sameValue = (a: unknown, b: unknown) => norm(a) === norm(b);

/** Field keys that differ: "title", "description", ..., "content:<field name>". */
export function dirtyKeys(baseline: Fields, local: Fields): string[] {
  const keys: string[] = [];
  for (const k of SCALARS) if (!sameValue(baseline[k], local[k])) keys.push(k);
  for (const name of new Set([...Object.keys(baseline.content), ...Object.keys(local.content)])) {
    if (!sameValue(baseline.content[name], local.content[name])) keys.push(`content:${name}`);
  }
  return keys;
}

export function mergeRemote(baseline: Fields, local: Fields, remote: Fields): { baseline: Fields; local: Fields; conflicts: Conflict[] } {
  const nextBase: Fields = { ...baseline, content: { ...baseline.content } };
  const nextLocal: Fields = { ...local, content: { ...local.content } };
  const conflicts: Conflict[] = [];

  const reconcile = (key: string, label: string, b: unknown, l: unknown, r: unknown, apply: (v: unknown, target: "base" | "local") => void) => {
    if (sameValue(r, b)) return; // they didn't change it
    const dirty = !sameValue(l, b);
    apply(r, "base"); // from now on the server's value is what "unchanged" means
    if (!dirty) apply(r, "local");
    else if (!sameValue(l, r)) conflicts.push({ key, label, mine: norm(l), theirs: norm(r) });
  };

  for (const k of SCALARS) {
    reconcile(k, LABELS[k], baseline[k], local[k], remote[k], (v, target) => {
      (target === "base" ? nextBase : nextLocal)[k] = norm(v);
    });
  }
  for (const name of new Set([...Object.keys(baseline.content), ...Object.keys(local.content), ...Object.keys(remote.content)])) {
    reconcile(`content:${name}`, name, baseline.content[name], local.content[name], remote.content[name], (v, target) => {
      (target === "base" ? nextBase : nextLocal).content[name] = v;
    });
  }
  return { baseline: nextBase, local: nextLocal, conflicts };
}
