import NextAuth from "next-auth"
import type { JWT } from "next-auth/jwt"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Nodemailer from "next-auth/providers/nodemailer"
import Credentials from "next-auth/providers/credentials"
import { isDevLoginEnabled, DEV_LOGIN_EMAIL_DEFAULT } from "@/lib/devLogin"
import { normalizeEmail } from "@/lib/roles"
import { appBaseUrl, mailConfig } from "@/lib/mail/config"
import { magicLinkEmail } from "@/lib/mail/templates"
import { sendMail } from "@/lib/mail/send"
import { Throttle } from "@/lib/mail/throttle"

const MAGIC_LINK_MINUTES = 15
// At most 3 sign-in emails per address per 15 minutes, so the form can't be used to flood someone's inbox.
const magicLinkThrottle = new Throttle(3, MAGIC_LINK_MINUTES * 60_000)
const smtp = mailConfig()

// How long a session token is trusted before we re-check the user in the database.
const USER_REFRESH_MS = 5 * 60 * 1000

type AppToken = JWT & {
  id?: string
  isMigrated?: boolean
  refreshedAt?: number
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Legacy (pre-Google) users are matched to their Google login by email. Google only
      // returns verified addresses, so this is safe for this provider. Do NOT enable it for
      // providers that do not verify email ownership.
      allowDangerousEmailAccountLinking: true,
    }),
    // Optional: only offered when the secrets are configured. Email linking is NOT enabled: a GitHub login for an
    // address that already belongs to another sign-in method is refused rather than silently merged.
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [GitHub({ clientId: process.env.AUTH_GITHUB_ID, clientSecret: process.env.AUTH_GITHUB_SECRET })]
      : []),
    // Magic link by email, when SMTP is configured. Proving you can read the inbox is what authenticates you.
    ...(smtp
      ? [
          Nodemailer({
            server: { host: smtp.host, port: smtp.port, secure: smtp.secure, auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined },
            from: smtp.from,
            maxAge: MAGIC_LINK_MINUTES * 60,
            async sendVerificationRequest({ identifier, url }) {
              if (!magicLinkThrottle.take(identifier.toLowerCase())) throw new Error("Too many sign-in emails for this address. Try again in a few minutes.")
              const result = await sendMail(identifier, magicLinkEmail({ url, host: new URL(appBaseUrl()).host, minutes: MAGIC_LINK_MINUTES }))
              if (!result.sent) throw new Error("The sign-in email could not be sent")
            },
          }),
        ]
      : []),
    // Local development only (see lib/devLogin.ts): sign in as a fixed local user, no password.
    ...(isDevLoginEnabled()
      ? [
          Credentials({
            id: "dev-login",
            name: "Dev login",
            // Any email can be typed, so several local users can be signed in to test collaboration.
            credentials: { email: { label: "Email", type: "email" } },
            async authorize(credentials) {
              if (!isDevLoginEnabled()) return null
              const email = normalizeEmail(credentials?.email) || process.env.AUTH_DEV_LOGIN_EMAIL || DEV_LOGIN_EMAIL_DEFAULT
              return prisma.user.upsert({
                where: { email },
                update: {},
                create: { email, name: email.split("@")[0], emailVerified: new Date() },
              })
            },
          }),
        ]
      : []),
    // The old email-only "Legacy Credentials" provider was removed: the schema stores no
    // password, so it let anyone sign in as any legacy user by typing their email. Legacy
    // users now simply sign in with the Google account that has the same email address.
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      const t = token as AppToken
      if (user?.id) {
        t.id = user.id
        t.refreshedAt = 0
      }
      if (!t.id) return t

      // Refresh profile data (and detect deleted users) periodically rather than on every request.
      if (!t.refreshedAt || Date.now() - t.refreshedAt > USER_REFRESH_MS) {
        const dbUser = await prisma.user.findUnique({
          where: { id: t.id },
          select: {
            name: true,
            email: true,
            image: true,
            emailVerified: true,
            accounts: { select: { provider: true } },
          },
        })
        // User no longer exists (e.g. local DB wipe): drop the session to force re-auth.
        if (!dbUser) return null

        t.name = dbUser.name
        t.email = dbUser.email
        t.picture = dbUser.image
        // The local dev user has no Google account by design; don't show the "link Google" gate for it.
        // Legacy users (from before OAuth) are asked to link an account once; email-verified and OAuth users are done.
        t.isMigrated = isDevLoginEnabled() || dbUser.accounts.length > 0 || dbUser.emailVerified !== null
        t.refreshedAt = Date.now()
      }
      return t
    },
    async session({ session, token }) {
      const t = token as AppToken
      if (t.id && session.user) {
        session.user.id = t.id
        session.user.name = (t.name as string | null | undefined) ?? ""
        session.user.email = (t.email as string | null | undefined) ?? ""
        session.user.image = (t.picture as string | null | undefined) ?? ""
        ;(session.user as { isMigrated?: boolean }).isMigrated = Boolean(t.isMigrated)
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith('/projects') ||
        nextUrl.pathname.startsWith('/project') ||
        nextUrl.pathname.startsWith('/profile') ||
        nextUrl.pathname.startsWith('/invite');

      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // There is no /auth/error page; the sign-in page renders ?error=... itself.
    error: "/auth/signin",
    verifyRequest: "/auth/signin?check=email",
  },
})
