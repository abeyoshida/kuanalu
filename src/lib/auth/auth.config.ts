import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Extend the default session and JWT types to include custom properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    };
  }

  interface User {
    id: string;
    role?: string;
  }
  
  interface JWT {
    id: string;
    role?: string;
  }
}

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/register",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_do_not_use_in_production",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Disable automatic session fetching on client side
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnProject = nextUrl.pathname.startsWith("/projects");
      const isOnTask = nextUrl.pathname.startsWith("/task");
      
      if (isOnDashboard || isOnProject || isOnTask) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return true;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // @ts-expect-error - NextAuth types are not compatible with Next.js App Router
      async authorize(credentials) {
        // This is a simplified version for debugging
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // For testing purposes, allow any login
        // In production, replace this with proper authentication
        return {
          id: "1",
          name: "Test User",
          email: credentials.email,
          role: "admin"
        };
      },
    }),
  ],
}; 