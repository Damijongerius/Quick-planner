// The AsyncLocalStorage behind "who is acting". Kept free of imports so any server module can use it.

import { AsyncLocalStorage } from "node:async_hooks";

export interface ActingContext { userId: string; readOnly: boolean }
export const actingStore = new AsyncLocalStorage<ActingContext>();

/** True while handling an API request (as opposed to a click in the app). */
export function isApiContext(): boolean {
  return actingStore.getStore() !== undefined;
}
