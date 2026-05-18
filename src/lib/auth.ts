import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "FARMER", // By user request, Google signin is for farmers
        };
      },
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "shop1" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const portal = (credentials as any).portal as string | undefined;

        if (portal) {
          if (portal === "shopowner" && credentials.username === "shop1" && credentials.password === "shop1") {
            return { id: "shop1", email: "shop1@agri.com", name: "Shop Owner", role: "SHOP_OWNER" };
          }
          if (portal === "delivery" && credentials.username === "del1" && credentials.password === "del1") {
            return { id: "del1", email: "del1@agri.com", name: "Delivery Partner", role: "DELIVERY" };
          }
          if (portal === "admin" && credentials.username === "admin" && credentials.password === "admin") {
            return { id: "admin", email: "admin@agri.com", name: "Administrator", role: "ADMIN" };
          }
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: credentials.username },
              { name: credentials.username },
            ],
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 365 * 24 * 60 * 60, // 365 days (1 year persistence)
    updateAge: 24 * 60 * 60,    // update daily
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        if (!existingUser) {
          return `/login?error=NoUserFound&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name || "")}`;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "CUSTOMER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  }
};
