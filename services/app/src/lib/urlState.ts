/** Pure helpers for keeping filter state in the URL (so a filtered page can be bookmarked or shared). */

export type Codec<T> = {
  parse: (raw: string | null) => T;
  /** The string to put in the URL, or null to leave the parameter out (it equals the default). */
  serialize: (value: T) => string | null;
};

export const stringCodec: Codec<string> = {
  parse: (raw) => raw ?? "",
  serialize: (v) => (v ? v : null),
};

/** `?key=1` means true; absent means false. */
export const flagCodec: Codec<boolean> = {
  parse: (raw) => raw === "1",
  serialize: (v) => (v ? "1" : null),
};

/** Comma separated list. */
export const listCodec: Codec<string[]> = {
  parse: (raw) => (raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : []),
  serialize: (v) => (v.length ? v.join(",") : null),
};

/** A string where the empty string / the given default are not written to the URL. */
export function stringWithDefault(def: string): Codec<string> {
  return { parse: (raw) => raw ?? def, serialize: (v) => (v && v !== def ? v : null) };
}

/** URL keys each page owns. Saved views only keep these, so a view can never smuggle in anything else. */
export const VIEW_KEYS = {
  board: ["sprint", "q", "assignee", "types", "group"],
  backlog: ["q", "assignee", "done", "archived", "cols"],
  timeline: ["q", "assignee", "types", "group"],
} as const;
export type ViewPage = keyof typeof VIEW_KEYS;

export function isViewPage(value: unknown): value is ViewPage {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(VIEW_KEYS, value);
}

/** The part of a query string that belongs to `page`, normalised (sorted keys, no empties). */
export function pickViewQuery(search: string, page: ViewPage): string {
  const incoming = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const picked = new URLSearchParams();
  for (const key of [...VIEW_KEYS[page]].sort()) {
    const value = incoming.get(key);
    if (value) picked.set(key, value.slice(0, 500));
  }
  return picked.toString();
}

export function sameQuery(a: string, b: string): boolean {
  const norm = (q: string) => [...new URLSearchParams(q).entries()].sort(([x], [y]) => x.localeCompare(y)).map(([k, v]) => `${k}=${v}`).join("&");
  return norm(a) === norm(b);
}

export const APPLY_VIEW_EVENT = "qp:apply-view";
