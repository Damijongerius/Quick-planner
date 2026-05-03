import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true, // Needed for forced migration via email matching
    }),
    Credentials({
      name: "Legacy Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { accounts: true }
        })

        // 1. If user doesn't exist, they MUST use Google (New User)
        if (!user) {
          throw new Error("USER_NOT_FOUND");
        }

        // 2. If user already has a Google account, force them to use it
        if (user.accounts.some(acc => acc.provider === 'google')) {
            throw new Error("MIGRATED_TO_GOOGLE");
        }

        // 3. For existing legacy users, allow login so they can link Google
        // In a production app, you would verify the password here.
        // Since the current schema doesn't have a password field, we allow
        // the existing user to identify themselves by email to start migration.
        return user
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
        
        // Check if user has a Google account linked
        const userWithAccounts = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { accounts: true }
        });
        
        (session.user as any).isMigrated = userWithAccounts?.accounts.some(acc => acc.provider === 'google') || false;
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = nextUrl.pathname.startsWith('/projects') || 
                          nextUrl.pathname.startsWith('/project') || 
                          nextUrl.pathname.startsWith('/profile');
      
      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
})
