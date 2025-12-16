import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import prisma from "@/lib/db";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!passwordMatch) {
          return null;
        }

        const membership = await prisma.membership.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: "asc" },
        });

        return {
          id: user.id,
          email: user.email,
          orgId: membership?.orgId ?? null,
          role: membership?.role ?? null,
        } satisfies {
          id: string;
          email: string;
          orgId: string | null;
          role: Role | null;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.orgId = (user as { orgId?: string | null }).orgId ?? null;
        token.role = (user as { role?: Role | null }).role ?? null;
      }

      if (token.userId && (!token.orgId || !token.role)) {
        const membership = await prisma.membership.findFirst({
          where: { userId: token.userId as string },
          orderBy: { createdAt: "asc" },
        });

        token.orgId = membership?.orgId ?? null;
        token.role = membership?.role ?? null;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.orgId = (token.orgId as string | null) ?? null;
        session.user.role = (token.role as Role | null) ?? null;
      }

      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
