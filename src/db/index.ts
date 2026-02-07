import Dexie, { type Table } from 'dexie'
import type { LogEntry, LogAttachment, HealthProfile, LogFlag } from '../types'

/**
 * IndexedDB schema via Dexie (PR-03, PR-04, PR-09, PR-11).
 * Attachments: store as blob in separate table; url can be blob key or object URL.
 */
export class MyHealthDB extends Dexie {
  logs!: Table<LogEntry>
  attachments!: Table<LogAttachment>
  profile!: Table<HealthProfile>
  flags!: Table<LogFlag>

  constructor() {
    super('MyHealthDB')
    this.version(1).stores({
      logs: 'id, datetime, bodyRegion, createdAt',
      attachments: 'id, logId, createdAt',
      profile: 'id',
      flags: 'id, logId, createdAt',
    })
  }
}

export const db = new MyHealthDB()

/**
 * Helpers for logs (PR-03).
 */
export async function createLog(entry: Omit<LogEntry, 'createdAt' | 'updatedAt'>): Promise<LogEntry> {
  const now = new Date().toISOString()
  const full: LogEntry = {
    ...entry,
    createdAt: now,
    updatedAt: now,
  }
  await db.logs.add(full)
  return full
}

export async function updateLog(id: string, patch: Partial<Omit<LogEntry, 'id'>>): Promise<void> {
  const updatedAt = new Date().toISOString()
  await db.logs.update(id, { ...patch, updatedAt })
}

export async function deleteLog(id: string): Promise<void> {
  await db.logs.delete(id)
  await db.attachments.where('logId').equals(id).delete()
  await db.flags.where('logId').equals(id).delete()
}

export async function getLogsDesc(limit = 500): Promise<LogEntry[]> {
  return db.logs.orderBy('datetime').reverse().limit(limit).toArray()
}

export async function getLogById(id: string): Promise<LogEntry | undefined> {
  return db.logs.get(id)
}

/**
 * Profile (PR-09): single row.
 */
const DEFAULT_PROFILE: HealthProfile = {
  id: 'default',
  allergies: [],
  familyHistory: '',
  lifestyle: {},
  updatedAt: new Date().toISOString(),
}

export async function getProfile(): Promise<HealthProfile> {
  const p = await db.profile.get('default')
  return p ?? DEFAULT_PROFILE
}

export async function saveProfile(profile: HealthProfile): Promise<void> {
  const updated = { ...profile, updatedAt: new Date().toISOString() }
  await db.profile.put(updated)
}
