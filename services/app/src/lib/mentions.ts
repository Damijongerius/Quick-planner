/**
 * @mentions. In a comment body a mention is stored as `[@Alex Rivera](user:USERID)` so it survives renames and can be
 * resolved on the server; people type plain `@Alex Rivera` and `convertMentions` turns that into tokens when sending.
 */
const TOKEN = /\[@([^\]\n]{1,80})\]\(user:([\w-]{6,40})\)/g;

export type MentionCandidate = { id: string; name: string };
export type BodyPart = { type: "text"; text: string } | { type: "mention"; name: string; userId: string };

/** Unique user ids mentioned by tokens in `body`. */
export function extractMentionIds(body: string): string[] {
  const ids = new Set<string>();
  for (const match of body.matchAll(TOKEN)) ids.add(match[2]);
  return [...ids];
}

/** Split a stored body into plain text and mention chips, for rendering. */
export function splitBody(body: string): BodyPart[] {
  const parts: BodyPart[] = [];
  let last = 0;
  for (const match of body.matchAll(TOKEN)) {
    if (match.index > last) parts.push({ type: "text", text: body.slice(last, match.index) });
    parts.push({ type: "mention", name: match[1], userId: match[2] });
    last = match.index + match[0].length;
  }
  if (last < body.length) parts.push({ type: "text", text: body.slice(last) });
  return parts;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Turn `@Name` typed by a person into mention tokens. Longest names first (so "Alex Rivera" wins over "Alex"),
 * matched case-insensitively, only at a word boundary and not inside an existing token.
 */
export function convertMentions(text: string, candidates: MentionCandidate[]): string {
  const sorted = [...candidates].filter((c) => c.name.trim()).sort((a, b) => b.name.length - a.name.length);
  let result = text;
  for (const person of sorted) {
    const pattern = new RegExp(`(^|[\\s(])@${escapeRegex(person.name)}(?![\\p{L}\\p{N}_])`, "giu");
    result = result.replace(pattern, (_m, lead: string) => `${lead}[@${person.name}](user:${person.id})`);
  }
  return result;
}

/** The mention being typed at the caret (`@Al|`), if any: its start index and the partial text after the `@`. */
export function activeMention(text: string, caret: number): { start: number; query: string } | null {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  if (at > 0 && !/\s|\(/.test(before[at - 1])) return null; // e.g. an email address
  const query = before.slice(at + 1);
  if (/[\n\]]/.test(query) || query.length > 40) return null;
  return { start: at, query };
}

/** Human-readable text of a body (mentions shown as @Name), e.g. for notifications. */
export function plainText(body: string): string {
  return body.replace(TOKEN, "@$1");
}
