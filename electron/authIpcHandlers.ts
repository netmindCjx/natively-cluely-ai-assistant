import { ipcMain } from "electron"
import { AuthStorage, StoredAuth } from "./AuthStorage"

const CHANNELS = {
  GET: "auth:get-tokens",
  SET: "auth:set-tokens",
  CLEAR: "auth:clear-tokens",
} as const

export function initializeAuthIpcHandlers(): void {
  const storage = new AuthStorage()

  ipcMain.removeHandler(CHANNELS.GET)
  ipcMain.handle(CHANNELS.GET, () => storage.read())

  ipcMain.removeHandler(CHANNELS.SET)
  ipcMain.handle(CHANNELS.SET, (_evt, auth: StoredAuth) => {
    storage.write(auth)
    // Freshly logged in — warm the per-account caches that have synchronous public APIs.
    try {
      const { ModesManager } = require("./services/ModesManager")
      ModesManager.getInstance().hydrate().catch(() => {})
      const { SettingsManager } = require("./services/SettingsManager")
      SettingsManager.getInstance().hydrateFromCloud().catch(() => {})
      const { KeybindManager } = require("./services/KeybindManager")
      KeybindManager.getInstance().hydrateFromCloud().catch(() => {})
    } catch {
      /* managers may not be loaded in non-launcher windows */
    }
    return true
  })

  ipcMain.removeHandler(CHANNELS.CLEAR)
  ipcMain.handle(CHANNELS.CLEAR, () => {
    storage.clear()
    return true
  })
}

export { CHANNELS as AUTH_IPC_CHANNELS }
