import type { StoredAuth } from "@/types/electron"

const DEFAULT_BACKEND = "http://localhost:8765"
export const BACKEND_URL =
  (import.meta.env.VITE_AUTH_BACKEND_URL as string | undefined)?.replace(/\/$/, "") ?? DEFAULT_BACKEND

export interface SmsSendResult {
  sent: boolean
  request_id: string
}

export interface TokenResponse {
  user_id: string
  phone: string
  access_token: string
  refresh_token: string
  access_expires_in: number
  refresh_expires_in: number
}

export interface UserProfile {
  id: string
  phone: string
  created_at: string
  last_login_at: string
}

export class AuthError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "AuthError"
  }
}

async function postJson<T>(path: string, body: object): Promise<T> {
  const resp = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const detail = await resp.text()
    let parsed: string
    try {
      parsed = JSON.parse(detail).detail ?? detail
    } catch {
      parsed = detail
    }
    throw new AuthError(resp.status, parsed || resp.statusText)
  }
  return (await resp.json()) as T
}

export function sendSmsCode(phone: string, captchaToken: string): Promise<SmsSendResult> {
  return postJson<SmsSendResult>("/auth/sms/send", { phone, captcha_token: captchaToken })
}

export function verifySmsCode(phone: string, code: string): Promise<TokenResponse> {
  return postJson<TokenResponse>("/auth/sms/verify", { phone, code })
}

export function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  return postJson<TokenResponse>("/auth/refresh", { refresh_token: refreshToken })
}

export async function fetchMe(accessToken: string): Promise<UserProfile> {
  const resp = await fetch(`${BACKEND_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!resp.ok) {
    const detail = await resp.text()
    throw new AuthError(resp.status, detail || resp.statusText)
  }
  return (await resp.json()) as UserProfile
}

/** Convert a TokenResponse from the backend into the StoredAuth shape persisted by safeStorage. */
export function toStored(resp: TokenResponse): StoredAuth {
  const now = Math.floor(Date.now() / 1000)
  return {
    access_token: resp.access_token,
    refresh_token: resp.refresh_token,
    user_id: resp.user_id,
    phone: resp.phone,
    access_expires_at: now + resp.access_expires_in,
    refresh_expires_at: now + resp.refresh_expires_in,
  }
}
