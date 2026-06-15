import { app, safeStorage } from "electron"
import * as fs from "fs"
import * as path from "path"

import type { Meeting } from "../db/DatabaseManager"

const FILE_NAME = "meeting-outbox.dat"

export interface OutboxEntry {
  meeting: Meeting
  startTimeMs: number
  durationMs: number
  queuedAt: number
}

/**
 * Durable local fallback for meeting saves that fail (offline / backend down at stop).
 * Entries are flushed to the cloud on next launch so a network blip never loses a meeting.
 *
 * Encrypted with the OS keychain (safeStorage) when available — transcripts can be sensitive.
 * Falls back to plaintext JSON if encryption is unavailable, because losing the meeting is
 * worse than storing it unencrypted on the user's own machine.
 */
export class MeetingOutbox {
  private readonly filePath: string

  constructor() {
    this.filePath = path.join(app.getPath("userData"), FILE_NAME)
  }

  private readAll(): OutboxEntry[] {
    if (!fs.existsSync(this.filePath)) return []
    try {
      const raw = fs.readFileSync(this.filePath)
      let json: string
      if (safeStorage.isEncryptionAvailable()) {
        try {
          json = safeStorage.decryptString(raw)
        } catch {
          json = raw.toString("utf8") // may have been written as plaintext fallback
        }
      } else {
        json = raw.toString("utf8")
      }
      const parsed = JSON.parse(json)
      return Array.isArray(parsed) ? parsed : []
    } catch (err) {
      console.warn("[MeetingOutbox] failed to read outbox, treating as empty:", err)
      return []
    }
  }

  private writeAll(entries: OutboxEntry[]): void {
    try {
      const json = JSON.stringify(entries)
      const data = safeStorage.isEncryptionAvailable()
        ? safeStorage.encryptString(json)
        : Buffer.from(json, "utf8")
      fs.writeFileSync(this.filePath, data, { mode: 0o600 })
    } catch (err) {
      console.error("[MeetingOutbox] failed to write outbox:", err)
    }
  }

  enqueue(meeting: Meeting, startTimeMs: number, durationMs: number): void {
    const entries = this.readAll()
    // De-dupe by meeting id so a retried save doesn't stack up.
    const filtered = entries.filter(e => e.meeting.id !== meeting.id)
    filtered.push({ meeting, startTimeMs, durationMs, queuedAt: Date.now() })
    this.writeAll(filtered)
    console.log(`[MeetingOutbox] queued meeting ${meeting.id} (${filtered.length} pending)`)
  }

  size(): number {
    return this.readAll().length
  }

  /**
   * Attempt to save every queued meeting via `saveFn`. Entries that save successfully are
   * removed; entries that still fail remain for the next flush.
   */
  async flush(saveFn: (entry: OutboxEntry) => Promise<void>): Promise<void> {
    const entries = this.readAll()
    if (entries.length === 0) return
    console.log(`[MeetingOutbox] flushing ${entries.length} queued meeting(s)...`)
    const remaining: OutboxEntry[] = []
    for (const entry of entries) {
      try {
        await saveFn(entry)
        console.log(`[MeetingOutbox] flushed meeting ${entry.meeting.id}`)
      } catch (err) {
        console.warn(`[MeetingOutbox] flush failed for ${entry.meeting.id}, will retry later:`, err)
        remaining.push(entry)
      }
    }
    this.writeAll(remaining)
  }
}
