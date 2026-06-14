import { app, safeStorage } from "electron"
import * as fs from "fs"
import * as path from "path"

const FILE_NAME = "auth.dat"

export interface StoredAuth {
  access_token: string
  refresh_token: string
  user_id: string
  phone: string
  // Wall-clock expiry of access token in epoch seconds. Renderer uses this to know
  // when to refresh proactively (vs reactively on a 401).
  access_expires_at: number
  refresh_expires_at: number
}

export class AuthStorage {
  private readonly filePath: string

  constructor() {
    this.filePath = path.join(app.getPath("userData"), FILE_NAME)
  }

  /** Returns null if no stored auth or if decryption fails (corrupted file / keychain reset). */
  read(): StoredAuth | null {
    if (!fs.existsSync(this.filePath)) return null
    try {
      const encrypted = fs.readFileSync(this.filePath)
      if (!safeStorage.isEncryptionAvailable()) {
        console.warn("[AuthStorage] safeStorage not available; refusing to read plaintext")
        return null
      }
      const json = safeStorage.decryptString(encrypted)
      return JSON.parse(json) as StoredAuth
    } catch (err) {
      console.warn("[AuthStorage] failed to read auth file, treating as logged out:", err)
      return null
    }
  }

  write(auth: StoredAuth): void {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error("safeStorage encryption unavailable on this platform")
    }
    const encrypted = safeStorage.encryptString(JSON.stringify(auth))
    fs.writeFileSync(this.filePath, encrypted, { mode: 0o600 })
  }

  clear(): void {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath)
    }
  }
}
