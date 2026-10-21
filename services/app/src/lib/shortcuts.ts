/** Keyboard shortcut definitions (pure, so they can be tested and shown in the help dialog from one source). */

/** "g" followed by one of these goes to a page. */
export const GO_SHORTCUTS: Record<string, { label: string; path: string }> = {
  b: { label: "Board", path: "board" },
  l: { label: "Backlog", path: "backlog" },
  t: { label: "Timeline", path: "timeline" },
  p: { label: "Sprint planning", path: "planning" },
  s: { label: "Sprints", path: "sprints" },
  r: { label: "Reports", path: "reports" },
  m: { label: "Members", path: "settings/members" },
  i: { label: "Item types", path: "settings/nodes" },
  h: { label: "History", path: "history" },
};

export const SHORTCUT_HELP: { keys: string[]; label: string }[] = [
  ...Object.entries(GO_SHORTCUTS).map(([key, v]) => ({ keys: ["g", key], label: `Go to ${v.label}` })),
  { keys: ["/"], label: "Search or filter this page" },
  { keys: ["c"], label: "Create a new item" },
  { keys: ["["], label: "Previous sprint (Board)" },
  { keys: ["]"], label: "Next sprint (Board)" },
  { keys: ["?"], label: "Show this help" },
  { keys: ["Esc"], label: "Close a panel or dialog" },
];

/** How long after pressing "g" the next key still counts as part of the sequence. */
export const SEQUENCE_TIMEOUT_MS = 1200;

export function goPathFor(key: string): string | null {
  return GO_SHORTCUTS[key.toLowerCase()]?.path ?? null;
}

/** Keys that must never trigger a shortcut because the person is typing. */
export function isTypingElement(el: { tagName?: string; isContentEditable?: boolean; getAttribute?: (name: string) => string | null } | null): boolean {
  if (!el) return false;
  const tag = (el.tagName ?? "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (el.isContentEditable) return true;
  return el.getAttribute?.("role") === "textbox";
}
