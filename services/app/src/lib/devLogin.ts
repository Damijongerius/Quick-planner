/**
 * Local-only sign-in so the app can be used without Google OAuth credentials.
 *
 * It is OFF unless AUTH_DEV_LOGIN=true, and even then it only turns on when AUTH_URL points at
 * localhost, so it cannot be enabled by accident on a deployed instance.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isDevLoginEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.AUTH_DEV_LOGIN !== "true") return false;
  try {
    return LOCAL_HOSTS.has(new URL(env.AUTH_URL ?? "").hostname);
  } catch {
    return false;
  }
}

export const DEV_LOGIN_EMAIL_DEFAULT = "dev@localhost";
