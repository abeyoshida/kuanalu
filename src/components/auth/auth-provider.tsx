"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "@/lib/auth/client";

// Create a context for authentication
const AuthContext = createContext<ReturnType<typeof useSession> | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  
  return (
    <AuthContext.Provider value={session}>
      {children}
    </AuthContext.Provider>
  );
} 