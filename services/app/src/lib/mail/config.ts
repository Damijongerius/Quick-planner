export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

type Env = Record<string, string | undefined>;

/** SMTP settings from the environment, or null when email isn't set up (the app then works without it). */
export function mailConfig(env: Env = process.env): MailConfig | null {
  const host = env.SMTP_HOST?.trim();
  if (!host) return null;
  const port = Number(env.SMTP_PORT) || 587;
  const user = env.SMTP_USER?.trim() || undefined;
  const from = env.EMAIL_FROM?.trim() || (user?.includes("@") ? user : "");
  if (!from) return null;
  return {
    host,
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
    user,
    pass: env.SMTP_PASS || undefined,
    from,
  };
}

/** Where links in emails point. */
export function appBaseUrl(env: Env = process.env): string {
  return (env.APP_URL || env.AUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
}

export interface ProviderFlags { google: boolean; github: boolean; email: boolean; dev: boolean }

/** Which sign-in methods are configured. The sign-in page only offers these. */
export function enabledProviders(env: Env = process.env, devLogin = false): ProviderFlags {
  return {
    google: !!(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
    github: !!(env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET),
    email: mailConfig(env) !== null,
    dev: devLogin,
  };
}
