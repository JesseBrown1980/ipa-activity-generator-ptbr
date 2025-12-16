import { Role } from "@prisma/client";
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      email?: string | null;
      orgId: string | null;
      role: Role | null;
    };
  }

  interface User {
    id: string;
    email?: string | null;
    orgId?: string | null;
    role?: Role | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    orgId?: string | null;
    role?: Role | null;
  }
}
