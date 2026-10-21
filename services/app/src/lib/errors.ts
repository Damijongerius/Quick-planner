/**
 * An expected, user-correctable failure (invalid input, duplicate name, would create a loop, ...).
 * Next.js hides thrown messages from the browser in production builds, so server actions turn these into a
 * returned `{ error }` (see `toResult` in lib/actions/helpers.ts) instead of letting them propagate.
 */
export class UserError extends Error {}

export type ActionResult = { error?: string };
