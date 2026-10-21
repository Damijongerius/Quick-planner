// Who is acting. Normally that is the signed-in session; API requests run "as" the owner of the token.
// Not a "use server" file.

import { auth } from "@/auth";
import { actingStore as store } from "@/lib/actingStore";

/**
 * Run `fn` as another user. Only the API layer calls this, after it has verified a token; a browser can never
 * reach it because server actions run in their own request context.
 */
export function runAsUser<T>(userId: string, fn: () => Promise<T>, options: { readOnly?: boolean } = {}): Promise<T> {
  return store.run({ userId, readOnly: !!options.readOnly }, fn);
}

export async function currentUserId(): Promise<string | null> {
  const acting = store.getStore();
  if (acting) return acting.userId;
  return (await auth())?.user?.id ?? null;
}

/** True while running for a read-only API token. */
export function isReadOnlyToken(): boolean {
  return store.getStore()?.readOnly === true;
}
