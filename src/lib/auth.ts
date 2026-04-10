import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  session: {
    modelName: "authSession",
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Block sign-up for emails not on the allowlist (owner always allowed)
          const ownerEmail = process.env.OWNER_EMAIL;
          if (user.email === ownerEmail) return;
          const allowed = await prisma.allowedEmail.findUnique({
            where: { email: user.email },
          });
          if (!allowed) {
            throw new Error("Not authorized");
          }
        },
      },
    },
  },
});
