import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google,
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
  },
})
