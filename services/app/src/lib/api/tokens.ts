import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export const TOKEN_PREFIX = "qp_";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** A new random token. The plain value is shown to the person once; only its hash is stored. */
export function generateToken(): { token: string; hash: string; prefix: string } {
  const token = `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
  return { token, hash: hashToken(token), prefix: token.slice(0, 11) };
}

/** The token from an "Authorization: Bearer qp_..." header, or null. */
export function parseBearer(header: string | null | undefined): string | null {
  const match = /^Bearer\s+(qp_[A-Za-z0-9_-]{20,100})\s*$/.exec(header ?? "");
  return match ? match[1] : null;
}

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
