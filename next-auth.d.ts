import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";
import NextAuth from "next-auth";

import type { User } from "next-auth";
import "next-auth/jwt";

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
  agencyDetailsId: string | null;
  gpProfileId: string | null;
  menuControls: string[];
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

type UserId = string;

declare module "next-auth/jwt" {
  interface JWT {
    id: UserId;
    role: UserRole;
    agencyDetailsId: string | null;
    gpProfileId: string | null;
    menuControls: string[];
  }
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: User & {
      id: UserId;
      role: UserRole;
      agencyDetailsId: string | null;
      gpProfileId: string | null;
      menuControls: string[];
    };
  }
}
