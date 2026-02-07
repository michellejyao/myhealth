/**
 * Fixed set of body regions for logging (PR-01, PR-02).
 */
export const BODY_REGIONS = [
  'head',
  'neck',
  'chest',
  'abdomen',
  'back',
  'left_arm',
  'right_arm',
  'left_leg',
  'right_leg',
] as const

export type BodyRegionId = (typeof BODY_REGIONS)[number]

export const BODY_REGION_LABELS: Record<BodyRegionId, string> = {
  head: 'Head',
  neck: 'Neck',
  chest: 'Chest',
  abdomen: 'Abdomen',
  back: 'Back',
  left_arm: 'Left arm',
  right_arm: 'Right arm',
  left_leg: 'Left leg',
  right_leg: 'Right leg',
}

/**
 * Log entry (PR-03).
 */
export interface LogEntry {
  id: string
  datetime: string // ISO
  bodyRegion: BodyRegionId
  painScore: number // 0–10
  tags: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

/**
 * Attachment metadata (PR-04).
 */
export type AttachmentType = 'image' | 'video' | 'audio'

export interface LogAttachment {
  id: string
  logId: string
  type: AttachmentType
  url: string // blob URL or path
  caption?: string
  createdAt: string
}

/**
 * Health profile baseline (PR-09).
 */
export interface HealthProfile {
  id: 'default'
  allergies: string[]
  heightCm?: number
  weightKg?: number
  familyHistory: string
  lifestyle: {
    sleepHours?: number
    dietNotes?: string
    exerciseNotes?: string
  }
  updatedAt: string
}

/**
 * AI flag (PR-11, PR-12).
 */
export type FlagSeverity = 'low' | 'med' | 'high'

export interface LogFlag {
  id: string
  logId: string
  title: string
  reasoningSummary: string
  severity: FlagSeverity
  score?: number // 0–100 (PR-12)
  scoreRationale?: string
  references: string[] // log IDs or field names
  createdAt: string
}
