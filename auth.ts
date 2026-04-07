import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./lib/db";
import authConfig from "./auth.config";
import { getUserById } from "./data/user";
import { getTwoFactorConfirmByUserId } from "./data/two-factor-confirm";
import { getAccountUserId } from "./data/account";
import { UserRole } from "@prisma/client";
import { Adapter as CoreAdapter } from "@auth/core/adapters";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  pages: {
    signIn: "/login",
    error: "/error",
  },

  events: {
    async linkAccount({ user }) {
      if (!user) return;

      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "credentials") return true;

      const existingUser = await db.user.findUnique({
        where: { id: user.id },
        include: { gpProfile: true }
      });

      if (!existingUser?.emailVerified) return false;

      // Block access if GP Profile is DEACTIVE
      if (existingUser.gpProfile && existingUser.gpProfile.subscriptionStatus === "DEACTIVE") {
        return false; // Could redirect to a specific error page here if needed
      }

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation =
          await getTwoFactorConfirmByUserId(existingUser.id);

        if (!twoFactorConfirmation) return false;

        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },

    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (session.user) {
        session.user.role = token.role as UserRole;
        session.user.isTwoFactorEnabled =
          token.isTwoFactorEnabled as boolean;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.isOAuth = token.isOAuth as boolean;
        session.user.agencyDetailsId = token.agencyDetailsId as string | null;
        session.user.gpProfileId = token.gpProfileId as string | null;
        session.user.menuControls = (token.menuControls as string[]) || [];
      }

      return session;
    },

    async jwt({ token, trigger }) {
      if (!token.sub) return token;

      // 🔁 When client calls update() → renew session
      if (trigger === "update") {
        token.exp = Math.floor(Date.now() / 1000) + 15 * 60;
        return token;
      }

      const existingUser = await getUserById(token.sub);
      if (!existingUser) return token;

      const existingAccount = await getAccountUserId(existingUser.id);

      token.isOAuth = !!existingAccount;
      token.name = existingUser.name;
      token.email = existingUser.email;
      token.role = existingUser.role;
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled;
      token.agencyDetailsId = existingUser.agencyDetailsId;
      token.gpProfileId = existingUser.gpProfileId;

      // Extract menuControls if present using Prisma include relation (GP Profile is included in getAccountUserId?
      // Wait, getUserById in trigger="update" doesn't include gpProfile but we added it in signIn.
      // We should probably fetch the GPProfile again here to be safe, since jwt callback fires often.
      const userWithGP = await db.user.findUnique({
        where: { id: existingUser.id },
        include: { gpProfile: true }
      });
      token.menuControls = userWithGP?.gpProfile?.menuControls || [];

      return token;
    },
  },

  adapter: PrismaAdapter(db) as CoreAdapter,

  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },

  ...authConfig,
});
