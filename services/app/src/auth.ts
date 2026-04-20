import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      // For this "Quick" app, we'll use a simplified credentials provider
      // In a real app, you'd verify passwords with bcrypt
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        // Find or create user for this quick demo
        let user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              email: credentials.email as string,
              name: (credentials.email as string).split('@')[0],
            },
          })
        }

        return user
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/planner') || nextUrl.pathname.startsWith('/settings');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false;
      }
      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})
