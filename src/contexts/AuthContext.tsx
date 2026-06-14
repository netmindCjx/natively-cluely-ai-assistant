import React, { createContext, useContext } from "react"

import type { StoredAuth } from "@/types/electron"

export interface AuthContextValue {
  auth: StoredAuth
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider: React.FC<{
  value: AuthContextValue
  children: React.ReactNode
}> = ({ value, children }) => <AuthContext.Provider value={value}>{children}</AuthContext.Provider>

/** Reads the current logged-in user's auth bundle. Throws if used outside AuthProvider. */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>")
  return ctx
}
