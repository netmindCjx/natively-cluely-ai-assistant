import { useCallback, useEffect, useState } from "react"

import {
  AuthError,
  fetchMe,
  refreshTokens,
  toStored,
  verifySmsCode,
} from "@/lib/auth/authClient"
import type { StoredAuth } from "@/types/electron"

type AuthState =
  | { status: "loading" }
  | { status: "authenticated"; auth: StoredAuth }
  | { status: "unauthenticated" }

const REFRESH_LEAD_SECONDS = 60

/**
 * Auth state hook. On mount:
 *   1. Reads stored tokens from main process.
 *   2. If refresh token is still valid → tries refresh to get a fresh access token, then /me sanity check.
 *   3. Otherwise → unauthenticated.
 *
 * Renders should:
 *   - while `loading` → splash
 *   - while `unauthenticated` → LoginPanel
 *   - while `authenticated` → main app, using `auth.access_token` for backend calls
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  const persistAndSet = useCallback(async (auth: StoredAuth) => {
    await window.electronAPI.auth.setTokens(auth)
    setState({ status: "authenticated", auth })
  }, [])

  const logout = useCallback(async () => {
    await window.electronAPI.auth.clearTokens()
    setState({ status: "unauthenticated" })
  }, [])

  const completeLogin = useCallback(
    async (phone: string, code: string) => {
      const resp = await verifySmsCode(phone, code)
      await persistAndSet(toStored(resp))
    },
    [persistAndSet],
  )

  const restore = useCallback(async () => {
    const stored = await window.electronAPI.auth.getTokens()
    if (!stored) {
      setState({ status: "unauthenticated" })
      return
    }
    const now = Math.floor(Date.now() / 1000)
    if (stored.refresh_expires_at <= now) {
      await window.electronAPI.auth.clearTokens()
      setState({ status: "unauthenticated" })
      return
    }
    // Access still valid → optimistic auth + background sanity check via /me.
    if (stored.access_expires_at > now + REFRESH_LEAD_SECONDS) {
      setState({ status: "authenticated", auth: stored })
      try {
        await fetchMe(stored.access_token)
      } catch (err) {
        if (err instanceof AuthError && err.status === 401) {
          await tryRefresh(stored, persistAndSet, logout)
        }
      }
      return
    }
    await tryRefresh(stored, persistAndSet, logout)
  }, [persistAndSet, logout])

  useEffect(() => {
    void restore()
  }, [restore])

  // The main process (CloudClient) broadcasts this when a token refresh fails on a data
  // request — drop straight to the login panel.
  useEffect(() => {
    const unsubscribe = window.electronAPI?.onAuthSessionExpired?.(() => {
      setState({ status: "unauthenticated" })
    })
    return () => unsubscribe?.()
  }, [])

  return { state, completeLogin, logout, restore }
}

async function tryRefresh(
  stored: StoredAuth,
  persistAndSet: (a: StoredAuth) => Promise<void>,
  logout: () => Promise<void>,
) {
  try {
    const fresh = await refreshTokens(stored.refresh_token)
    await persistAndSet(toStored(fresh))
  } catch (err) {
    console.warn("[useAuth] refresh failed, signing out:", err)
    await logout()
  }
}
