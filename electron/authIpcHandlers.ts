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
    return true
  })

  ipcMain.removeHandler(CHANNELS.CLEAR)
  ipcMain.handle(CHANNELS.CLEAR, () => {
    storage.clear()
    return true
  })
}

export { CHANNELS as AUTH_IPC_CHANNELS }
